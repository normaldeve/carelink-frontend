import { HospitalDocument, NearbyHospitalParams } from "@/types/hospital"
import { getApiUrl, API_CONFIG } from "./config"

/**
 * 근처 병원 검색 API 호출
 * 
 * CORS 문제를 피하기 위해 Next.js API Route를 통해 프록시 요청합니다.
 * 환경 변수 USE_API_PROXY가 true이거나 NEXT_PUBLIC_API_BASE_URL이 설정되지 않은 경우
 * Next.js API Route(/api/hospitals/nearby)를 사용합니다.
 * 
 * @param params 검색 파라미터 (위도, 경도, 반경)
 * @returns 병원 목록
 * 
 * @example
 * ```typescript
 * const hospitals = await findNearbyHospitals({
 *   lat: 37.5665,
 *   lng: 126.9780,
 *   km: 5
 * })
 * ```
 */
export async function findNearbyHospitals(
  params: NearbyHospitalParams
): Promise<HospitalDocument[]> {
  const { lat, lng, km } = params
  
  // 프록시 사용 여부 결정
  // NEXT_PUBLIC_USE_API_PROXY가 명시적으로 "false"가 아니면 프록시 사용 (기본값: 프록시 사용)
  const useProxy = 
    typeof window !== "undefined" && 
    process.env.NEXT_PUBLIC_USE_API_PROXY !== "false"
  
  let url: string
  
  if (useProxy && typeof window !== "undefined") {
    // Next.js API Route를 통해 프록시 요청 (CORS 문제 없음)
    const proxyUrl = new URL("/api/hospitals/nearby", window.location.origin)
    proxyUrl.searchParams.append("lat", lat.toString())
    proxyUrl.searchParams.append("lng", lng.toString())
    proxyUrl.searchParams.append("km", km.toString())
    url = proxyUrl.toString()
  } else {
    // 백엔드 API에 직접 요청 (백엔드에서 CORS 설정 필요)
    const backendUrl = new URL(getApiUrl(API_CONFIG.endpoints.hospitals.nearby))
    backendUrl.searchParams.append("lat", lat.toString())
    backendUrl.searchParams.append("lng", lng.toString())
    backendUrl.searchParams.append("km", km.toString())
    url = backendUrl.toString()
  }
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: API_CONFIG.headers,
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(`API 요청 실패: ${response.status} ${errorData.error || response.statusText}`)
    }
    
    const data: HospitalDocument[] = await response.json()
    return data
  } catch (error) {
    console.error("근처 병원 검색 중 오류 발생:", error)
    throw error
  }
}

/**
 * GeoJsonPoint 형태의 location을 { lat, lng } 형태로 변환
 */
export function parseHospitalLocation(location: HospitalDocument["location"]): {
  lat: number
  lng: number
} {
  if ("coordinates" in location && Array.isArray(location.coordinates)) {
    // GeoJsonPoint 형태: [longitude, latitude]
    return {
      lng: location.coordinates[0],
      lat: location.coordinates[1],
    }
  }
  
  if ("lat" in location && "lng" in location) {
    return {
      lat: location.lat,
      lng: location.lng,
    }
  }
  
  throw new Error("유효하지 않은 location 형식입니다")
}

