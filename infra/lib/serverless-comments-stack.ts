import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ServerlessCommentsStackProps extends cdk.NestedStackProps {
  // Parameters passed from parent stack  
}

export class ServerlessCommentsStack extends cdk.NestedStack {
  public readonly api: apigateway.IRestApi;
  public readonly commentsTable: dynamodb.Table;
  public readonly listCommentsFunction: lambda.Function;
  public readonly createCommentFunction: lambda.Function;
  public readonly deleteCommentFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: ServerlessCommentsStackProps) {
    super(scope, id, props);

    // Parameters for cross-stack references
    const authApiIdParam = new cdk.CfnParameter(this, 'AuthApiId', {
      type: 'String',
      description: 'Auth API Gateway ID from Auth Stack'
    });

    const authApiRootResourceIdParam = new cdk.CfnParameter(this, 'AuthApiRootResourceId', {
      type: 'String',
      description: 'Auth API Gateway Root Resource ID from Auth Stack'
    });

    const articlesTableNameParam = new cdk.CfnParameter(this, 'ArticlesTableName', {
      type: 'String',
      description: 'Articles Table Name from Articles Stack'
    });

    // DynamoDB Comments Table with optimized design
    this.commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      tableName: 'conduit-comments',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING, // ARTICLE#<article_slug>
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING, // COMMENT#<comment_id>
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Pay-per-request for cost optimization
      pointInTimeRecovery: false, // Disable for cost savings in dev
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/learning purposes
    });

    // GSI for author-based queries  
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'AuthorIndex',
      partitionKey: {
        name: 'author_username',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Import existing Articles Table using parameter
    const articlesTable = dynamodb.Table.fromTableName(this, 'ImportedArticlesTable', 
      articlesTableNameParam.valueAsString
    );

    // Common Lambda environment variables
    const commonEnv = {
      COMMENTS_TABLE_NAME: this.commentsTable.tableName,
      ARTICLES_TABLE_NAME: articlesTableNameParam.valueAsString,
      JWT_SECRET: 'your-super-secure-jwt-secret-key-for-conduit-app-2025', // TODO: Move to AWS Secrets Manager
      NODE_ENV: 'production',
    };

    // Lambda execution role with DynamoDB permissions
    const lambdaRole = new iam.Role(this, 'CommentsLambdaRole', {
      roleName: 'conduit-comments-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add DynamoDB permissions for comments table
    this.commentsTable.grantReadWriteData(lambdaRole);
    
    // Add read permissions for articles table
    articlesTable.grantReadData(lambdaRole);

    // List Comments Lambda Function (Go)
    this.listCommentsFunction = new lambda.Function(this, 'ListCommentsFunction', {
      functionName: 'conduit-comments-list',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'list_comments',
      code: lambda.Code.fromAsset('lambda-functions/comments', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/list_comments list_comments.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'ListCommentsFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-comments-list',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Create Comment Lambda Function (Go)
    this.createCommentFunction = new lambda.Function(this, 'CreateCommentFunction', {
      functionName: 'conduit-comments-create',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'create_comment',
      code: lambda.Code.fromAsset('lambda-functions/comments', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/create_comment create_comment.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'CreateCommentFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-comments-create',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Delete Comment Lambda Function (Go)
    this.deleteCommentFunction = new lambda.Function(this, 'DeleteCommentFunction', {
      functionName: 'conduit-comments-delete',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'delete_comment',
      code: lambda.Code.fromAsset('lambda-functions/comments', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/delete_comment delete_comment.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'DeleteCommentFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-comments-delete',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Import existing API Gateway from Auth Stack using parameters
    this.api = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedAuthApi', {
      restApiId: authApiIdParam.valueAsString,
      rootResourceId: authApiRootResourceIdParam.valueAsString,
    });

    // Create articles resource hierarchy for comments
    const articlesResource = this.api.root.addResource('articles');
    const articleBySlugResource = articlesResource.addResource('{slug}');

    // Comments resource (/articles/{slug}/comments)
    const commentsResource = articleBySlugResource.addResource('comments');

    // List comments endpoint (GET /articles/{slug}/comments)
    commentsResource.addMethod('GET', new apigateway.LambdaIntegration(this.listCommentsFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Create comment endpoint (POST /articles/{slug}/comments)
    commentsResource.addMethod('POST', new apigateway.LambdaIntegration(this.createCommentFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Comment by ID resource (/articles/{slug}/comments/{id})
    const commentByIdResource = commentsResource.addResource('{id}');

    // Delete comment endpoint (DELETE /articles/{slug}/comments/{id})
    commentByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.deleteCommentFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Outputs for integration with existing infrastructure
    // Note: URL is not available for imported APIs, use Auth stack's URL instead
    
    new cdk.CfnOutput(scope, 'ServerlessCommentsApiId', {
      value: this.api.restApiId,
      description: 'Comments API Gateway ID (shared with existing services)',
      exportName: 'ConduitCommentsApiId',
    });

    new cdk.CfnOutput(scope, 'CommentsTableName', {
      value: this.commentsTable.tableName,
      description: 'DynamoDB Comments Table Name',
      exportName: 'ConduitCommentsTableName',
    });

    new cdk.CfnOutput(scope, 'CommentsTableArn', {
      value: this.commentsTable.tableArn,
      description: 'DynamoDB Comments Table ARN',
      exportName: 'ConduitCommentsTableArn',
    });
  }
}