import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  apiGatewayId: string;
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
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'RealWorldServiceMonitor', {
      dashboardName: 'RealWorld-Service-Monitor',
    });

    // Lambda Functions Monitoring Widgets
    this.addLambdaMonitoringWidgets(props.lambdaFunctions);

    // API Gateway Monitoring Widgets  
    this.addApiGatewayMonitoringWidgets(props.apiGatewayId);

    // DynamoDB Monitoring Widgets
    this.addDynamoDBMonitoringWidgets(props.dynamoDBTables);

    // System Overview Widget
    this.addSystemOverviewWidget();

    // Output dashboard URL
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: 'RealWorldDashboardUrl'
    });
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

  private addApiGatewayMonitoringWidgets(apiGatewayId: string) {
    // API Gateway Request Count
    const apiRequestCountWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: apiGatewayId,
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
            ApiName: apiGatewayId,
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
            ApiName: apiGatewayId,
          },
          statistic: 'Sum',
          label: '4XX Errors',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: apiGatewayId,
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

  private addSystemOverviewWidget() {
    // System Health Overview - Number widgets
    const systemOverviewWidget = new cloudwatch.Row(
      new cloudwatch.SingleValueWidget({
        title: 'Total Requests (1h)',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
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
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
              e2: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
              m1: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
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
}