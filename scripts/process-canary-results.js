#!/usr/bin/env node

/**
 * Process Playwright E2E test results for canary testing
 * Generates CloudWatch compatible metrics
 */

const fs = require('fs');
const path = require('path');

function processTestResults(resultsPath) {
  try {
    // Read Playwright JSON results
    const rawResults = fs.readFileSync(resultsPath, 'utf8');
    const results = JSON.parse(rawResults);
    
    const timestamp = new Date().toISOString();
    const totalTests = results.suites?.reduce((acc, suite) => 
      acc + (suite.specs?.length || 0), 0) || 0;
    
    let passedTests = 0;
    let failedTests = 0;
    let totalDuration = 0;
    const endpointResults = {};
    
    // Process test suites
    results.suites?.forEach(suite => {
      suite.specs?.forEach(spec => {
        spec.tests?.forEach(test => {
          const duration = test.results?.[0]?.duration || 0;
          totalDuration += duration;
          
          if (test.results?.[0]?.status === 'passed') {
            passedTests++;
          } else {
            failedTests++;
          }
          
          // Extract endpoint information from test title
          const testTitle = test.title || '';
          const endpointMatch = testTitle.match(/(GET|POST|PUT|DELETE)\s+([^\s]+)/i);
          if (endpointMatch) {
            const method = endpointMatch[1].toUpperCase();
            const endpoint = endpointMatch[2];
            const key = `${method} ${endpoint}`;
            
            if (!endpointResults[key]) {
              endpointResults[key] = { passed: 0, failed: 0, totalDuration: 0, count: 0 };
            }
            
            if (test.results?.[0]?.status === 'passed') {
              endpointResults[key].passed++;
            } else {
              endpointResults[key].failed++;
            }
            endpointResults[key].totalDuration += duration;
            endpointResults[key].count++;
          }
        });
      });
    });
    
    // Calculate metrics
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgResponseTime = totalTests > 0 ? totalDuration / totalTests : 0;
    
    // Generate CloudWatch metrics
    const metrics = {
      timestamp,
      namespace: 'Conduit/E2E',
      metrics: [
        {
          MetricName: 'SuccessRate',
          Value: successRate,
          Unit: 'Percent',
          Timestamp: timestamp
        },
        {
          MetricName: 'ResponseTime',
          Value: avgResponseTime,
          Unit: 'Milliseconds',
          Timestamp: timestamp
        },
        {
          MetricName: 'TestCount',
          Value: totalTests,
          Unit: 'Count',
          Timestamp: timestamp
        },
        {
          MetricName: 'PassedTests',
          Value: passedTests,
          Unit: 'Count',
          Timestamp: timestamp
        },
        {
          MetricName: 'FailedTests',
          Value: failedTests,
          Unit: 'Count',
          Timestamp: timestamp
        }
      ]
    };
    
    // Add endpoint-specific metrics
    Object.entries(endpointResults).forEach(([endpoint, data]) => {
      const endpointSuccessRate = data.count > 0 ? (data.passed / data.count) * 100 : 0;
      const endpointAvgTime = data.count > 0 ? data.totalDuration / data.count : 0;
      
      metrics.metrics.push(
        {
          MetricName: 'EndpointSuccessRate',
          Value: endpointSuccessRate,
          Unit: 'Percent',
          Timestamp: timestamp,
          Dimensions: [{ Name: 'Endpoint', Value: endpoint }]
        },
        {
          MetricName: 'EndpointResponseTime',
          Value: endpointAvgTime,
          Unit: 'Milliseconds',
          Timestamp: timestamp,
          Dimensions: [{ Name: 'Endpoint', Value: endpoint }]
        }
      );
    });
    
    // Save metrics to file
    const outputDir = path.dirname(resultsPath).replace('/', '/canary/');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const metricsPath = path.join(outputDir, 'metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    
    // Generate summary
    const summary = {
      timestamp,
      totalTests,
      passedTests,
      failedTests,
      successRate: successRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      endpointCount: Object.keys(endpointResults).length,
      status: successRate >= 80 ? 'HEALTHY' : 'UNHEALTHY'
    };
    
    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('✅ Canary test results processed successfully');
    console.log(`📊 Success Rate: ${summary.successRate}%`);
    console.log(`⏱️  Avg Response Time: ${summary.avgResponseTime}ms`);
    console.log(`📈 Status: ${summary.status}`);
    console.log(`📁 Metrics saved to: ${metricsPath}`);
    
    return 0;
    
  } catch (error) {
    console.error('❌ Failed to process canary test results:', error.message);
    
    // Create minimal failure metrics
    const timestamp = new Date().toISOString();
    const failureMetrics = {
      timestamp,
      namespace: 'Conduit/E2E',
      metrics: [
        {
          MetricName: 'SuccessRate',
          Value: 0,
          Unit: 'Percent',
          Timestamp: timestamp
        },
        {
          MetricName: 'ProcessingError',
          Value: 1,
          Unit: 'Count',
          Timestamp: timestamp
        }
      ]
    };
    
    try {
      const outputDir = path.join(path.dirname(resultsPath), 'canary');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputDir, 'metrics.json'), 
                      JSON.stringify(failureMetrics, null, 2));
    } catch (writeError) {
      console.error('❌ Failed to write failure metrics:', writeError.message);
    }
    
    return 1;
  }
}

// Main execution
if (require.main === module) {
  const resultsPath = process.argv[2];
  if (!resultsPath) {
    console.error('Usage: node process-canary-results.js <results.json>');
    process.exit(1);
  }
  
  const exitCode = processTestResults(resultsPath);
  process.exit(exitCode);
}

module.exports = { processTestResults };