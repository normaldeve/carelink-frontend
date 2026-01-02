/**
 * 병원 Document 타입 정의
 * 백엔드 HospitalDocument와 일치하는 TypeScript 타입
 */
export interface HospitalDocument {
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
    coordinates: [number, number] // [longitude, latitude] 형태
  } | {
    lat: number
    lng: number
  }
  startTime?: Record<string, string> // 요일별 시작 시간 (MON, TUE, ..., SUN, HOLIDAY)
  closeTime?: Record<string, string> // 요일별 종료 시간
  updatedAt: string // ISO 8601 날짜 문자열
}

/**
 * 근처 병원 검색 파라미터
 */
export interface NearbyHospitalParams {
  lat: number // 위도
  lng: number // 경도
  km: number // 반경 (킬로미터)
}

