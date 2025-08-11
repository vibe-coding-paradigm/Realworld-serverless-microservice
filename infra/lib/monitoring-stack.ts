import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  apiGatewayId: string;
  apiGatewayName: string;
  lambdaFunctions: {
    authFunction: string;
    articlesFunction: string;
    commentsFunction: string;
  };
  dynamoDBTables: {
    usersTable: string;
    articlesTable: string;
    commentsTable: string;
  };
  /**
   * Email for alarm notifications
   */
  notificationEmail?: string;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;
  public lambdaErrorAlarm: cloudwatch.Alarm;
  public apiGatewayErrorAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'ServiceAlertTopic', {
      topicName: 'conduit-service-alerts',
      displayName: 'Conduit Service Monitoring Alerts',
    });

    // Add email subscription if provided
    if (props.notificationEmail) {
      this.alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create Alarms
    this.createAlarms(props);

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'RealWorldServiceMonitor', {
      dashboardName: 'RealWorld-Service-Monitor',
    });

    // Add dashboard sections with clear separation
    this.addSystemOverviewSection(props);
    this.addCanaryTestingSection();
    this.addLambdaSection(props.lambdaFunctions);
    this.addApiGatewaySection(props.apiGatewayId, props.apiGatewayName);
    this.addDynamoDBSection(props.dynamoDBTables);

    // Output dashboard URL
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: 'RealWorldDashboardUrl'
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      description: 'SNS Topic ARN for service alerts',
      value: this.alertTopic.topicArn,
    });

    // Tags
    cdk.Tags.of(this).add('Component', 'Monitoring');
    cdk.Tags.of(this).add('Type', 'Service');
  }

  private createAlarms(props: MonitoringStackProps) {
    // Lambda Error Rate Alarm
    this.lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorRateAlarm', {
      alarmName: 'RealWorld-Lambda-ErrorRate-High',
      alarmDescription: 'Lambda functions error rate is above 5%',
      metric: new cloudwatch.MathExpression({
        expression: '(errors / invocations) * 100',
        usingMetrics: {
          errors: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          invocations: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
        label: 'Error Rate (%)',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // API Gateway Error Rate Alarm
    this.apiGatewayErrorAlarm = new cloudwatch.Alarm(this, 'ApiGatewayErrorRateAlarm', {
      alarmName: 'RealWorld-API-ErrorRate-High',
      alarmDescription: 'API Gateway error rate is above 1%',
      metric: new cloudwatch.MathExpression({
        expression: '((errors4xx + errors5xx) / count) * 100',
        usingMetrics: {
          count: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: 'conduit-auth-api',
              Stage: 'v1',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          errors4xx: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: 'conduit-auth-api',
              Stage: 'v1',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          errors5xx: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: 'conduit-auth-api',
              Stage: 'v1',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
        label: 'Error Rate (%)',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Connect alarms to SNS topic
    this.lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );
    this.apiGatewayErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );
  }

  private addLambdaMonitoringWidgets(lambdaFunctions: { authFunction: string; articlesFunction: string; commentsFunction: string }) {
    // Lambda Duration Chart
    const lambdaDurationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Function Duration',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: lambdaFunctions.authFunction,
          },
          statistic: 'Average',
          label: 'Auth Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: lambdaFunctions.articlesFunction,
          },
          statistic: 'Average',
          label: 'Articles Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: lambdaFunctions.commentsFunction,
          },
          statistic: 'Average',
          label: 'Comments Service',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Lambda Invocations Chart
    const lambdaInvocationsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Function Invocations',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: lambdaFunctions.authFunction,
          },
          statistic: 'Sum',
          label: 'Auth Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: lambdaFunctions.articlesFunction,
          },
          statistic: 'Sum',
          label: 'Articles Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: lambdaFunctions.commentsFunction,
          },
          statistic: 'Sum',
          label: 'Comments Service',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Lambda Errors Chart
    const lambdaErrorsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Function Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: lambdaFunctions.authFunction,
          },
          statistic: 'Sum',
          label: 'Auth Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: lambdaFunctions.articlesFunction,
          },
          statistic: 'Sum',
          label: 'Articles Service',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: lambdaFunctions.commentsFunction,
          },
          statistic: 'Sum',
          label: 'Comments Service',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add Lambda widgets to dashboard
    this.dashboard.addWidgets(
      lambdaDurationWidget,
      lambdaInvocationsWidget,
      lambdaErrorsWidget
    );
  }

  private addApiGatewaySection(apiGatewayId: string, apiGatewayName: string) {
    // Section header
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# 🌐 API Gateway\n\nAPI request metrics, latency, and error rates across all endpoints.',
        width: 24,
        height: 2,
      })
    );

    this.addApiGatewayMonitoringWidgets(apiGatewayId, apiGatewayName);
    this.addApiEndpointDetails(apiGatewayName);
  }

  private addApiGatewayMonitoringWidgets(apiGatewayId: string, apiGatewayName: string) {
    // API Gateway Request Count
    const apiRequestCountWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: 'conduit-auth-api',
            Stage: 'v1',
          },
          statistic: 'Sum',
          label: 'Total Requests',
        }),
      ],
      width: 8,
      height: 6,
    });

    // API Gateway Latency
    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: 'conduit-auth-api',
            Stage: 'v1',
          },
          statistic: 'Average',
          label: 'Average Latency',
        }),
      ],
      width: 8,
      height: 6,
    });

    // API Gateway Errors
    const apiErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: 'conduit-auth-api',
            Stage: 'v1',
          },
          statistic: 'Sum',
          label: '4XX Errors',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: 'conduit-auth-api',
            Stage: 'v1',
          },
          statistic: 'Sum',
          label: '5XX Errors',
        }),
      ],
      width: 8,
      height: 6,
    });

    // Add API Gateway widgets to dashboard
    this.dashboard.addWidgets(
      apiRequestCountWidget,
      apiLatencyWidget,
      apiErrorsWidget
    );
  }

  private addDynamoDBSection(tables: { usersTable: string; articlesTable: string; commentsTable: string }) {
    // Section header
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# 🗄️ DynamoDB Tables\n\nDatabase capacity usage, throttling, and performance metrics.',
        width: 24,
        height: 2,
      })
    );

    this.addDynamoDBMonitoringWidgets(tables);
  }

  private addDynamoDBMonitoringWidgets(tables: { usersTable: string; articlesTable: string; commentsTable: string }) {
    // DynamoDB Read Capacity
    const dynamoReadWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Read Capacity Usage',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: tables.usersTable,
          },
          statistic: 'Sum',
          label: 'Users Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: tables.articlesTable,
          },
          statistic: 'Sum',
          label: 'Articles Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: tables.commentsTable,
          },
          statistic: 'Sum',
          label: 'Comments Table',
        }),
      ],
      width: 8,
      height: 6,
    });

    // DynamoDB Write Capacity
    const dynamoWriteWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Write Capacity Usage',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: tables.usersTable,
          },
          statistic: 'Sum',
          label: 'Users Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: tables.articlesTable,
          },
          statistic: 'Sum',
          label: 'Articles Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: tables.commentsTable,
          },
          statistic: 'Sum',
          label: 'Comments Table',
        }),
      ],
      width: 8,
      height: 6,
    });

    // DynamoDB Throttles
    const dynamoThrottleWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB Throttled Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tables.usersTable,
          },
          statistic: 'Sum',
          label: 'Users Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tables.articlesTable,
          },
          statistic: 'Sum',
          label: 'Articles Table',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: tables.commentsTable,
          },
          statistic: 'Sum',
          label: 'Comments Table',
        }),
      ],
      width: 8,
      height: 6,
    });

    // Add DynamoDB widgets to dashboard
    this.dashboard.addWidgets(
      dynamoReadWidget,
      dynamoWriteWidget,
      dynamoThrottleWidget
    );
  }

  private addSystemOverviewSection(props: MonitoringStackProps) {
    // Section header
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# 🎯 System Overview\n\nHigh-level system health metrics and alerts status.',
        width: 24,
        height: 2,
      })
    );
    // System Health Overview - Number widgets
    const systemOverviewWidget = new cloudwatch.Row(
      new cloudwatch.SingleValueWidget({
        title: 'Total Requests (1h)',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: 'conduit-auth-api',
              Stage: 'v1',
            },
            statistic: 'Sum',
            period: cdk.Duration.hours(1),
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Avg Response Time (5m)',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway', 
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: 'conduit-auth-api',
              Stage: 'v1',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Error Rate (1h)',
        metrics: [
          new cloudwatch.MathExpression({
            expression: '(e1 + e2) / m1 * 100',
            usingMetrics: {
              e1: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                  Stage: 'v1',
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
              e2: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                  Stage: 'v1',
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
              m1: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                  Stage: 'v1',
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
            },
            label: 'Error Rate %',
          }),
        ],
        width: 6,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Lambda Errors (1h)',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: cdk.Duration.hours(1),
          }),
        ],
        width: 6,
        height: 4,
      })
    );

    this.dashboard.addWidgets(systemOverviewWidget);
  }

  private addCanaryTestingSection() {
    // Section header
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# 🧪 Canary Testing (E2E)\n\nEnd-to-end test results and API endpoint monitoring.',
        width: 24,
        height: 2,
      })
    );

    // E2E Test Success Rate
    const canarySuccessWidget = new cloudwatch.GraphWidget({
      title: 'E2E Test Success Rate',
      left: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'SuccessRate',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          label: 'Success Rate (%)',
        }),
      ],
      width: 12,
      height: 6,
    });

    // E2E Test Response Time
    const canaryResponseTimeWidget = new cloudwatch.GraphWidget({
      title: 'E2E Test Response Time',
      left: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'ResponseTime',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          label: 'Response Time (ms)',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Current test status
    const canaryStatusWidget = new cloudwatch.SingleValueWidget({
      title: 'Current Success Rate',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'SuccessRate',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 4,
    });

    const canaryCountWidget = new cloudwatch.SingleValueWidget({
      title: 'Total Tests (Last 5min)',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'TestCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 4,
    });

    const canaryFailuresWidget = new cloudwatch.SingleValueWidget({
      title: 'Failed Tests (Last 5min)',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'FailedTests',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 4,
    });

    // Test Results (Passed vs Failed)
    const canaryTestResultsWidget = new cloudwatch.GraphWidget({
      title: 'Test Results (Passed vs Failed)',
      left: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'PassedTests',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: 'Passed Tests',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'Conduit/E2E',
          metricName: 'FailedTests',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: 'Failed Tests',
        }),
      ],
      width: 12,
      height: 6,
    });

    this.dashboard.addWidgets(
      canarySuccessWidget,
      canaryResponseTimeWidget,
      canaryTestResultsWidget
    );

    // Status summary row
    this.dashboard.addWidgets(
      canaryStatusWidget,
      canaryCountWidget,
      canaryFailuresWidget
    );
  }

  private addLambdaSection(lambdaFunctions: { authFunction: string; articlesFunction: string; commentsFunction: string }) {
    // Section header
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# ⚡ Lambda Functions\n\nServerless function performance, invocations, and error tracking.',
        width: 24,
        height: 2,
      })
    );

    this.addLambdaMonitoringWidgets(lambdaFunctions);
  }

  private addApiEndpointDetails(apiGatewayName: string) {
    // API Endpoints based on RealWorld spec
    const apiEndpoints = [
      { method: 'POST', resource: 'users', label: 'POST /users (Register)' },
      { method: 'POST', resource: 'users/login', label: 'POST /users/login' },
      { method: 'GET', resource: 'user', label: 'GET /user' },
      { method: 'PUT', resource: 'user', label: 'PUT /user' },
      { method: 'GET', resource: 'articles', label: 'GET /articles' },
      { method: 'GET', resource: 'articles/{slug}', label: 'GET /articles/:slug' },
      { method: 'POST', resource: 'articles', label: 'POST /articles' },
      { method: 'PUT', resource: 'articles/{slug}', label: 'PUT /articles/:slug' },
      { method: 'DELETE', resource: 'articles/{slug}', label: 'DELETE /articles/:slug' },
      { method: 'POST', resource: 'articles/{slug}/favorite', label: 'POST /articles/:slug/favorite' },
      { method: 'DELETE', resource: 'articles/{slug}/favorite', label: 'DELETE /articles/:slug/favorite' },
      { method: 'GET', resource: 'articles/{slug}/comments', label: 'GET /articles/:slug/comments' },
      { method: 'POST', resource: 'articles/{slug}/comments', label: 'POST /articles/:slug/comments' },
      { method: 'DELETE', resource: 'articles/{slug}/comments/{id}', label: 'DELETE /articles/:slug/comments/:id' },
    ];

    // Add API Gateway overview widget
    const apiOverviewWidget = new cloudwatch.GraphWidget({
      title: 'All API Endpoints - Requests & Errors',
      left: apiEndpoints.slice(0, 7).map(api => new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Count',
        dimensionsMap: { 
          ApiName: apiGatewayName,
          Method: api.method,
          Resource: api.resource,
          Stage: 'v1'
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${api.label}`,
      })),
      right: [
        ...apiEndpoints.slice(0, 7).map(api => new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { 
            ApiName: apiGatewayName,
            Method: api.method,
            Resource: api.resource,
            Stage: 'v1'
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: `${api.label} - 4XX`,
        })),
        ...apiEndpoints.slice(0, 3).map(api => new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { 
            ApiName: apiGatewayName,
            Method: api.method,
            Resource: api.resource,
            Stage: 'v1'
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: `${api.label} - 5XX`,
        }))
      ],
      width: 24,
      height: 6,
    });

    this.dashboard.addWidgets(apiOverviewWidget);
  }
}