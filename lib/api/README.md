# API 연동 가이드

## 설정 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

#### 옵션 A: Next.js 프록시 사용 (CORS 문제 해결 - 권장)

```env
# 백엔드 API URL (프록시가 사용)
BACKEND_API_BASE_URL=http://localhost:8080

# 프록시 사용 명시 (선택사항, 기본값: true)
NEXT_PUBLIC_USE_API_PROXY=true
```

#### 옵션 B: 백엔드 직접 호출 (백엔드에서 CORS 설정 필요)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_USE_API_PROXY=false
```

**참고**: CORS 에러가 발생한다면 `CORS_SETUP_GUIDE.md` 파일을 참고하세요.

- 개발 환경: `http://localhost:8080` (또는 백엔드 서버 주소)
- 프로덕션 환경: 실제 배포된 백엔드 서버 URL

### 2. 사용 방법

#### 근처 병원 검색 API 호출

```typescript
import { findNearbyHospitals } from "@/lib/api/hospital"
import { parseHospitalLocation } from "@/lib/api/hospital"

// 사용 예시
const hospitals = await findNearbyHospitals({
  lat: 37.5665,  // 위도
  lng: 126.9780, // 경도
  km: 5          // 반경 (킬로미터)
})

// location 파싱 (GeoJsonPoint → { lat, lng })
hospitals.forEach(hospital => {
  const { lat, lng } = parseHospitalLocation(hospital.location)
  console.log(`${hospital.name}: ${lat}, ${lng}`)
})
```

#### React 컴포넌트에서 사용

```typescript
"use client"

import { useState, useEffect } from "react"
import { findNearbyHospitals } from "@/lib/api/hospital"
import type { HospitalDocument } from "@/types/hospital"

export function HospitalList() {
  const [hospitals, setHospitals] = useState<HospitalDocument[]>([])
  const [loading, setLoading] = useState(false)

  const searchNearby = async (lat: number, lng: number, km: number) => {
    setLoading(true)
    try {
      const results = await findNearbyHospitals({ lat, lng, km })
      setHospitals(results)
    } catch (error) {
      console.error("병원 검색 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    // UI 코드
  )
}
```

## 파일 구조

- `types/hospital.ts`: HospitalDocument 타입 정의
- `lib/api/config.ts`: API 설정 (기본 URL, 엔드포인트 등)
- `lib/api/hospital.ts`: 병원 관련 API 함수

## API 엔드포인트

### GET /hospitals/nearby

근처 병원 검색

**Query Parameters:**
- `lat` (required): 위도 (double)
- `lng` (required): 경도 (double)
- `km` (required): 반경 킬로미터 (double)

**Response:**
```typescript
HospitalDocument[]
```

## 타입 정의

`HospitalDocument` 타입은 백엔드의 `HospitalDocument`와 일치합니다:

```typescript
interface HospitalDocument {
  id: string
  hospitalId: string
  name: string
  address: string
  phone: string
  department: string
  etc1?: string
  etc2?: string
  info?: string
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  startTime?: Record<string, string>
  closeTime?: Record<string, string>
  updatedAt: string
}
```

## 주의사항

1. 환경 변수는 `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 사용 가능합니다
2. CORS 설정이 백엔드에서 올바르게 설정되어 있어야 합니다
3. API 호출은 현재 실제 연동되어 있지 않으며, 함수만 준비되어 있습니다
4. 실제 연동 시 에러 처리 및 로딩 상태를 적절히 처리해주세요

