import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface ApiGatewayProxyStackProps {
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class ApiGatewayProxyStack extends Construct {
  public readonly restApi: apigateway.RestApi;
  public readonly deployUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayProxyStackProps) {
    super(scope, id);

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: '/aws/apigateway/conduit-proxy',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // API Gateway REST API
    this.restApi = new apigateway.RestApi(this, 'ConduitProxyApi', {
      restApiName: 'conduit-proxy-api',
      description: 'API Gateway proxy for Conduit ECS backend',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf(),
        metricsEnabled: true,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'https://vibe-coding-paradigm.github.io',
          'http://localhost:3000'
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowCredentials: false,
        maxAge: cdk.Duration.hours(1)
      }
    });

    // Note: VPC Link is used for private ALB integration. 
    // For internet-facing ALB, we use HTTP integration directly without VPC Link.

    // Health check endpoint (direct response)
    const healthResource = this.restApi.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"status": "healthy", "service": "conduit-api-gateway"}'
        }
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL
        }
      }]
    });

    // API proxy resource (all /api/* requests)
    const apiResource = this.restApi.root.addResource('api');
    const proxyResource = apiResource.addResource('{proxy+}');

    // HTTP Integration to ALB (internet-facing, no VPC Link needed)
    const albIntegration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}/api/{proxy}`,
      {
        httpMethod: 'ANY',
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
            'integration.request.header.Authorization': 'method.request.header.Authorization',
            'integration.request.header.Content-Type': 'method.request.header.Content-Type'
          },
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
            }
          }, {
            statusCode: '400'
          }, {
            statusCode: '401'
          }, {
            statusCode: '404'
          }, {
            statusCode: '500'
          }]
        }
      }
    );

    // Add proxy method for all HTTP methods
    proxyResource.addMethod('ANY', albIntegration, {
      requestParameters: {
        'method.request.path.proxy': true,
        'method.request.header.Authorization': false,
        'method.request.header.Content-Type': false
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }, {
        statusCode: '400'
      }, {
        statusCode: '401'
      }, {
        statusCode: '404'
      }, {
        statusCode: '500'
      }]
    });

    // Direct /api method for requests without additional path
    apiResource.addMethod('ANY', new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}/api`,
      {
        httpMethod: 'ANY',
        options: {
          requestParameters: {
            'integration.request.header.Authorization': 'method.request.header.Authorization',
            'integration.request.header.Content-Type': 'method.request.header.Content-Type'
          },
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
            }
          }]
        }
      }
    ), {
      requestParameters: {
        'method.request.header.Authorization': false,
        'method.request.header.Content-Type': false
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }]
    });

    // Health check endpoint integration with ALB (reusing existing healthResource)
    const healthIntegration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}/health`,
      {
        httpMethod: 'GET',
        options: {
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
            }
          }, {
            statusCode: '500'
          }]
        }
      }
    );

    // Add additional health check method via ALB integration 
    healthResource.addMethod('POST', healthIntegration, {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }, {
        statusCode: '500'
      }]
    });

    this.deployUrl = this.restApi.url;

    // Outputs
    new cdk.CfnOutput(scope, 'ApiGatewayUrl', {
      value: this.restApi.url,
      description: 'API Gateway Proxy URL',
      exportName: 'ConduitApiGatewayUrl'
    });

    new cdk.CfnOutput(scope, 'ApiGatewayId', {
      value: this.restApi.restApiId,
      description: 'API Gateway REST API ID',
      exportName: 'ConduitApiGatewayId'
    });

    new cdk.CfnOutput(scope, 'ApiGatewayProxyBackendUrl', {
      value: `http://${props.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend ALB URL that API Gateway proxies to',
      exportName: 'ConduitApiGatewayBackendUrl'
    });
  }
}