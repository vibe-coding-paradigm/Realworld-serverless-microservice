# Load Tests - k6 성능 테스트

RealWorld 애플리케이션의 성능 및 부하 테스트를 위한 k6 스크립트 모음입니다.

## 📋 개요

- **테스트 도구**: k6 (Grafana Labs)
- **테스트 대상**: Backend API 서버
- **성능 기준**: 95% 요청 < 2초, 에러율 < 1%
- **실행 방식**: 로컬 실행 또는 GitHub Actions 수동 트리거

## 🏗️ 테스트 구조

```
load-tests/
├── performance-baseline.js      # 성능 기준점 측정 (단일 사용자)
├── basic-load-test.js          # 기본 부하 테스트 (5-20명 동시 사용자)
├── auth-load-test.js           # 인증 시스템 부하 테스트
├── run-load-tests.sh           # 전체 테스트 실행 스크립트
├── performance-baseline-results.json    # 테스트 결과 (JSON)
├── performance-baseline-report.html     # 테스트 리포트 (HTML)
└── README.md                   # 이 파일
```

## 🧪 테스트 시나리오

### 1. Performance Baseline (성능 기준점)
**파일**: `performance-baseline.js`

기본적인 API 성능을 측정하여 시스템의 베이스라인을 설정합니다.

```javascript
// 테스트 설정
const options = {
  stages: [
    { duration: '1m', target: 1 },    // 1분간 사용자 1명
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 요청이 500ms 미만
    http_req_failed: ['rate<0.01'],    // 에러율 1% 미만
  }
}
```

**측정 항목**:
- Health 엔드포인트 응답 시간
- Articles 목록 조회 성능
- 기본적인 시스템 안정성

### 2. Basic Load Test (기본 부하 테스트)
**파일**: `basic-load-test.js`

점진적인 부하 증가를 통해 시스템의 확장성을 테스트합니다.

```javascript
const options = {
  stages: [
    { duration: '2m', target: 5 },    // 2분간 5명까지 증가
    { duration: '5m', target: 10 },   // 5분간 10명 유지
    { duration: '3m', target: 20 },   // 3분간 20명까지 증가
    { duration: '2m', target: 0 },    // 2분간 0명까지 감소
  ]
}
```

**테스트 패턴**:
- **Ramp-up**: 점진적 사용자 증가
- **Sustained Load**: 일정 부하 유지
- **Spike Test**: 급격한 부하 증가
- **Ramp-down**: 점진적 부하 감소

### 3. Authentication Load Test (인증 부하 테스트)
**파일**: `auth-load-test.js`

인증 시스템의 성능과 안정성을 집중적으로 테스트합니다.

```javascript
// 테스트 시나리오
export default function () {
  // 1. 사용자 등록
  const registerResponse = http.post(`${API_URL}/api/users`, {
    user: {
      username: `testuser_${Math.random()}`,
      email: `test_${Math.random()}@example.com`,
      password: 'testpassword123'
    }
  })
  
  // 2. 로그인
  const loginResponse = http.post(`${API_URL}/api/users/login`, {
    user: { email, password }
  })
  
  // 3. 보호된 엔드포인트 접근
  const profileResponse = http.get(`${API_URL}/api/user`, {
    headers: { Authorization: `Token ${token}` }
  })
}
```

## 🚀 실행 방법

