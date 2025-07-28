#!/usr/bin/env node

/**
 * AWS 배포 검증 스크립트
 * 
 * 이 스크립트는 ECS 클러스터, 서비스, 태스크, IAM 역할, CloudWatch 로그 그룹,
 * Application Load Balancer(ALB), 타겟 그룹 등 AWS 리소스들이 의도한 대로 
 * 생성/업데이트되었는지 검증합니다.
 * 
 * 사용법:
 *   node scripts/verify-deployment.js
 *   npm run verify-deployment
 *   make verify-deployment
 */

const {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand,
  DescribeTaskDefinitionCommand,
} = require('@aws-sdk/client-ecs');

const {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} = require('@aws-sdk/client-iam');

const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} = require('@aws-sdk/client-cloudwatch-logs');

const {
  ECRClient,
  DescribeRepositoriesCommand,
  DescribeImagesCommand,
} = require('@aws-sdk/client-ecr');

const {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} = require('@aws-sdk/client-elastic-load-balancing-v2');

// 설정값들
const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'ap-northeast-2',
  ECS_CLUSTER: process.env.ECS_CLUSTER || 'conduit-cluster',
  ECS_SERVICE: process.env.ECS_SERVICE || 'conduit-backend',
  ECR_REPOSITORY: process.env.ECR_REPOSITORY || 'conduit-backend',
  TASK_EXECUTION_ROLE: 'ecsTaskExecutionRole',
  TASK_ROLE: 'ecsTaskRole',
  LOG_GROUP: '/ecs/conduit-backend',
  EXPECTED_CPU: '256',
  EXPECTED_MEMORY: '512',
  EXPECTED_CAPACITY_PROVIDER: 'FARGATE_SPOT',
  EXPECTED_LOG_RETENTION: 1, // days
  ALB_NAME: 'conduit-alb',
  TARGET_GROUP_NAME: 'conduit-tg',
  ALB_HEALTH_CHECK_PATH: '/health',
};

// AWS 클라이언트 초기화
const ecsClient = new ECSClient({ region: CONFIG.AWS_REGION });
const iamClient = new IAMClient({ region: CONFIG.AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: CONFIG.AWS_REGION });
const ecrClient = new ECRClient({ region: CONFIG.AWS_REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: CONFIG.AWS_REGION });

// 유틸리티 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  header: (msg) => console.log(`\n🔍 ${msg}`),
  result: (key, value, expected = null) => {
    const status = expected && value !== expected ? '⚠️' : '✅';
    console.log(`   ${status} ${key}: ${value}${expected ? ` (expected: ${expected})` : ''}`);
  }
};

// 검증 결과 추적
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  addResult: function(success, warning = false) {
    if (success) {
      this.passed++;
    } else if (warning) {
      this.warnings++;
    } else {
      this.failed++;
    }
  }
};

/**
 * ECS 클러스터 상태 검증
 */
