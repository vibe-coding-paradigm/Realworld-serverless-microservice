import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  vpc: ec2.IVpc;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.IRepository;
  public readonly fileSystem: efs.FileSystem;

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
        'elasticfilesystem:DescribeMountTargets'
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

    // EFS 볼륨 추가
    taskDefinition.addVolume({
      name: 'efs-volume',
      efsVolumeConfiguration: {
        fileSystemId: this.fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          iam: 'DISABLED' // POSIX 권한 사용
        }
      }
    });


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
        DATABASE_URL: '/mnt/efs/conduit.db'
      },
      essential: true
    });

    // EFS 마운트 포인트 추가
    container.addMountPoints({
      sourceVolume: 'efs-volume',
      containerPath: '/mnt/efs',
      readOnly: false
    });

    // Container Port Mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
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
      ]
    });

    // Allow HTTP traffic on port 8080
    this.service.connections.allowFromAnyIpv4(ec2.Port.tcp(8080), 'Allow HTTP traffic on port 8080');


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
  }
}