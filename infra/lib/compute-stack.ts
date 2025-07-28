import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
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

    // ECS Task Role - 고정된 이름으로 생성 (기존 리소스 재사용)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'ecsTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ConduitTaskDef', {
      family: 'conduit-backend',
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole
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
        DATABASE_URL: '/tmp/conduit.db'
      },
      essential: true
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
  }
}