import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  vpc: ec2.IVpc;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.IRepository;
  public readonly fileSystem: efs.FileSystem;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // ECR Repository (if not exists, reference existing)
    this.repository = ecr.Repository.fromRepositoryName(
      this, 
      'ConduitBackendRepo', 
      'conduit-backend'
    );

    // ECS Cluster - 고정된 이름으로 생성 (기존 리소스 재사용)
    this.cluster = new ecs.Cluster(this, 'ConduitCluster', {
      vpc: props.vpc,
      clusterName: 'conduit-cluster',
      containerInsights: false, // 비용 절감
    });

    // EFS Security Group - NFS 트래픽 허용
    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: 'conduit-efs-sg',
      description: 'Security group for EFS NFS traffic',
      allowAllOutbound: false
    });

    // ECS에서 EFS로의 NFS 트래픽 허용 (포트 2049)
    efsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(2049),
      'Allow NFS traffic from ECS tasks'
    );

    // EFS 파일 시스템 생성
    this.fileSystem = new efs.FileSystem(this, 'ConduitFileSystem', {
      vpc: props.vpc,
      fileSystemName: 'conduit-efs',
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      encrypted: true, // 암호화 활성화
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS, // 7일 후 IA 클래스 전환
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 학습용 - 스택 삭제 시 EFS도 삭제
      securityGroup: efsSecurityGroup
    });

    // ALB Security Group - HTTP 트래픽 허용
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: 'conduit-alb-sg',
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
    });

    // 인터넷에서 ALB로의 HTTP 트래픽 허용 (포트 80)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // 인터넷에서 ALB로의 HTTPS 트래픽 허용 (포트 443)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Application Load Balancer 생성
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ConduitALB', {
      vpc: props.vpc,
      loadBalancerName: 'conduit-alb',
      internetFacing: true, // 인터넷 페이싱 설정
      securityGroup: albSecurityGroup,
      deletionProtection: false // 학습용 - 삭제 보호 비활성화
    });

    // ECS Task Execution Role - 고정된 이름으로 생성 (기존 리소스 재사용)
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: 'ecsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });

    // ECS Task Role - 고정된 이름으로 생성 (기존 리소스 재사용)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'ecsTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // EFS 액세스 권한 추가
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'elasticfilesystem:CreateFileSystem',
        'elasticfilesystem:CreateMountTarget',
        'elasticfilesystem:DescribeFileSystems',
        'elasticfilesystem:DescribeMountTargets',
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:ClientWrite'
      ],
      resources: ['*']
    }));

    // Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ConduitTaskDef', {
      family: 'conduit-backend',
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole
    });

    // EFS 볼륨 추가 (temporarily disabled for JWT_SECRET testing)
    // taskDefinition.addVolume({
    //   name: 'efs-volume',
    //   efsVolumeConfiguration: {
    //     fileSystemId: this.fileSystem.fileSystemId,
    //     transitEncryption: 'ENABLED',
    //     authorizationConfig: {
    //       iam: 'DISABLED' // POSIX 권한 사용
    //     }
    //   }
    // });


    // Container Definition
    const container = taskDefinition.addContainer('conduit-backend', {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'conduit-backend',
        logGroup: new logs.LogGroup(this, 'ConduitLogGroup', {
          logGroupName: '/ecs/conduit-backend',
          retention: logs.RetentionDays.ONE_DAY, // 1일 보관으로 비용 절감
          removalPolicy: cdk.RemovalPolicy.DESTROY
        })
      }),
      environment: {
        PORT: '8080',
        DATABASE_URL: '/tmp/conduit.db', // Temporary: use local storage instead of EFS
        JWT_SECRET: 'your-super-secure-jwt-secret-key-for-conduit-app-2025'
      },
      essential: true
    });

    // EFS 마운트 포인트 추가 (temporarily disabled for JWT_SECRET testing)
    // container.addMountPoints({
    //   sourceVolume: 'efs-volume',
    //   containerPath: '/mnt/efs',
    //   readOnly: false
    // });

    // Container Port Mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    // 타겟 그룹 생성 (ECS 서비스 생성 전에 미리 생성)
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'ConduitTargetGroup', {
      targetGroupName: 'conduit-tg',
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      targetType: elbv2.TargetType.IP, // Fargate는 IP 타겟 타입 사용
      healthCheck: {
        enabled: true,
        path: '/health', // 헬스체크 경로
        protocol: elbv2.Protocol.HTTP,
        port: '8080',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(30)
      }
    });


    // Fargate Service with Spot (학습용 최적화 - 1개 태스크)
    this.service = new ecs.FargateService(this, 'ConduitService', {
      cluster: this.cluster,
      taskDefinition,
      serviceName: 'conduit-backend',
      desiredCount: 1, // 비용 절감을 위해 1개로 축소
      assignPublicIp: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 100 // 100% Spot 인스턴스 사용
        }
      ],
      healthCheckGracePeriod: cdk.Duration.seconds(60) // ALB 헬스체크를 위한 grace period
    });

    // Allow HTTP traffic from ALB to ECS tasks on port 8080
    this.service.connections.allowFrom(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow HTTP traffic from ALB'
    );

    // ECS 서비스를 타겟 그룹에 연결
    this.service.attachToApplicationTargetGroup(this.targetGroup);

    // HTTP 리스너 생성 및 타겟 그룹 연결
    const httpListener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup]
    });

    // CloudFront Distribution for HTTPS support
    this.distribution = new cloudfront.Distribution(this, 'ConduitDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(this.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // API responses should not be cached
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(this.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // API responses should not be cached
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      comment: 'Conduit API CloudFront Distribution',
    });


    // Outputs
    new cdk.CfnOutput(scope, 'ECSClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: 'ConduitClusterName'
    });

    new cdk.CfnOutput(scope, 'ECSServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service Name',
      exportName: 'ConduitServiceName'
    });

    new cdk.CfnOutput(scope, 'ECRRepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: 'ConduitECRRepositoryURI'
    });

    new cdk.CfnOutput(scope, 'EFSFileSystemId', {
      value: this.fileSystem.fileSystemId,
      description: 'EFS File System ID',
      exportName: 'ConduitEFSFileSystemId'
    });

    new cdk.CfnOutput(scope, 'EFSFileSystemArn', {
      value: this.fileSystem.fileSystemArn,
      description: 'EFS File System ARN',
      exportName: 'ConduitEFSFileSystemArn'
    });

    new cdk.CfnOutput(scope, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: 'ConduitALBDNSName'
    });

    new cdk.CfnOutput(scope, 'LoadBalancerArn', {
      value: this.loadBalancer.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: 'ConduitALBArn'
    });

    new cdk.CfnOutput(scope, 'TargetGroupArn', {
      value: this.targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: 'ConduitTargetGroupArn'
    });

    new cdk.CfnOutput(scope, 'CloudFrontDomainName', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution HTTPS URL',
      exportName: 'ConduitCloudFrontURL'
    });
  }
}