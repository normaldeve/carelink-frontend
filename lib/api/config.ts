/**
 * API 설정
 */
export const API_CONFIG = {
  // 백엔드 API 기본 URL
  // 환경 변수에서 가져오거나 기본값 사용
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  
  // API 엔드포인트
  endpoints: {
    hospitals: {
      nearby: "/hospitals/nearby",
    },
  },
  
  // 요청 타임아웃 (ms)
  timeout: 10000,
  
  // 기본 헤더
  headers: {
    "Content-Type": "application/json",
  },
} as const

/**
 * API URL 생성 헬퍼 함수
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`
}

