import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
import { ServerlessAuthStack } from './serverless-auth-stack';
import { ServerlessArticlesStack } from './serverless-articles-stack';
import { ServerlessCommentsStack } from './serverless-comments-stack';
import { ApiGatewayProxyStack } from './api-gateway-proxy-stack';

export class ConduitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get default VPC
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true
    });

    // Serverless Auth Stack - Creates shared API Gateway
    const serverlessAuthStack = new ServerlessAuthStack(this, 'ServerlessAuth', {});

    // Serverless Articles Stack (uses exports from Auth stack)
    const serverlessArticlesStack = new ServerlessArticlesStack(this, 'ServerlessArticles', {
      parameters: {
        AuthApiId: serverlessAuthStack.api.restApiId,
        AuthApiRootResourceId: serverlessAuthStack.api.restApiRootResourceId,
      }
    });
    serverlessArticlesStack.addDependency(serverlessAuthStack);

    // Serverless Comments Stack (uses exports from Auth and Articles stacks)  
    const serverlessCommentsStack = new ServerlessCommentsStack(this, 'ServerlessComments', {
      parameters: {
        AuthApiId: serverlessAuthStack.api.restApiId,
        AuthApiRootResourceId: serverlessAuthStack.api.restApiRootResourceId,
        ArticlesTableName: serverlessArticlesStack.articlesTable.tableName,
      }
    });
    serverlessCommentsStack.addDependency(serverlessAuthStack);
    serverlessCommentsStack.addDependency(serverlessArticlesStack);

    // Keep ECS infrastructure for backward compatibility during migration
    const computeStack = new ComputeStack(this, 'Compute', {
      vpc: vpc
    });

    // API Gateway Proxy Stack (now proxies to Lambda instead of ECS)
    const apiGatewayProxyStack = new ApiGatewayProxyStack(this, 'ApiGatewayProxy', {
      loadBalancer: computeStack.loadBalancer
    });

    // Output important values
    
    // Primary Serverless API (Main API Gateway for Lambda functions)
    new cdk.CfnOutput(this, 'ServerlessApiUrl', {
      value: serverlessAuthStack.api.url,
      description: 'Primary Serverless API Gateway URL (Auth + Articles + Comments)'
    });

    new cdk.CfnOutput(this, 'ServerlessApiId', {
      value: serverlessAuthStack.api.restApiId,
      description: 'Primary Serverless API Gateway ID'
    });

    // DynamoDB Tables
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: serverlessAuthStack.usersTable.tableName,
      description: 'DynamoDB Users Table Name'
    });

    new cdk.CfnOutput(this, 'ArticlesTableName', {
      value: serverlessArticlesStack.articlesTable.tableName,
      description: 'DynamoDB Articles Table Name'
    });

    new cdk.CfnOutput(this, 'CommentsTableName', {
      value: serverlessCommentsStack.commentsTable.tableName,
      description: 'DynamoDB Comments Table Name'
    });

    // Legacy ECS infrastructure (kept for backward compatibility)
    new cdk.CfnOutput(this, 'LegacyClusterName', {
      value: computeStack.cluster.clusterName,
      description: 'Legacy ECS Cluster Name (for backward compatibility)'
    });

    new cdk.CfnOutput(this, 'LegacyServiceName', {
      value: computeStack.service.serviceName,
      description: 'Legacy ECS Service Name (for backward compatibility)'
    });

    // Legacy API Gateway Proxy (now secondary)
    new cdk.CfnOutput(this, 'LegacyProxyApiUrl', {
      value: apiGatewayProxyStack.restApi.url,
      description: 'Legacy API Gateway Proxy URL (for ECS fallback)'
    });

  }
}
