import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
import { ServerlessAuthStack } from './serverless-auth-stack';
import { ServerlessArticlesStack } from './serverless-articles-stack';
import { ServerlessCommentsStack } from './serverless-comments-stack';

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

    // Serverless Articles Stack (API Gateway + Lambda + DynamoDB)
    const serverlessArticlesStack = new ServerlessArticlesStack(this, 'ServerlessArticles', {
      authApi: serverlessAuthStack.api, // Use the same API Gateway as auth
    });

    // Serverless Comments Stack (API Gateway + Lambda + DynamoDB)
    const serverlessCommentsStack = new ServerlessCommentsStack(this, 'ServerlessComments', {
      existingApi: serverlessArticlesStack.api, // Use the same API Gateway as articles/auth
      articlesTable: serverlessArticlesStack.articlesTable, // Reference to articles table for validation
      existingArticlesResource: serverlessArticlesStack.articlesResource, // Existing /articles resource
      existingSlugResource: serverlessArticlesStack.articleBySlugResource, // Existing /articles/{slug} resource
    });

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

    // Serverless Articles Stack Outputs  
    new cdk.CfnOutput(this, 'CombinedApiUrl', {
      value: serverlessArticlesStack.api.url,
      description: 'Combined API Gateway URL (Auth + Articles)'
    });

    new cdk.CfnOutput(this, 'ArticlesTableName', {
      value: serverlessArticlesStack.articlesTable.tableName,
      description: 'DynamoDB Articles Table Name'
    });

    // Serverless Comments Stack Outputs
    new cdk.CfnOutput(this, 'CommentsTableName', {
      value: serverlessCommentsStack.commentsTable.tableName,
      description: 'DynamoDB Comments Table Name'
    });

  }
}
