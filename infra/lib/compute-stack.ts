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
  fileSystem: efs.FileSystem;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.IRepository;

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

    // ECS Task Execution Role - 고정된 이름으로 생성 (기존 리소스 재사용)
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: 'ecsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });

    // ECS Task Role (for EFS access) - 고정된 이름으로 생성 (기존 리소스 재사용)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'ecsTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        EFSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'elasticfilesystem:CreateAccessPoint',
                'elasticfilesystem:DeleteAccessPoint',
                'elasticfilesystem:DescribeAccessPoints',
                'elasticfilesystem:DescribeFileSystems'
              ],
              resources: [props.fileSystem.fileSystemArn]
            })
          ]
        })
      }
    });

    // Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ConduitTaskDef', {
      family: 'conduit-backend',
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole
    });

    // EFS Volume
    const efsVolume: ecs.Volume = {
      name: 'conduit-efs-volume',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        transitEncryption: 'DISABLED' // 성능 우선, 비용 절감
      }
    };
    taskDefinition.addVolume(efsVolume);

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

    // Container Port Mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    // Mount EFS Volume
    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: efsVolume.name!,
      readOnly: false
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

    // Allow EFS access from ECS tasks
    props.fileSystem.connections.allowDefaultPortFrom(
      this.service.connections
    );

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
  }
}