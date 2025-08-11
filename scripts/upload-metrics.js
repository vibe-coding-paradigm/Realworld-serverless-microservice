#!/usr/bin/env node

/**
 * Upload processed canary test metrics to CloudWatch
 */

const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const fs = require('fs');

// Initialize CloudWatch client
const cloudwatch = new CloudWatchClient({ 
  region: process.env.AWS_REGION || 'ap-northeast-2' 
});

async function uploadMetrics(metricsPath) {
  try {
    // Read metrics file
    const rawMetrics = fs.readFileSync(metricsPath, 'utf8');
    const metricsData = JSON.parse(rawMetrics);
    
    console.log(`📤 Uploading ${metricsData.metrics.length} metrics to CloudWatch...`);
    
    // CloudWatch allows max 20 metrics per request
    const batchSize = 20;
    const batches = [];
    
    for (let i = 0; i < metricsData.metrics.length; i += batchSize) {
      batches.push(metricsData.metrics.slice(i, i + batchSize));
    }
    
    // Upload each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📊 Uploading batch ${i + 1}/${batches.length} (${batch.length} metrics)...`);
      
      const command = new PutMetricDataCommand({
        Namespace: metricsData.namespace,
        MetricData: batch.map(metric => ({
          MetricName: metric.MetricName,
          Value: metric.Value,
          Unit: metric.Unit,
          Timestamp: new Date(metric.Timestamp),
          Dimensions: metric.Dimensions || []
        }))
      });
      
      await cloudwatch.send(command);
      console.log(`✅ Batch ${i + 1} uploaded successfully`);
    }
    
    // Log summary
    const successRateMetric = metricsData.metrics.find(m => m.MetricName === 'SuccessRate');
    const responseTimeMetric = metricsData.metrics.find(m => m.MetricName === 'ResponseTime');
    const testCountMetric = metricsData.metrics.find(m => m.MetricName === 'TestCount');
    
    console.log('\n📈 Metrics Summary:');
    console.log(`   Success Rate: ${successRateMetric?.Value || 0}%`);
    console.log(`   Response Time: ${responseTimeMetric?.Value || 0}ms`);
    console.log(`   Test Count: ${testCountMetric?.Value || 0}`);
    console.log(`   Total Metrics: ${metricsData.metrics.length}`);
    
    return 0;
    
  } catch (error) {
    console.error('❌ Failed to upload metrics to CloudWatch:', error.message);
    
    // Try to upload a basic failure metric
    try {
      console.log('📤 Uploading failure metric...');
      const failureCommand = new PutMetricDataCommand({
        Namespace: 'Conduit/E2E',
        MetricData: [{
          MetricName: 'UploadError',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date()
        }]
      });
      
      await cloudwatch.send(failureCommand);
      console.log('✅ Failure metric uploaded');
    } catch (failureError) {
      console.error('❌ Failed to upload failure metric:', failureError.message);
    }
    
    return 1;
  }
}

// Main execution
if (require.main === module) {
  const metricsPath = process.argv[2];
  if (!metricsPath) {
    console.error('Usage: node upload-metrics.js <metrics.json>');
    process.exit(1);
  }
  
  uploadMetrics(metricsPath)
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { uploadMetrics };