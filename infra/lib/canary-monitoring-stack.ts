import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface CanaryMonitoringStackProps extends cdk.NestedStackProps {
  /**
   * Email for alarm notifications
   */
  notificationEmail?: string;
}

export class CanaryMonitoringStack extends cdk.NestedStack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;
  public readonly successRateAlarm: cloudwatch.Alarm;
  public readonly responseTimeAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: CanaryMonitoringStackProps = {}) {
    super(scope, id, props);

    // SNS Topic for canary test alerts
    this.alertTopic = new sns.Topic(this, 'CanaryAlertTopic', {
      topicName: 'conduit-canary-alerts',
      displayName: 'Conduit Canary Test Alerts',
    });

    // Add email subscription if provided
    if (props.notificationEmail) {
      this.alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Success Rate Alarm
    this.successRateAlarm = new cloudwatch.Alarm(this, 'CanarySuccessRateAlarm', {
      alarmName: 'Conduit-E2E-SuccessRate-Low',
      alarmDescription: 'E2E test success rate is below 80%',
      metric: new cloudwatch.Metric({
        namespace: 'Conduit/E2E',
        metricName: 'SuccessRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80, // Success rate below 80%
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    // Response Time Alarm
    this.responseTimeAlarm = new cloudwatch.Alarm(this, 'CanaryResponseTimeAlarm', {
      alarmName: 'Conduit-E2E-ResponseTime-High',
      alarmDescription: 'E2E test response time is above 10 seconds',
      metric: new cloudwatch.Metric({
        namespace: 'Conduit/E2E',
        metricName: 'ResponseTime',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10000, // 10 seconds in milliseconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Connect alarms to SNS topic
    this.successRateAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );
    this.responseTimeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'CanaryDashboard', {
      dashboardName: 'Conduit-E2E-Canary-Tests',
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      // Success Rate and Test Count row
      new cloudwatch.GraphWidget({
        title: 'E2E Test Success Rate',
        left: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'SuccessRate',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Current Success Rate',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'SuccessRate',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Total Tests (Last 5min)',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'TestCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 6,
        height: 6,
      })
    );

    this.dashboard.addWidgets(
      // Response Time and Test Results row
      new cloudwatch.GraphWidget({
        title: 'E2E Test Response Time',
        left: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'ResponseTime',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Test Results (Passed vs Failed)',
        left: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'PassedTests',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'Conduit/E2E',
            metricName: 'FailedTests',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // API Gateway metrics using AWS API Gateway native metrics
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

    const apiWidgets: cloudwatch.IWidget[] = [];
    
    // Create widgets for each API endpoint
    apiEndpoints.forEach((api) => {
      // Success Rate calculation: ((Count - 4XXError - 5XXError) / Count) * 100
      const successRateMetric = new cloudwatch.MathExpression({
        expression: '((count - errors4xx - errors5xx) / count) * 100',
        usingMetrics: {
          count: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { 
              ApiName: 'conduit-proxy-api',  // API Gateway name from api-gateway-proxy-stack
              Method: api.method,
              Resource: api.resource,
              Stage: 'prod'  // API Gateway stage
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          errors4xx: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: { 
              ApiName: 'conduit-proxy-api',
              Method: api.method,
              Resource: api.resource,
              Stage: 'prod'
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          errors5xx: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { 
              ApiName: 'conduit-proxy-api',
              Method: api.method,
              Resource: api.resource,
              Stage: 'prod'
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
        label: 'Success Rate (%)',
      });

      const latencyMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: { 
          ApiName: 'conduit-api',
          Method: api.method,
          Resource: api.resource,
          Stage: 'v1'
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      apiWidgets.push(
        new cloudwatch.GraphWidget({
          title: `${api.label} - Success Rate & Latency`,
          left: [successRateMetric],
          right: [latencyMetric],
          width: 12,
          height: 6,
          leftYAxis: {
            min: 0,
            max: 100,
          },
        })
      );
    });

    // Add API Gateway overview widget
    const apiOverviewWidget = new cloudwatch.GraphWidget({
      title: 'All API Endpoints - Requests & Errors',
      left: apiEndpoints.map(api => new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Count',
        dimensionsMap: { 
          ApiName: 'conduit-api',
          Method: api.method,
          Resource: api.resource,
          Stage: 'v1'
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${api.label} - Requests`,
      })),
      right: [
        ...apiEndpoints.map(api => new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { 
            ApiName: 'conduit-api',
            Method: api.method,
            Resource: api.resource,
            Stage: 'v1'
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: `${api.label} - 4XX`,
        })),
        ...apiEndpoints.map(api => new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { 
            ApiName: 'conduit-api',
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

    apiWidgets.unshift(apiOverviewWidget);

    if (apiWidgets.length > 0) {
      this.dashboard.addWidgets(...apiWidgets);
    }

    // Output useful information
    new cdk.CfnOutput(this, 'DashboardUrl', {
      description: 'CloudWatch Dashboard URL',
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${
        this.region
      }#dashboards:name=${this.dashboard.dashboardName}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      description: 'SNS Topic ARN for canary alerts',
      value: this.alertTopic.topicArn,
    });

    // Tags
    cdk.Tags.of(this).add('Component', 'Monitoring');
    cdk.Tags.of(this).add('Type', 'Canary');
  }
}