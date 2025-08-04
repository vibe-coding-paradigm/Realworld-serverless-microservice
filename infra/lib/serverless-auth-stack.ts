import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ServerlessAuthStackProps extends cdk.NestedStackProps {
  // 기존 API Gateway와의 통합을 위한 props
  existingApi?: apigateway.RestApi;
}

export class ServerlessAuthStack extends cdk.NestedStack {
  public readonly api: apigateway.RestApi;
  public readonly usersTable: dynamodb.Table;
  public readonly registerFunction: lambda.Function;
  public readonly loginFunction: lambda.Function;
  public readonly getUserFunction: lambda.Function;
  public readonly usersResource: apigateway.Resource;
  public readonly userResource: apigateway.Resource;

  constructor(scope: Construct, id: string, props?: ServerlessAuthStackProps) {
    super(scope, id);

    // DynamoDB Users Table with optimized design
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'conduit-users',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING, // USER#<user_id>
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING, // METADATA | EMAIL#<email> | USERNAME#<username>
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Pay-per-request for cost optimization
      pointInTimeRecovery: false, // Disable for cost savings in dev
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/learning purposes
    });

    // GSI for email-based queries
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for username-based queries  
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'UsernameIndex',
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Common Lambda environment variables
    const commonEnv = {
      USERS_TABLE_NAME: this.usersTable.tableName,
      JWT_SECRET: 'your-super-secure-jwt-secret-key-for-conduit-app-2025', // TODO: Move to AWS Secrets Manager
      NODE_ENV: 'production',
    };

    // Lambda execution role with DynamoDB permissions
    const lambdaRole = new iam.Role(this, 'AuthLambdaRole', {
      roleName: 'conduit-auth-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add DynamoDB permissions
    this.usersTable.grantReadWriteData(lambdaRole);

    // Register Lambda Function (Go)
    this.registerFunction = new lambda.Function(this, 'RegisterFunction', {
      functionName: 'conduit-auth-register',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'register',
      code: lambda.Code.fromAsset('lambda-functions/auth', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/register register.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'RegisterFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-auth-register',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Login Lambda Function (Go)
    this.loginFunction = new lambda.Function(this, 'LoginFunction', {
      functionName: 'conduit-auth-login',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'login',
      code: lambda.Code.fromAsset('lambda-functions/auth', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/login login.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'LoginFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-auth-login',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Get User Lambda Function (Go)
    this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      functionName: 'conduit-auth-getuser',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'getuser',
      code: lambda.Code.fromAsset('lambda-functions/auth', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: [
            'bash', '-c',
            'cd /asset-input && GOOS=linux GOARCH=amd64 go build -o /asset-output/getuser getuser.go'
          ],
        },
      }),
      environment: commonEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, 'GetUserFunctionLogs', {
        logGroupName: '/aws/lambda/conduit-auth-getuser',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Use existing API Gateway or create new one
    if (props?.existingApi) {
      this.api = props.existingApi;
    } else {
      // Create new API Gateway REST API if no existing API provided
      this.api = new apigateway.RestApi(this, 'AuthApi', {
        restApiName: 'conduit-auth-api',
        description: 'Conduit Authentication Microservice API',
        deployOptions: {
          stageName: 'v1',
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: [
            'https://vibe-coding-paradigm.github.io',
            'http://localhost:3000',
          ],
          allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
          allowHeaders: [
            'Content-Type',
            'Authorization',
            'X-Amz-Date',
            'X-Api-Key',
            'X-Amz-Security-Token',
          ],
          allowCredentials: true,
        },
      });
    }

    // Users resource (/users)
    this.usersResource = this.api.root.addResource('users');

    // Register endpoint (POST /users)
    this.usersResource.addMethod('POST', new apigateway.LambdaIntegration(this.registerFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Login endpoint (POST /users/login)
    const loginResource = this.usersResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(this.loginFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // User resource (/user)
    this.userResource = this.api.root.addResource('user');

    // Get user endpoint (GET /user)
    this.userResource.addMethod('GET', new apigateway.LambdaIntegration(this.getUserFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Update user endpoint (PUT /user)
    this.userResource.addMethod('PUT', new apigateway.LambdaIntegration(this.getUserFunction, {
      proxy: true,
      allowTestInvoke: true,
    }));

    // Outputs for integration with existing infrastructure
    new cdk.CfnOutput(scope, 'ServerlessAuthApiUrl', {
      value: this.api.url,
      description: 'Auth API Gateway URL (shared with other services)',
      exportName: 'ConduitAuthApiUrl',
    });

    new cdk.CfnOutput(scope, 'ServerlessAuthApiId', {
      value: this.api.restApiId,
      description: 'Auth API Gateway ID (shared with other services)',
      exportName: 'ConduitAuthApiId',
    });

    new cdk.CfnOutput(scope, 'ServerlessAuthApiRootResourceId', {
      value: this.api.restApiRootResourceId,
      description: 'Auth API Gateway Root Resource ID (shared with other services)',
      exportName: 'ConduitAuthApiRootResourceId',
    });

    new cdk.CfnOutput(scope, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB Users Table Name',
      exportName: 'ConduitUsersTableName',
    });

    new cdk.CfnOutput(scope, 'UsersTableArn', {
      value: this.usersTable.tableArn,
      description: 'DynamoDB Users Table ARN',
      exportName: 'ConduitUsersTableArn',
    });
  }
}