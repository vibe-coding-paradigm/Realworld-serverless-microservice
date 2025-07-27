import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import { Construct } from 'constructs';

export interface StorageStackProps {
  vpc: ec2.IVpc;
}

export class StorageStack extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    this.vpc = props.vpc;

    // EFS File System for SQLite database persistence
    this.fileSystem = new efs.FileSystem(this, 'ConduitEFS', {
      vpc: this.vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 학습용이므로 스택 삭제 시 함께 삭제
    });

    // Tag the EFS for identification
    cdk.Tags.of(this.fileSystem).add('Name', 'conduit-efs');
    cdk.Tags.of(this.fileSystem).add('Project', 'conduit');
    cdk.Tags.of(this.fileSystem).add('Environment', 'dev');

    // Create a security group for EFS access
    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EFSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EFS access',
      allowAllOutbound: false
    });

    // Allow NFS access (port 2049) from ECS tasks
    efsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(2049),
      'Allow NFS access from ECS tasks'
    );

    // Add the security group to EFS
    this.fileSystem.connections.addSecurityGroup(efsSecurityGroup);

    // Output file system ID
    new cdk.CfnOutput(scope, 'EFSFileSystemId', {
      value: this.fileSystem.fileSystemId,
      description: 'EFS File System ID for SQLite storage',
      exportName: 'ConduitEFSId'
    });
  }
}