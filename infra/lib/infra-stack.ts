import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
import { ServerlessAuthStack } from './serverless-auth-stack';

export class ConduitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get default VPC
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true
    });

    // Compute Stack (ECS/Fargate)
    const computeStack = new ComputeStack(this, 'Compute', {
      vpc: vpc
    });

    // Serverless Authentication Stack (API Gateway + Lambda + DynamoDB)
    const serverlessAuthStack = new ServerlessAuthStack(this, 'ServerlessAuth', {});

    // Output important values
    new cdk.CfnOutput(this, 'ClusterName', {
      value: computeStack.cluster.clusterName,
      description: 'ECS Cluster Name'
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: computeStack.service.serviceName,
      description: 'ECS Service Name'
    });

    // Serverless Auth Stack Outputs
    new cdk.CfnOutput(this, 'AuthApiUrl', {
      value: serverlessAuthStack.api.url,
      description: 'Authentication API Gateway URL'
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: serverlessAuthStack.usersTable.tableName,
      description: 'DynamoDB Users Table Name'
    });

  }
}
