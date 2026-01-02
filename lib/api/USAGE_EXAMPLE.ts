/**
 * API 사용 예시 코드
 * 실제 컴포넌트에서 참고용으로 사용할 수 있습니다.
 * 
 * 주의: 이 파일은 예시이며, 실제 연동은 work-section.tsx 등에서 구현해야 합니다.
 */

import { findNearbyHospitals, parseHospitalLocation } from "./hospital"
import type { HospitalDocument } from "@/types/hospital"

/**
 * 예시 1: 근처 병원 검색
 */
export async function example1_SearchNearbyHospitals() {
  try {
    const hospitals = await findNearbyHospitals({
      lat: 37.5665,  // 위도
      lng: 126.9780, // 경도
      km: 5          // 반경 5km
    })
    
    console.log("검색된 병원 수:", hospitals.length)
    hospitals.forEach(hospital => {
      console.log(`${hospital.name} - ${hospital.address}`)
    })
    
    return hospitals
  } catch (error) {
    console.error("병원 검색 실패:", error)
    throw error
  }
}

/**
 * 예시 2: 위치 정보 파싱
 */
export function example2_ParseLocation(hospital: HospitalDocument) {
  try {
    const { lat, lng } = parseHospitalLocation(hospital.location)
    console.log(`병원 위치: ${lat}, ${lng}`)
    return { lat, lng }
  } catch (error) {
    console.error("위치 파싱 실패:", error)
    throw error
  }
}

/**
 * 예시 3: React 컴포넌트에서 사용 (Hook 형태)
 */
/*
import { useState } from "react"

export function useNearbyHospitals() {
  const [hospitals, setHospitals] = useState<HospitalDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = async (lat: number, lng: number, km: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await findNearbyHospitals({ lat, lng, km })
      setHospitals(results)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }

  return { hospitals, loading, error, search }
}
*/

/**
 * 예시 4: work-section.tsx에서 사용하는 방법
 */
/*
// work-section.tsx 내부에서

import { findNearbyHospitals, parseHospitalLocation } from "@/lib/api/hospital"
import type { HospitalDocument } from "@/types/hospital"

// 현재 위치가 변경되었을 때 근처 병원 검색
useEffect(() => {
  if (!userLocation) return
  
  const searchNearby = async () => {
    try {
      const hospitals = await findNearbyHospitals({
        lat: userLocation.lat,
        lng: userLocation.lng,
        km: 5 // 5km 반경
      })
      
      // 지도에 마커 표시하는 로직
      hospitals.forEach(hospital => {
        const { lat, lng } = parseHospitalLocation(hospital.location)
        // 마커 생성 코드...
      })
    } catch (error) {
      console.error("근처 병원 검색 실패:", error)
    }
  }
  
  searchNearby()
}, [userLocation])
*/

