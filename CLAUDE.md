# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **RealWorld application implementation** demonstrating **monolithic to serverless microservices migration** using **Vibe Coding methodology** and **Armin Ronacher's recommended tech stack**. The project builds a Medium.com clone (social blogging platform) while showcasing practical migration strategies for modern cloud architectures.

### Migration Phases
1. **Phase 1**: Monolithic application (Go + React + SQLite + Docker)
2. **Phase 2**: Cloud transition (AWS ECS/Fargate + GitHub Pages)
3. **Phase 3**: Microservices decomposition (API Gateway + Lambda + DynamoDB)
4. **Phase 4**: Serverless optimization (Event-driven architecture)

### Key Principles
- **Vibe Coding**: Intuitive, fast development prioritizing working code over perfect design
- **Armin Ronacher Philosophy**: Simplicity first, standard libraries, practical approach
- **RealWorld Standard**: Following established API specifications for consistency
- **Progressive Migration**: Incremental transformation from monolith to serverless

## Project Testing Strategies

### Test Execution Guidelines
- 테스트만 고쳤을땐 로컬에서 make e2e-cloud로 검증하고, 백엔드나 프론트 변경시엔 클라우드 배포후에 e2e 테스트 워크 플로우로 확인할 것

[Rest of the existing content remains the same...]