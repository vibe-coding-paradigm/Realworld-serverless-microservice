import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import { ComputeStack } from './compute-stack';  // DISABLED: ECS infrastructure removed after serverless migration
import { ServerlessAuthStack } from './serverless-auth-stack';
import { ServerlessArticlesStack } from './serverless-articles-stack';
import { ServerlessCommentsStack } from './serverless-comments-stack';
import { CanaryMonitoringStack } from './canary-monitoring-stack';
import { MonitoringStack } from './monitoring-stack';
// import { ApiGatewayProxyStack } from './api-gateway-proxy-stack';  // DISABLED: ALB proxy no longer needed

export class ConduitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
        ArticlesResourceId: serverlessArticlesStack.articlesResource.resourceId,
        ArticleBySlugResourceId: serverlessArticlesStack.articleBySlugResource.resourceId,
      }
    });
    serverlessCommentsStack.addDependency(serverlessAuthStack);
    serverlessCommentsStack.addDependency(serverlessArticlesStack);

    // Canary Monitoring Stack for E2E tests
    const canaryMonitoringStack = new CanaryMonitoringStack(this, 'CanaryMonitoring', {
      // notificationEmail: 'your-email@example.com', // Optional: Add email for notifications
    });

    // CloudWatch Dashboard for Service Monitoring  
    const monitoringStack = new MonitoringStack(this, 'Monitoring', {
      apiGatewayId: serverlessAuthStack.api.restApiId,
      lambdaFunctions: {
        authFunction: serverlessAuthStack.registerFunction.functionName,
        articlesFunction: serverlessArticlesStack.listArticlesFunction.functionName,
        commentsFunction: serverlessCommentsStack.createCommentFunction.functionName,
      },
      dynamoDBTables: {
        usersTable: serverlessAuthStack.usersTable.tableName,
        articlesTable: serverlessArticlesStack.articlesTable.tableName,
        commentsTable: serverlessCommentsStack.commentsTable.tableName,
      }
    });
    monitoringStack.addDependency(serverlessAuthStack);
    monitoringStack.addDependency(serverlessArticlesStack);  
    monitoringStack.addDependency(serverlessCommentsStack);

    // MIGRATION COMPLETE: ECS infrastructure has been fully replaced by serverless Lambda functions
    // - No more compute-stack (ECS cluster, ALB, containers)
    // - No more api-gateway-proxy-stack (ALB proxy)
    // - Direct Lambda function integration via API Gateway

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
    new cdk.CfnOutput(this, 'MainUsersTableName', {
      value: serverlessAuthStack.usersTable.tableName,
      description: 'DynamoDB Users Table Name'
    });

    new cdk.CfnOutput(this, 'MainArticlesTableName', {
      value: serverlessArticlesStack.articlesTable.tableName,
      description: 'DynamoDB Articles Table Name'
    });

    new cdk.CfnOutput(this, 'MainCommentsTableName', {
      value: serverlessCommentsStack.commentsTable.tableName,
      description: 'DynamoDB Comments Table Name'
    });

    // MIGRATION COMPLETED: All outputs now point to serverless infrastructure
    // Legacy ECS and ALB infrastructure has been fully removed

  }
}
