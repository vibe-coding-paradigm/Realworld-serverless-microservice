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

    // Lambda function-specific metrics using AWS Lambda native metrics
    const lambdaFunctions = [
      { name: 'conduit-auth-register', label: 'POST /users (Register)' },
      { name: 'conduit-auth-login', label: 'POST /users/login' },
      { name: 'conduit-auth-getuser', label: 'GET /user' },
      { name: 'conduit-articles-list', label: 'GET /articles' },
      { name: 'conduit-articles-get', label: 'GET /articles/:slug' },
      { name: 'conduit-articles-create', label: 'POST /articles' },
      { name: 'conduit-articles-update', label: 'PUT /articles/:slug' },
      { name: 'conduit-articles-delete', label: 'DELETE /articles/:slug' },
      { name: 'conduit-articles-favorite', label: 'POST /articles/:slug/favorite' },
      { name: 'conduit-comments-list', label: 'GET /articles/:slug/comments' },
      { name: 'conduit-comments-create', label: 'POST /articles/:slug/comments' },
      { name: 'conduit-comments-delete', label: 'DELETE /articles/:slug/comments/:id' },
    ];

    const functionWidgets: cloudwatch.IWidget[] = [];
    
    // Create widgets for each Lambda function
    lambdaFunctions.forEach((func) => {
      // Success Rate calculation: (Invocations - Errors) / Invocations * 100
      const successRateMetric = new cloudwatch.MathExpression({
        expression: '(invocations - errors) / invocations * 100',
        usingMetrics: {
          invocations: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: { FunctionName: func.name },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          errors: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: { FunctionName: func.name },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
        label: 'Success Rate (%)',
      });

      const durationMetric = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: { FunctionName: func.name },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      functionWidgets.push(
        new cloudwatch.GraphWidget({
          title: `${func.label} - Success Rate & Response Time`,
          left: [successRateMetric],
          right: [durationMetric],
          width: 12,
          height: 6,
          leftYAxis: {
            min: 0,
            max: 100,
          },
        })
      );
    });

    // Add Lambda function overview widget
    const lambdaOverviewWidget = new cloudwatch.GraphWidget({
      title: 'All Lambda Functions - Invocations & Errors',
      left: lambdaFunctions.map(func => new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Invocations',
        dimensionsMap: { FunctionName: func.name },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${func.label} - Invocations`,
      })),
      right: lambdaFunctions.map(func => new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: { FunctionName: func.name },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${func.label} - Errors`,
      })),
      width: 24,
      height: 6,
    });

    functionWidgets.unshift(lambdaOverviewWidget);

    if (functionWidgets.length > 0) {
      this.dashboard.addWidgets(...functionWidgets);
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