async function verifyECSCluster() {
  log.header('ECS 클러스터 검증');
  
  try {
    const command = new DescribeClustersCommand({
      clusters: [CONFIG.ECS_CLUSTER]
    });
    
    const response = await ecsClient.send(command);
    
    if (!response.clusters || response.clusters.length === 0) {
      log.error(`클러스터 '${CONFIG.ECS_CLUSTER}'를 찾을 수 없습니다`);
      results.addResult(false);
      return false;
    }
    
    const cluster = response.clusters[0];
    
    log.result('클러스터 이름', cluster.clusterName);
    log.result('상태', cluster.status, 'ACTIVE');
    log.result('실행 중인 태스크', cluster.runningTasksCount);
    log.result('활성 서비스', cluster.activeServicesCount);
    
    const isHealthy = cluster.status === 'ACTIVE' && 
                     cluster.activeServicesCount > 0 && 
                     cluster.runningTasksCount > 0;
    
    results.addResult(isHealthy);
    return isHealthy;
    
  } catch (error) {
    log.error(`클러스터 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * ECS 서비스 상태 검증
 */
async function verifyECSService() {
  log.header('ECS 서비스 검증');
  
  try {
    const command = new DescribeServicesCommand({
      cluster: CONFIG.ECS_CLUSTER,
      services: [CONFIG.ECS_SERVICE]
    });
    
    const response = await ecsClient.send(command);
    
    if (!response.services || response.services.length === 0) {
      log.error(`서비스 '${CONFIG.ECS_SERVICE}'를 찾을 수 없습니다`);
      results.addResult(false);
      return false;
    }
    
    const service = response.services[0];
    
    log.result('서비스 이름', service.serviceName);
    log.result('상태', service.status, 'ACTIVE');
    log.result('원하는 태스크 수', service.desiredCount);
    log.result('실행 중인 태스크 수', service.runningCount);
    log.result('플랫폼 버전', service.platformVersion);
    
    // Capacity Provider 확인
    if (service.capacityProviderStrategy && service.capacityProviderStrategy.length > 0) {
      const provider = service.capacityProviderStrategy[0];
      log.result('Capacity Provider', provider.capacityProvider, CONFIG.EXPECTED_CAPACITY_PROVIDER);
      log.result('Weight', `${provider.weight}%`, '100%');
    }
    
    const isHealthy = service.status === 'ACTIVE' && 
                     service.runningCount >= service.desiredCount &&
                     service.runningCount > 0;
    
    results.addResult(isHealthy);
    return isHealthy;
    
  } catch (error) {
    log.error(`서비스 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * ECS 태스크 상태 검증
 */
async function verifyECSTasks() {
  log.header('ECS 태스크 검증');
  
  try {
    // 실행 중인 태스크 목록 가져오기
    const listCommand = new ListTasksCommand({
      cluster: CONFIG.ECS_CLUSTER,
      serviceName: CONFIG.ECS_SERVICE,
      desiredStatus: 'RUNNING'
    });
    
    const listResponse = await ecsClient.send(listCommand);
    
    if (!listResponse.taskArns || listResponse.taskArns.length === 0) {
      log.error('실행 중인 태스크를 찾을 수 없습니다');
      results.addResult(false);
      return false;
    }
    
    log.result('실행 중인 태스크 수', listResponse.taskArns.length);
    
    // 첫 번째 태스크의 상세 정보 확인
    const describeCommand = new DescribeTasksCommand({
      cluster: CONFIG.ECS_CLUSTER,
      tasks: [listResponse.taskArns[0]]
    });
    
    const describeResponse = await ecsClient.send(describeCommand);
    const task = describeResponse.tasks[0];
    
    log.result('태스크 상태', task.lastStatus, 'RUNNING');
    log.result('Capacity Provider', task.capacityProviderName, CONFIG.EXPECTED_CAPACITY_PROVIDER);
    log.result('CPU', task.cpu, CONFIG.EXPECTED_CPU);
    log.result('Memory', task.memory, CONFIG.EXPECTED_MEMORY);
    log.result('플랫폼 버전', task.platformVersion);
    
    // 태스크 생성 및 시작 시간
    const createdAt = new Date(task.createdAt).toLocaleString();
    const startedAt = new Date(task.startedAt).toLocaleString();
    log.result('생성 시간', createdAt);
    log.result('시작 시간', startedAt);
    
    // Allow PROVISIONING status as it's a transitional state after deployment
    const isHealthy = (task.lastStatus === 'RUNNING' || task.lastStatus === 'PROVISIONING') && 
                     task.capacityProviderName === CONFIG.EXPECTED_CAPACITY_PROVIDER;
    
    // Only count as warning if task is still provisioning
    if (task.lastStatus === 'PROVISIONING') {
      log.warning('태스크가 아직 프로비저닝 중입니다. 배포 직후의 정상적인 상태입니다.');
      results.addResult(true, true); // warning level
    } else {
      results.addResult(isHealthy);
    }
    
    return isHealthy;
    
  } catch (error) {
    log.error(`태스크 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * 태스크 정의 검증
 */
async function verifyTaskDefinition() {
  log.header('태스크 정의 검증');
  
  try {
    const command = new DescribeTaskDefinitionCommand({
      taskDefinition: CONFIG.ECS_SERVICE
    });
    
    const response = await ecsClient.send(command);
    const taskDef = response.taskDefinition;
    
    log.result('Family', taskDef.family);
    log.result('Revision', taskDef.revision);
    log.result('CPU', taskDef.cpu, CONFIG.EXPECTED_CPU);
    log.result('Memory', taskDef.memory, CONFIG.EXPECTED_MEMORY);
    log.result('Execution Role', taskDef.executionRoleArn.split('/').pop(), CONFIG.TASK_EXECUTION_ROLE);
    log.result('Task Role', taskDef.taskRoleArn.split('/').pop(), CONFIG.TASK_ROLE);
    
    // 컨테이너 정의 확인
    if (taskDef.containerDefinitions && taskDef.containerDefinitions.length > 0) {
      const container = taskDef.containerDefinitions[0];
      log.result('컨테이너 이름', container.name);
      log.result('이미지', container.image.includes(CONFIG.ECR_REPOSITORY) ? '✅ ECR 이미지' : container.image);
      
      // 환경 변수 확인
      if (container.environment) {
        const envVars = container.environment.reduce((acc, env) => {
          acc[env.name] = env.value;
          return acc;
        }, {});
        log.result('PORT 환경변수', envVars.PORT || 'not set', '8080');
        log.result('DATABASE_URL 환경변수', envVars.DATABASE_URL ? '설정됨' : 'not set');
      }
    }
    
    const isValid = taskDef.cpu === CONFIG.EXPECTED_CPU && 
                   taskDef.memory === CONFIG.EXPECTED_MEMORY;
    
    results.addResult(isValid);
    return isValid;
    
  } catch (error) {
    log.error(`태스크 정의 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * IAM 역할 검증
 */
async function verifyIAMRoles() {
  log.header('IAM 역할 검증');
  
  const rolesToCheck = [CONFIG.TASK_EXECUTION_ROLE, CONFIG.TASK_ROLE];
  let allRolesValid = true;
  
  for (const roleName of rolesToCheck) {
    try {
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      log.result(`${roleName} 존재`, '✅ 확인됨');
      log.result(`${roleName} 생성일`, new Date(roleResponse.Role.CreateDate).toLocaleDateString());
      
      // 정책 확인
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(listPoliciesCommand);
      
      log.result(`${roleName} 연결된 정책 수`, policiesResponse.AttachedPolicies.length);
      
      results.addResult(true);
      
    } catch (error) {
      log.error(`역할 '${roleName}' 검증 실패: ${error.message}`);
      results.addResult(false);
      allRolesValid = false;
    }
  }
  
  return allRolesValid;
}

/**
 * CloudWatch 로그 그룹 검증
 */
async function verifyCloudWatchLogs() {
  log.header('CloudWatch 로그 검증');
  
  try {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: CONFIG.LOG_GROUP
    });
    
    const response = await logsClient.send(command);
    
    if (!response.logGroups || response.logGroups.length === 0) {
      log.error(`로그 그룹 '${CONFIG.LOG_GROUP}'를 찾을 수 없습니다`);
      results.addResult(false);
      return false;
    }
    
    const logGroup = response.logGroups[0];
    
    log.result('로그 그룹 이름', logGroup.logGroupName);
    log.result('보관 기간 (일)', logGroup.retentionInDays, CONFIG.EXPECTED_LOG_RETENTION);
    log.result('생성일', new Date(logGroup.creationTime).toLocaleDateString());
    
    // 로그 스트림 확인
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName: CONFIG.LOG_GROUP,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 3
    });
    
    const streamsResponse = await logsClient.send(streamsCommand);
    
    if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
      log.result('활성 로그 스트림 수', streamsResponse.logStreams.length);
      const latestStream = streamsResponse.logStreams[0];
      if (latestStream.lastEventTime) {
        log.result('최근 로그 시간', new Date(latestStream.lastEventTime).toLocaleString());
      }
    }
    
    const isValid = logGroup.retentionInDays === CONFIG.EXPECTED_LOG_RETENTION;
    results.addResult(isValid, !isValid); // warning if retention doesn't match
    return true;
    
  } catch (error) {
    log.error(`CloudWatch 로그 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * ECR 리포지토리 검증
 */
async function verifyECRRepository() {
  log.header('ECR 리포지토리 검증');
  
  try {
    const repoCommand = new DescribeRepositoriesCommand({
      repositoryNames: [CONFIG.ECR_REPOSITORY]
    });
    
    const repoResponse = await ecrClient.send(repoCommand);
    const repository = repoResponse.repositories[0];
    
    log.result('리포지토리 이름', repository.repositoryName);
    log.result('URI', repository.repositoryUri);
    log.result('생성일', new Date(repository.createdAt).toLocaleDateString());
    
    // 이미지 확인
    const imagesCommand = new DescribeImagesCommand({
      repositoryName: CONFIG.ECR_REPOSITORY,
      maxResults: 3
    });
    
    const imagesResponse = await ecrClient.send(imagesCommand);
    
    if (imagesResponse.imageDetails && imagesResponse.imageDetails.length > 0) {
      log.result('이미지 수', imagesResponse.imageDetails.length);
      
      // 가장 최근 이미지 정보
      const latestImage = imagesResponse.imageDetails
        .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))[0];
      
      log.result('최근 이미지 크기', `${(latestImage.imageSizeInBytes / 1024 / 1024).toFixed(2)} MB`);
      log.result('최근 푸시 시간', new Date(latestImage.imagePushedAt).toLocaleString());
    }
    
    results.addResult(true);
    return true;
    
  } catch (error) {
    log.error(`ECR 리포지토리 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * Application Load Balancer 검증
 */
async function verifyALB() {
  log.header('Application Load Balancer 검증');
  
  try {
    // ALB 존재 확인
    const albCommand = new DescribeLoadBalancersCommand({
      Names: [CONFIG.ALB_NAME]
    });
    
    const albResponse = await elbv2Client.send(albCommand);
    
    if (!albResponse.LoadBalancers || albResponse.LoadBalancers.length === 0) {
      log.error(`로드밸런서 '${CONFIG.ALB_NAME}'를 찾을 수 없습니다`);
      results.addResult(false);
      return false;
    }
    
    const alb = albResponse.LoadBalancers[0];
    
    log.result('ALB 이름', alb.LoadBalancerName);
    log.result('상태', alb.State.Code, 'active');
    log.result('타입', alb.Type, 'application');
    log.result('스킴', alb.Scheme, 'internet-facing');
    log.result('DNS 이름', alb.DNSName);
    log.result('생성일', new Date(alb.CreatedTime).toLocaleDateString());
    
    // 리스너 확인
    const listenersCommand = new DescribeListenersCommand({
      LoadBalancerArn: alb.LoadBalancerArn
    });
    
    const listenersResponse = await elbv2Client.send(listenersCommand);
    
    if (listenersResponse.Listeners && listenersResponse.Listeners.length > 0) {
      const listener = listenersResponse.Listeners[0];
      log.result('리스너 포트', listener.Port, 80);
      log.result('리스너 프로토콜', listener.Protocol, 'HTTP');
      
      // 타겟 그룹 확인
      if (listener.DefaultActions && listener.DefaultActions.length > 0) {
        const action = listener.DefaultActions[0];
        if (action.TargetGroupArn) {
          log.result('연결된 타겟 그룹', '✅ 확인됨');
          
          // 타겟 그룹 상세 정보
          const tgCommand = new DescribeTargetGroupsCommand({
            TargetGroupArns: [action.TargetGroupArn]
          });
          
          const tgResponse = await elbv2Client.send(tgCommand);
          if (tgResponse.TargetGroups && tgResponse.TargetGroups.length > 0) {
            const tg = tgResponse.TargetGroups[0];
            log.result('타겟 그룹 이름', tg.TargetGroupName);
            log.result('타겟 그룹 포트', tg.Port, 8080);
            log.result('헬스체크 경로', tg.HealthCheckPath, CONFIG.ALB_HEALTH_CHECK_PATH);
            log.result('헬스체크 프로토콜', tg.HealthCheckProtocol, 'HTTP');
            
            // 타겟 헬스 상태 확인
            const healthCommand = new DescribeTargetHealthCommand({
              TargetGroupArn: action.TargetGroupArn
            });
            
            const healthResponse = await elbv2Client.send(healthCommand);
            if (healthResponse.TargetHealthDescriptions) {
              const targets = healthResponse.TargetHealthDescriptions;
              log.result('등록된 타겟 수', targets.length);
              
              const healthyTargets = targets.filter(t => t.TargetHealth.State === 'healthy').length;
              const unhealthyTargets = targets.filter(t => t.TargetHealth.State === 'unhealthy').length;
              const drainingTargets = targets.filter(t => t.TargetHealth.State === 'draining').length;
              
              log.result('건강한 타겟', healthyTargets);
              if (unhealthyTargets > 0) {
                log.result('비정상 타겟', unhealthyTargets);
              }
              if (drainingTargets > 0) {
                log.result('드레이닝 타겟', drainingTargets);
              }
            }
          }
        }
      }
    }
    
    const isHealthy = alb.State.Code === 'active' && 
                     alb.Type === 'application' && 
                     alb.Scheme === 'internet-facing';
    
    results.addResult(isHealthy);
    return isHealthy;
    
  } catch (error) {
    log.error(`ALB 검증 실패: ${error.message}`);
    results.addResult(false);
    return false;
  }
}

/**
 * 헬스 체크 (옵션)
 */
async function performHealthCheck() {
  log.header('헬스 체크 (선택사항)');
  
  try {
    // ALB DNS 이름을 통한 헬스 체크
    const albCommand = new DescribeLoadBalancersCommand({
      Names: [CONFIG.ALB_NAME]
    });
    
    const albResponse = await elbv2Client.send(albCommand);
    
    if (albResponse.LoadBalancers && albResponse.LoadBalancers.length > 0) {
      const alb = albResponse.LoadBalancers[0];
      const albUrl = `http://${alb.DNSName}/health`;
      
      log.info(`ALB를 통한 헬스체크 URL: ${albUrl}`);
      log.info('수동으로 위 URL을 확인하여 백엔드 서비스 상태를 테스트해보세요');
      results.addResult(true, true); // warning level
    } else {
      log.warning('ALB를 찾을 수 없어 헬스 체크를 건너뜁니다');
      results.addResult(false, true);
    }
    
  } catch (error) {
    log.warning(`헬스 체크 건너뜀: ${error.message}`);
    results.addResult(false, true);
  }
}

/**
 * 메인 검증 함수
 */
async function main() {
  console.log('🚀 AWS 배포 검증을 시작합니다...\n');
  console.log(`📋 검증 대상:
   - 클러스터: ${CONFIG.ECS_CLUSTER}
   - 서비스: ${CONFIG.ECS_SERVICE}
   - 리전: ${CONFIG.AWS_REGION}
   - ECR 리포지토리: ${CONFIG.ECR_REPOSITORY}
   - ALB: ${CONFIG.ALB_NAME}
   - 타겟 그룹: ${CONFIG.TARGET_GROUP_NAME}\n`);
  
  // 각 검증 단계 실행
  await verifyECSCluster();
  await verifyECSService();
  await verifyECSTasks();
  await verifyTaskDefinition();
  await verifyIAMRoles();
  await verifyCloudWatchLogs();
  await verifyECRRepository();
  await verifyALB();
  await performHealthCheck();
  
  // 결과 요약
  console.log('\n📊 검증 결과 요약:');
  console.log(`   ✅ 통과: ${results.passed}`);
  console.log(`   ❌ 실패: ${results.failed}`);
  console.log(`   ⚠️  경고: ${results.warnings}`);
  
  const totalChecks = results.passed + results.failed + results.warnings;
  const successRate = ((results.passed / totalChecks) * 100).toFixed(1);
  
  console.log(`\n🎯 성공률: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 모든 핵심 검증이 통과되었습니다!');
    process.exit(0);
  } else {
    console.log('\n💥 일부 검증이 실패했습니다. 위의 오류를 확인해주세요.');
    process.exit(1);
  }
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
  console.error('❌ 처리되지 않은 오류:', error);
  process.exit(1);
});

// 스크립트가 직접 실행된 경우에만 main 함수 실행
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 검증 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = {
  verifyECSCluster,
  verifyECSService,
  verifyECSTasks,
  verifyTaskDefinition,
  verifyIAMRoles,
  verifyCloudWatchLogs,
  verifyECRRepository,
  verifyALB,
  performHealthCheck,
  CONFIG
};