#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ConduitStack } from '../lib/infra-stack';

const app = new cdk.App();

new ConduitStack(app, 'ConduitStack', {
  description: 'Conduit RealWorld Application Infrastructure',
  
  // Use current CLI configuration for account and region
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },

  // Stack tags for cost tracking and management
  tags: {
    Project: 'Conduit',
    Environment: 'dev',
    CostCenter: 'learning',
    Owner: 'vibe-coding-paradigm'
  }
});