# GitHub Repository Variables Configuration

This document describes the required GitHub repository variables for the CI/CD workflows.

## Required Variables

Set these variables in your GitHub repository settings under `Settings > Secrets and variables > Actions > Variables`.

### Required Variables

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `AWS_REGION` | AWS region for deployment | `ap-northeast-2` |
| `ECS_CLUSTER` | ECS cluster name | `conduit-cluster` |
| `ECS_SERVICE` | ECS service name | `conduit-backend` |
| `ECR_REPOSITORY` | ECR repository name | `conduit-backend` |
| `BACKEND_URL` | Backend API URL (ALB endpoint) | `http://conduit-alb-1192151049.ap-northeast-2.elb.amazonaws.com` |
| `FRONTEND_URL` | Frontend application URL | `https://vibe-coding-paradigm.github.io/Realworld-serverless-microservice/` |

## Required Secrets

| Secret Name | Description |
|-------------|-------------|
| `AWS_ROLE_ARN` | AWS IAM role ARN for GitHub Actions OIDC |

## How to Set Variables

1. Go to your GitHub repository
2. Click on `Settings` tab
3. In the left sidebar, click on `Secrets and variables` > `Actions`
4. Click on the `Variables` tab
5. Click `New repository variable`
6. Add each variable from the table above

## Workflow Behavior

- **Frontend Deploy**: Requires `BACKEND_URL` and `FRONTEND_URL`
- **Backend Deploy**: Requires all AWS-related variables and `BACKEND_URL`
- **E2E Tests**: Requires `BACKEND_URL` and `FRONTEND_URL` (passed from parent workflows)
- **Load Tests**: Can use `BACKEND_URL` from repository variables or accept manual input

## Error Handling

If any required variable is missing, the workflow will:
1. Display a clear error message
2. Exit with status code 1
3. Prevent deployment with incomplete configuration

This ensures no deployments happen with hardcoded or missing values.