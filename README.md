# Spreado Frontend

AI 기반 회의록 자동화 플랫폼 Spreado의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 19.2.0** - UI 라이브러리
- **TypeScript 5.9.3** - 타입 안정성
- **Vite 7.2.2** - 빌드 도구
- **React Router DOM** - 라우팅
- **Axios** - HTTP 클라이언트

## 시작하기

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 프로젝트 구조

```
src/
├── contexts/          # React Context (AuthContext 등)
├── pages/            # 페이지 컴포넌트
│   ├── LoginPage.tsx         # 로그인 페이지
│   ├── SignupPage.tsx        # 닉네임 설정 페이지
│   └── AuthCallback.tsx      # OAuth 콜백 처리
├── services/         # API 서비스
│   ├── apiClient.ts          # Axios 클라이언트 설정
│   ├── authService.ts        # 인증 API
│   └── userService.ts        # 사용자 API
└── types/            # TypeScript 타입 정의
```

## 주요 기능

### 1. 사용자 인증
- Google OAuth2 로그인
- JWT 기반 인증 (Access Token, Refresh Token)
- 자동 토큰 갱신

### 2. 페이지 구성
- `/` - 로그인 페이지
- `/signup` - 닉네임 설정 페이지
- `/auth/callback` - OAuth 콜백 처리

### 3. API 연동
- Axios Interceptor를 통한 자동 인증 헤더 추가
- 토큰 만료 시 자동 갱신
- 에러 핸들링

## API 엔드포인트

### Auth API
- `POST /auth/refresh` - Access Token 재발급
- `POST /auth/logout` - 로그아웃
- `POST /auth/google/callback` - Google OAuth 콜백

### User API
- `GET /user/me` - 내 정보 조회
- `GET /user/{id}` - 특정 사용자 정보 조회
- `PUT /user/me` - 내 정보 수정

## 개발 가이드

### 새로운 API 서비스 추가

1. `src/types/index.ts`에 타입 정의 추가
2. `src/services/`에 서비스 파일 생성
3. `apiClient`를 import하여 API 호출

예시:
```typescript
import apiClient from './apiClient';
import { YourType } from '../types';

export const yourService = {
  getData: async (): Promise<YourType> => {
    const response = await apiClient.get<YourType>('/your-endpoint');
    return response.data;
  },
};
```

### 인증이 필요한 페이지 보호

```typescript
import { useAuth } from '../contexts/AuthContext';

function YourPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  // ...
}
```

## TODO

- [ ] 메인 대시보드 페이지 구현
- [ ] 그룹 관리 기능
- [ ] 회의 관리 기능
- [ ] 실시간 회의록 작성 (Liveblocks 연동)
- [ ] AI 요약 기능
- [ ] 이메일 전송 기능