### 사전 요구사항
- **k6 설치**: [k6 공식 설치 가이드](https://k6.io/docs/getting-started/installation/)
- **백엔드 서버**: 테스트 대상 API 서버가 실행 중이어야 함

### k6 설치

#### macOS (Homebrew)
```bash
brew install k6
```

#### Ubuntu/Debian
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Windows (Chocolatey)
```bash
choco install k6
```

### 로컬에서 테스트 실행

1. **API 서버 URL 설정**
   ```bash
   export API_URL=http://localhost:8080
   # 또는 프로덕션 서버
   export API_URL=http://conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com
   ```

2. **개별 테스트 실행**
   ```bash
   cd load-tests
   
   # 성능 기준점 측정
   k6 run performance-baseline.js
   
   # 기본 부하 테스트
   k6 run basic-load-test.js
   
   # 인증 시스템 테스트
   k6 run auth-load-test.js
   ```

3. **전체 테스트 실행**
   ```bash
   # 실행 스크립트 권한 부여
   chmod +x run-load-tests.sh
   
   # 전체 테스트 실행
   ./run-load-tests.sh
   ```

### GitHub Actions에서 실행

부하 테스트는 수동으로만 실행할 수 있습니다:

1. **GitHub Actions 페이지로 이동**
   - https://github.com/vibe-coding-paradigm/Realworld-serverless-microservice/actions

2. **"Load Tests" 워크플로우 선택**

3. **"Run workflow" 클릭**
   - Backend URL 입력 (선택사항, 비어있으면 자동 감지)
   - Test Duration 입력 (선택사항, 예: 30s)

4. **실행 결과 확인**
   - 워크플로우 로그에서 성능 메트릭 확인
   - Artifacts에서 HTML 리포트 다운로드

## 📊 성능 임계값 및 기준

### 현재 설정된 임계값
```javascript
const thresholds = {
  // 응답 시간 기준
  http_req_duration: ['p(95)<2000'],      // 95% 요청이 2초 미만
  'http_req_duration{expected_response:true}': ['p(99)<5000'],  // 99% 성공 요청이 5초 미만
  
  // 에러율 기준
  http_req_failed: ['rate<0.01'],         // 전체 에러율 1% 미만
  
  // 특정 엔드포인트 기준
  'http_req_duration{name:health}': ['p(95)<100'],       // Health 체크 100ms 미만
  'http_req_duration{name:articles}': ['p(95)<500'],     // Articles API 500ms 미만
  'http_req_duration{name:auth}': ['p(95)<1000'],        // 인증 API 1초 미만
}
```

### 성능 목표

| 메트릭 | 목표 | 설명 |
|--------|------|------|
| **응답 시간 (95th percentile)** | < 2초 | 대부분의 요청이 2초 내 완료 |
| **응답 시간 (99th percentile)** | < 5초 | 거의 모든 요청이 5초 내 완료 |
| **에러율** | < 1% | 전체 요청 중 에러 비율 |
| **동시 사용자** | 20명 | 동시 처리 가능한 사용자 수 |
| **Health Check** | < 100ms | 헬스 체크 빠른 응답 |
| **Articles API** | < 500ms | 게시글 목록 조회 성능 |

## 📈 결과 분석

### 1. 콘솔 출력 예시
```
     ✓ status is 200
     ✓ response time < 500ms
     
     checks.........................: 100.00% ✓ 1234      ✗ 0   
     data_received..................: 456 kB  76 kB/s
     data_sent......................: 123 kB  21 kB/s
     http_req_blocked...............: avg=1.2ms    min=0s       med=1ms      max=15ms     p(90)=2ms      p(95)=3ms   
     http_req_connecting............: avg=1.1ms    min=0s       med=1ms      max=14ms     p(90)=2ms      p(95)=3ms   
     http_req_duration..............: avg=145.5ms  min=89ms     med=142ms    max=312ms    p(90)=189ms    p(95)=205ms 
       { expected_response:true }...: avg=145.5ms  min=89ms     med=142ms    max=312ms    p(90)=189ms    p(95)=205ms 
     http_req_failed................: 0.00%   ✓ 0         ✗ 1234
     http_req_receiving.............: avg=0.2ms    min=0.1ms    med=0.2ms    max=1.2ms    p(90)=0.3ms    p(95)=0.4ms 
     http_req_sending...............: avg=0.1ms    min=0ms      med=0.1ms    max=0.8ms    p(90)=0.2ms    p(95)=0.3ms 
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s       max=0s       p(90)=0s       p(95)=0s    
     http_req_waiting...............: avg=145.1ms  min=88.7ms   med=141.7ms  max=311.2ms  p(90)=188.4ms  p(95)=204.2ms
     http_reqs......................: 1234    205.67/s
     iteration_duration.............: avg=1.14s    min=1.08s    med=1.14s    max=1.31s    p(90)=1.18s    p(95)=1.2s  
     iterations.....................: 1234    205.67/s
     vus............................: 1       min=1       max=1 
     vus_max........................: 1       min=1       max=1 
```

### 2. HTML 리포트
실행 후 생성되는 HTML 파일에서 다음 정보를 확인할 수 있습니다:
- 시간별 응답 시간 그래프
- 에러율 추이
- 처리량 (RPS: Requests Per Second)
- 가상 사용자 수 변화

### 3. JSON 결과 파일
프로그래밍적으로 결과를 분석하기 위한 JSON 형태의 상세 데이터가 저장됩니다.

## 🔧 테스트 커스터마이징

### 1. 부하 패턴 변경
```javascript
// 더 높은 부하 테스트
const options = {
  stages: [
    { duration: '5m', target: 50 },   // 50명 동시 사용자
    { duration: '10m', target: 100 }, // 100명 동시 사용자
  ]
}
```

### 2. 새로운 시나리오 추가
```javascript
// 커스텀 테스트 시나리오
export default function () {
  // 게시글 작성 테스트
  const createArticleResponse = http.post(`${API_URL}/api/articles`, {
    article: {
      title: 'Load Test Article',
      description: 'Performance testing',
      body: 'This is a load test article'
    }
  }, {
    headers: { Authorization: `Token ${token}` }
  })
  
  check(createArticleResponse, {
    'article created': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  })
}
```

### 3. 환경별 설정
```javascript
// 환경별 다른 설정 적용
const API_URL = __ENV.API_URL || 'http://localhost:8080'
const TEST_DURATION = __ENV.TEST_DURATION || '5m'
const MAX_VUS = parseInt(__ENV.MAX_VUS) || 20

const options = {
  stages: [
    { duration: TEST_DURATION, target: MAX_VUS }
  ]
}
```

## 🐛 트러블슈팅

### 일반적인 문제들

1. **k6: command not found**
   ```bash
   # k6 설치 확인
   which k6
   
   # 설치되지 않은 경우 재설치
   brew install k6  # macOS
   ```

2. **Connection refused 에러**
   ```bash
   # API 서버 상태 확인
   curl http://localhost:8080/health
   
   # API_URL 환경변수 확인
   echo $API_URL
   ```

3. **높은 에러율**
   ```bash
   # 백엔드 로그 확인
   docker logs <container_id>
   
   # ALB 헬스 체크 상태 확인
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```

4. **성능 저하**
   - CPU/메모리 사용률 확인
   - 데이터베이스 커넥션 풀 확인
   - 네트워크 지연 시간 측정

### 디버깅 팁
```javascript
// 상세 로깅 활성화
import { check } from 'k6'

export default function () {
  const response = http.get(`${API_URL}/api/articles`)
  
  // 응답 상세 정보 출력
  console.log(`Response status: ${response.status}`)
  console.log(`Response time: ${response.timings.duration}ms`)
  console.log(`Response body: ${response.body}`)
}
```

## 📊 모니터링 및 분석

### 1. 실시간 모니터링
```bash
# k6 실행 중 실시간 메트릭 확인
k6 run --out json=results.json basic-load-test.js

# 별도 터미널에서 결과 모니터링
tail -f results.json | jq '.metric'
```

### 2. 결과 데이터 내보내기
```bash
# InfluxDB로 결과 전송 (선택사항)
k6 run --out influxdb=http://localhost:8086/k6 basic-load-test.js

# Grafana 대시보드에서 시각화
```

### 3. CI/CD 통합
GitHub Actions에서 자동으로 성능 리포트를 생성하고 PR에 코멘트로 추가합니다.

## 🤝 기여하기

### 새로운 테스트 시나리오 추가
1. 새 JavaScript 파일 생성
2. k6 스크립트 작성
3. `run-load-tests.sh`에 추가
4. README 업데이트

### 성능 임계값 조정
1. 각 테스트 파일의 `thresholds` 객체 수정
2. 변경 사유 문서화
3. 팀 리뷰 후 적용

---

**참고 자료**:
- [k6 공식 문서](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/misc/fine-tuning-k6/)
- [성능 테스트 가이드](https://k6.io/docs/test-types/load-testing/)
- [k6 Thresholds 설정](https://k6.io/docs/using-k6/thresholds/)