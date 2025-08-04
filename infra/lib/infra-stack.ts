import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
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

    // Compute Stack (ECS/Fargate)
    const computeStack = new ComputeStack(this, 'Compute', {
      vpc: vpc
    });

    // Temporarily disable serverless stacks to focus on API Gateway proxy
    // TODO: Re-enable after fixing Go 1.23 toolchain issue
    // const serverlessArticlesStack = new ServerlessArticlesStack(this, 'ServerlessArticles', {});
    // const serverlessCommentsStack = new ServerlessCommentsStack(this, 'ServerlessComments', {
    //   existingApi: serverlessArticlesStack.api,
    //   articlesTable: serverlessArticlesStack.articlesTable,
    //   existingArticlesResource: serverlessArticlesStack.articlesResource,
    //   existingSlugResource: serverlessArticlesStack.articleBySlugResource,
    // });

    // API Gateway Proxy Stack (Proxy to ECS backend)
    const apiGatewayProxyStack = new ApiGatewayProxyStack(this, 'ApiGatewayProxy', {
      loadBalancer: computeStack.loadBalancer
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

    // Temporarily disabled serverless outputs
    // TODO: Re-enable after fixing Go 1.23 toolchain issue
    // new cdk.CfnOutput(this, 'CombinedApiUrl', {
    //   value: serverlessArticlesStack.api.url,
    //   description: 'Serverless API Gateway URL (Articles + Auth + Comments)'
    // });
    // new cdk.CfnOutput(this, 'ArticlesTableName', {
    //   value: serverlessArticlesStack.articlesTable.tableName,
    //   description: 'DynamoDB Articles Table Name'
    // });
    // new cdk.CfnOutput(this, 'CommentsTableName', {
    //   value: serverlessCommentsStack.commentsTable.tableName,
    //   description: 'DynamoDB Comments Table Name'
    // });

    // API Gateway Proxy Stack Outputs
    new cdk.CfnOutput(this, 'ProxyApiUrl', {
      value: apiGatewayProxyStack.restApi.url,
      description: 'API Gateway Proxy URL for ECS backend'
    });

  }
}
