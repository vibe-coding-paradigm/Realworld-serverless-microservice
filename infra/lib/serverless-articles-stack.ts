import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ServerlessArticlesStackProps extends cdk.NestedStackProps {
  // Parameters passed from parent stack
}

export class ServerlessArticlesStack extends cdk.NestedStack {
  public readonly api: apigateway.IRestApi;
  public readonly articlesTable: dynamodb.Table;
  public readonly listArticlesFunction: lambda.Function;
  public readonly getArticleFunction: lambda.Function;
  public readonly createArticleFunction: lambda.Function;
  public readonly updateArticleFunction: lambda.Function;
  public readonly deleteArticleFunction: lambda.Function;
  public readonly favoriteArticleFunction: lambda.Function;
  public readonly articlesResource: apigateway.Resource;
  public readonly articleBySlugResource: apigateway.Resource;

  constructor(scope: Construct, id: string, props?: ServerlessArticlesStackProps) {
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

    // DynamoDB Articles Table with optimized design for both articles and favorites
    this.articlesTable = new dynamodb.Table(this, 'ArticlesTable', {
      tableName: 'conduit-articles',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING, // ARTICLE#<article_id> | USER#<user_id>
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING, // METADATA | FAVORITE#<article_id>
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Pay-per-request for cost optimization
      pointInTimeRecovery: false, // Disable for cost savings in dev
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/learning purposes
    });

    // GSI for slug-based queries
    this.articlesTable.addGlobalSecondaryIndex({
      indexName: 'SlugIndex',
      partitionKey: {
        name: 'slug',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for author-based queries  
    this.articlesTable.addGlobalSecondaryIndex({
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

    // Common Lambda environment variables
    const commonEnv = {
      ARTICLES_TABLE_NAME: this.articlesTable.tableName,
      JWT_SECRET: 'your-super-secure-jwt-secret-key-for-conduit-app-2025', // TODO: Move to AWS Secrets Manager
      NODE_ENV: 'production',
    };

    // Lambda execution role with DynamoDB permissions
    const lambdaRole = new iam.Role(this, 'ArticlesLambdaRole', {
      roleName: 'conduit-articles-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add DynamoDB permissions
    this.articlesTable.grantReadWriteData(lambdaRole);

    // List Articles Lambda Function (Go)
    this.listArticlesFunction = new lambda.Function(this, 'ListArticlesFunction', {
      functionName: 'conduit-articles-list',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap list_articles.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'ListArticlesFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-list',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Get Article Lambda Function (Go)
    this.getArticleFunction = new lambda.Function(this, 'GetArticleFunction', {
      functionName: 'conduit-articles-get',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap get_article.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'GetArticleFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-get',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Create Article Lambda Function (Go)
    this.createArticleFunction = new lambda.Function(this, 'CreateArticleFunction', {
      functionName: 'conduit-articles-create',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap create_article.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'CreateArticleFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-create',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Update Article Lambda Function (Go)
    this.updateArticleFunction = new lambda.Function(this, 'UpdateArticleFunction', {
      functionName: 'conduit-articles-update',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap update_article.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'UpdateArticleFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-update',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Delete Article Lambda Function (Go)
    this.deleteArticleFunction = new lambda.Function(this, 'DeleteArticleFunction', {
      functionName: 'conduit-articles-delete',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap delete_article.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'DeleteArticleFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-delete',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Favorite Article Lambda Function (Go)
    this.favoriteArticleFunction = new lambda.Function(this, 'FavoriteArticleFunction', {
      functionName: 'conduit-articles-favorite',
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('lambda-functions/articles', {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap favorite_article.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'FavoriteArticleFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-articles-favorite',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Import existing API Gateway from Auth Stack using parameters
    this.api = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedAuthApi', {
      restApiId: authApiIdParam.valueAsString,
      rootResourceId: authApiRootResourceIdParam.valueAsString,
    });

    // Articles resource (/articles)
    this.articlesResource = this.api.root.addResource('articles');

    // List articles endpoint (GET /articles)
    this.articlesResource.addMethod('GET', new apigateway.LambdaIntegration(this.listArticlesFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Create article endpoint (POST /articles)
    this.articlesResource.addMethod('POST', new apigateway.LambdaIntegration(this.createArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Article by slug resource (/articles/{slug})
    this.articleBySlugResource = this.articlesResource.addResource('{slug}');

    // Get article endpoint (GET /articles/{slug})
    this.articleBySlugResource.addMethod('GET', new apigateway.LambdaIntegration(this.getArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Update article endpoint (PUT /articles/{slug})
    this.articleBySlugResource.addMethod('PUT', new apigateway.LambdaIntegration(this.updateArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Delete article endpoint (DELETE /articles/{slug})
    this.articleBySlugResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.deleteArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Favorite/unfavorite resource (/articles/{slug}/favorite)
    const favoriteResource = this.articleBySlugResource.addResource('favorite');

    // Favorite article endpoint (POST /articles/{slug}/favorite)
    favoriteResource.addMethod('POST', new apigateway.LambdaIntegration(this.favoriteArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Unfavorite article endpoint (DELETE /articles/{slug}/favorite)
    favoriteResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.favoriteArticleFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Outputs for integration with existing infrastructure
    // Note: URL is not available for imported APIs, use Auth stack's URL instead
    
    new cdk.CfnOutput(this, 'ServerlessArticlesApiId', {
      value: this.api.restApiId,
      description: 'Articles API Gateway ID (shared with Auth)',
      exportName: 'ConduitArticlesApiId',
    });

    new cdk.CfnOutput(this, 'ArticlesTableName', {
      value: this.articlesTable.tableName,
      description: 'DynamoDB Articles Table Name',
      exportName: 'ConduitArticlesTableName',
    });

    new cdk.CfnOutput(this, 'ArticlesTableArn', {
      value: this.articlesTable.tableArn,
      description: 'DynamoDB Articles Table ARN',
      exportName: 'ConduitArticlesTableArn',
    });

    // Export resource IDs for Comments stack integration
    new cdk.CfnOutput(this, 'ArticlesResourceId', {
      value: this.articlesResource.resourceId,
      description: 'Articles Resource ID for integration',  
      exportName: 'ConduitArticlesResourceId',
    });

    new cdk.CfnOutput(this, 'ArticleBySlugResourceId', {
      value: this.articleBySlugResource.resourceId,
      description: 'Article by Slug Resource ID for integration',
      exportName: 'ConduitArticleBySlugResourceId',
    });
  }
}