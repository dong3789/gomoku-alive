# 오목 온라인 (Gomoku Alive)

온라인 멀티플레이어 오목 게임입니다. AI 대전과 로컬 2인 대전도 지원합니다.

## 기능

- **온라인 대전**: 실시간으로 다른 플레이어와 대전
- **AI 대전**: 3단계 난이도 (쉬움/보통/어려움)
- **로컬 대전**: 같은 기기에서 2인 대전

## 기술 스택

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, Socket.io
- **실시간 통신**: Socket.io

## 실행 방법

### 의존성 설치

```bash
npm run install:all
```

### 개발 서버 실행

```bash
npm run dev
```

- 클라이언트: http://localhost:3000
- 서버: http://localhost:3001

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 게임 규칙

1. 흑돌이 먼저 시작
2. 번갈아가며 한 수씩 착수
3. 가로, 세로, 대각선 중 한 방향으로 5개를 먼저 연결하면 승리

## 프로젝트 구조

```
gomoku-alive/
├── client/              # React 클라이언트
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── utils/       # 게임 로직, AI
│   │   └── types.ts     # 타입 정의
│   └── package.json
├── server/              # Node.js 서버
│   ├── index.ts         # 메인 서버
│   └── gameLogic.ts     # 게임 로직
├── shared/              # 공유 타입
└── package.json
```
