"use client"

import { useReveal } from "@/hooks/use-reveal"
import { useEffect, useRef, useState, useCallback } from "react"
import { findNearbyHospitals, parseHospitalLocation } from "@/lib/api/hospital"
import type { HospitalDocument } from "@/types/hospital"

declare global {
  interface Window {
    naver: any
    navermap_authFailure?: () => void
  }
}

interface LocationMarker {
  id: string
  name: string
  type: "hospital" | "pharmacy"
  lat: number
  lng: number
}

interface WorkSectionProps {
  highlightedLocation?: { lat: number; lng: number; name: string } | null
}

export function WorkSection({ highlightedLocation }: WorkSectionProps) {
  const { ref, isVisible } = useReveal(0.3)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const userLocationMarkerRef = useRef<any>(null)
  const locationMarkersRef = useRef<any[]>([])
  const infoWindowsRef = useRef<any[]>([])
  const highlightedMarkerRef = useRef<any>(null)
  const searchRadiusCircleRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [hospitals, setHospitals] = useState<HospitalDocument[]>([])
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false)
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(1) // 기본값: 1km, 최대: 3km

  // Mock 데이터: 병원과 약국
  const mockLocations: LocationMarker[] = [
    {
      id: "hospital-1",
      name: "서울대학교병원",
      type: "hospital",
      lat: 37.5665,
      lng: 126.9780,
    },
    {
      id: "pharmacy-1",
      name: "건강약국",
      type: "pharmacy",
      lat: 37.5685,
      lng: 126.9800,
    },
  ]

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAP_KEY_ID || ""
  const scriptSrc = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`

  // 스크립트 로드 처리
  useEffect(() => {
    if (typeof window === "undefined") return

    // 인증 실패 시 처리 (공식 문서 기준)
    window.navermap_authFailure = () => {
      console.error("네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요.")
    }

    // 이미 naver API가 로드되어 있는 경우
    if (window.naver && window.naver.maps) {
      setIsLoaded(true)
      return
    }

    // 스크립트가 이미 DOM에 있는지 확인
    const existingScript = document.querySelector(`script[src*="oapi.map.naver.com"]`)
    if (existingScript) {
      // 스크립트가 있지만 아직 로드되지 않은 경우, 로드 이벤트 대기
      if (window.naver && window.naver.maps) {
        setIsLoaded(true)
      } else {
        existingScript.addEventListener("load", () => setIsLoaded(true))
      }
      return
    }

    // 스크립트가 없으면 새로 추가
    const script = document.createElement("script")
    script.src = scriptSrc
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => {
      console.error("네이버 지도 스크립트 로드 실패")
    }
    document.head.appendChild(script)

    return () => {
      // cleanup은 하지 않음 (다른 곳에서도 사용할 수 있으므로)
    }
  }, [scriptSrc])

  // 현재 위치 가져오기 함수
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn("이 브라우저는 위치 정보를 지원하지 않습니다.")
      return
    }

    setIsLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLocation({ lat, lng })
        setIsLocationLoading(false)
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error)
        setIsLocationLoading(false)
        // 에러가 발생해도 지도는 계속 표시 (기본 위치 사용)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // 현재 위치 마커 업데이트 함수
  const updateUserLocationMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.naver) return

    // 기존 마커 제거
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null)
    }

    // 새 마커 추가
    const userLocationPoint = new window.naver.maps.LatLng(lat, lng)
    userLocationMarkerRef.current = new window.naver.maps.Marker({
      position: userLocationPoint,
      map: mapInstanceRef.current,
      icon: {
        content: `
          <div style="position:relative;width:32px;height:32px;">
            <div style="
              position:absolute;
              top:0;
              left:0;
              width:32px;
              height:32px;
              background:#4285F4;
              border-radius:50%;
              border:4px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(66,133,244,0.3);
            "></div>
            <div style="
              position:absolute;
              top:50%;
              left:50%;
              transform:translate(-50%,-50%);
              width:12px;
              height:12px;
              background:white;
              border-radius:50%;
            "></div>
          </div>
        `,
        anchor: new window.naver.maps.Point(16, 16),
      },
      title: "내 위치",
      zIndex: 300,
    })

    // 현재 위치 InfoWindow 생성
    const infoContent = `
      <div style="
        padding: 12px;
        min-width: 180px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 20px;">📍</span>
          <h3 style="
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          ">내 위치</h3>
        </div>
        <div style="
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        ">
          <p style="margin: 4px 0;">
            <strong>위도:</strong> ${lat.toFixed(6)}
          </p>
          <p style="margin: 4px 0;">
            <strong>경도:</strong> ${lng.toFixed(6)}
          </p>
        </div>
      </div>
    `

    const userInfoWindow = new window.naver.maps.InfoWindow({
      content: infoContent,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      anchorSize: { width: 10, height: 10 },
      pixelOffset: { x: 0, y: -10 },
    })

    // 마커 클릭 시 InfoWindow 열기
    window.naver.maps.Event.addListener(userLocationMarkerRef.current, "click", () => {
      infoWindowsRef.current.forEach((iw) => iw.close())
      userInfoWindow.open(mapInstanceRef.current, userLocationMarkerRef.current)
    })
  }, [])

  // 지도 초기화 및 마커 표시
  useEffect(() => {
    if (!isVisible || !isLoaded || !mapRef.current || !window.naver || mapInstanceRef.current) return

    // 기본 중심점 설정 (서울시청)
    const defaultCenter = new window.naver.maps.LatLng(37.5665, 126.9780)

    const mapOptions = {
      center: defaultCenter,
      zoom: 15,
      zoomControl: false,
      scaleControl: false,
      mapDataControl: false,
    }

    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, mapOptions)

    // 기존 마커 및 InfoWindow 제거
    locationMarkersRef.current.forEach((marker) => marker.setMap(null))
    locationMarkersRef.current = []
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close())
    infoWindowsRef.current = []
    
    // 기존 검색 반경 Circle 제거
    if (searchRadiusCircleRef.current) {
      searchRadiusCircleRef.current.setMap(null)
    }

    // 지도 초기화 시 현재 위치 가져오기
    getCurrentLocation()

    // Mock 데이터는 제거하고, 사용자가 "근처 병원 조회" 버튼을 클릭할 때만 API로 데이터를 가져옴
  }, [isVisible, isLoaded, getCurrentLocation, updateUserLocationMarker])

  // userLocation이 변경되면 마커 업데이트 및 지도 중심 이동
  useEffect(() => {
    if (userLocation && mapInstanceRef.current && window.naver) {
      updateUserLocationMarker(userLocation.lat, userLocation.lng)
      
      // 지도 중심을 현재 위치로 이동
      const userLocationPoint = new window.naver.maps.LatLng(userLocation.lat, userLocation.lng)
      mapInstanceRef.current.setCenter(userLocationPoint)
      mapInstanceRef.current.setZoom(16)
    }
  }, [userLocation, updateUserLocationMarker])

  // highlightedLocation이 변경되면 해당 위치로 이동하고 강조 표시
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver || !highlightedLocation) return

    // 지도 중심 이동
    const location = new window.naver.maps.LatLng(highlightedLocation.lat, highlightedLocation.lng)
    mapInstanceRef.current.setCenter(location)
    mapInstanceRef.current.setZoom(17)

    // 기존 강조 마커 제거
    if (highlightedMarkerRef.current) {
      highlightedMarkerRef.current.setMap(null)
    }

    // 강조 마커 추가 (더 크고 눈에 띄게)
    const highlightIcon = {
      content: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 40px;
            height: 40px;
            background-color: #00AA00;
            border: 4px solid #FFD700;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,215,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          ">
            <div style="
              transform: rotate(45deg);
              font-size: 20px;
            ">💊</div>
          </div>
          <div style="
            margin-top: 6px;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
            text-shadow: 2px 2px 4px rgba(255,255,255,0.9), -2px -2px 4px rgba(255,255,255,0.9);
            background: rgba(255,255,255,0.9);
            padding: 2px 8px;
            border-radius: 4px;
          ">${highlightedLocation.name}</div>
        </div>
      `,
      anchor: new window.naver.maps.Point(20, 60),
    }

    highlightedMarkerRef.current = new window.naver.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: highlightedLocation.name,
      icon: highlightIcon,
      zIndex: 200,
    })

    // InfoWindow 자동 열기
    const infoContent = `
      <div style="
        padding: 12px;
        min-width: 200px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 20px;">💊</span>
          <h3 style="
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          ">${highlightedLocation.name}</h3>
        </div>
        <div style="
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        ">
          <p style="margin: 4px 0;">
            <strong>유형:</strong> 약국
          </p>
          <p style="margin: 4px 0;">
            <strong>위치:</strong> ${highlightedLocation.lat.toFixed(4)}, ${highlightedLocation.lng.toFixed(4)}
          </p>
        </div>
      </div>
    `

    const highlightInfoWindow = new window.naver.maps.InfoWindow({
      content: infoContent,
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      anchorSize: { width: 10, height: 10 },
      pixelOffset: { x: 0, y: -10 },
    })

    highlightInfoWindow.open(mapInstanceRef.current, highlightedMarkerRef.current)
  }, [highlightedLocation, isLoaded])

  // 검색 반경을 지도에 원형으로 표시하는 함수
  const displaySearchRadius = useCallback((lat: number, lng: number, km: number) => {
    if (!mapInstanceRef.current || !window.naver) return

    // 기존 반경 Circle 제거
    if (searchRadiusCircleRef.current) {
      searchRadiusCircleRef.current.setMap(null)
    }

    // km를 미터로 변환 (1km = 1000m)
    const radiusInMeters = km * 1000

    // Circle 생성
    searchRadiusCircleRef.current = new window.naver.maps.Circle({
      map: mapInstanceRef.current,
      center: new window.naver.maps.LatLng(lat, lng),
      radius: radiusInMeters,
      fillColor: "#4285F4", // 파란색
      fillOpacity: 0.15, // 반투명
      strokeColor: "#4285F4", // 테두리 색상
      strokeWeight: 2, // 테두리 두께
      strokeOpacity: 0.5, // 테두리 투명도
      zIndex: 1, // 마커보다 아래에 표시
    })
  }, [])

  // 병원들을 위치 기반으로 클러스터링하는 함수 (50m 이내 병원들을 하나로 묶음)
  const clusterHospitals = useCallback((hospitals: HospitalDocument[]): HospitalDocument[][] => {
    const clusters: HospitalDocument[][] = []
    const processed = new Set<string>()

    hospitals.forEach((hospital, index) => {
      if (processed.has(hospital.id)) return

      const cluster: HospitalDocument[] = [hospital]
      processed.add(hospital.id)

      const { lat: lat1, lng: lng1 } = parseHospitalLocation(hospital.location)

      hospitals.forEach((otherHospital, otherIndex) => {
        if (index === otherIndex || processed.has(otherHospital.id)) return

        const { lat: lat2, lng: lng2 } = parseHospitalLocation(otherHospital.location)

        // 두 점 사이의 거리 계산 (미터 단위, Haversine 공식)
        const R = 6371000 // 지구 반지름 (미터)
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLng = ((lng2 - lng1) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c // 미터 단위

        // 50m 이내면 같은 클러스터로
        if (distance < 50) {
          cluster.push(otherHospital)
          processed.add(otherHospital.id)
        }
      })

      clusters.push(cluster)
    })

    return clusters
  }, [])

  // 클러스터의 중심점 계산
  const calculateClusterCenter = useCallback((hospitals: HospitalDocument[]): { lat: number; lng: number } => {
    let sumLat = 0
    let sumLng = 0

    hospitals.forEach((hospital) => {
      const { lat, lng } = parseHospitalLocation(hospital.location)
      sumLat += lat
      sumLng += lng
    })

    return {
      lat: sumLat / hospitals.length,
      lng: sumLng / hospitals.length,
    }
  }, [])

  // 병원 데이터를 지도에 마커로 표시하는 함수 (클러스터링 적용)
  const displayHospitalMarkers = useCallback((hospitalList: HospitalDocument[]) => {
    if (!mapInstanceRef.current || !window.naver) return

    // 기존 병원 마커만 제거 (사용자 위치 마커는 유지)
    locationMarkersRef.current.forEach((marker) => marker.setMap(null))
    locationMarkersRef.current = []
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close())
    infoWindowsRef.current = []

    // 병원들을 클러스터로 그룹화
    const clusters = clusterHospitals(hospitalList)

    clusters.forEach((cluster) => {
      const isCluster = cluster.length > 1
      const center = calculateClusterCenter(cluster)

      // 클러스터 마커 또는 단일 마커 생성
      const markerIcon = {
        content: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              width: ${isCluster ? "40px" : "30px"};
              height: ${isCluster ? "40px" : "30px"};
              background-color: ${isCluster ? "#FF6B35" : "#FF0000"};
              border: 2px solid white;
              border-radius: ${isCluster ? "50%" : "50% 50% 50% 0"};
              ${isCluster ? "" : "transform: rotate(-45deg);"}
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              ${isCluster ? `
                <span style="
                  color: white;
                  font-weight: 700;
                  font-size: 16px;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">${cluster.length}</span>
              ` : `
                <div style="
                  transform: rotate(45deg);
                  font-size: 16px;
                ">🏥</div>
              `}
            </div>
            ${!isCluster ? `
              <div style="
                margin-top: 4px;
                white-space: nowrap;
                font-size: 12px;
                font-weight: 600;
                color: #1f2937;
                text-shadow: 1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8);
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${cluster[0].name}</div>
            ` : ""}
          </div>
        `,
        anchor: new window.naver.maps.Point(isCluster ? 20 : 15, isCluster ? 20 : 45),
      }

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(center.lat, center.lng),
        map: mapInstanceRef.current,
        title: isCluster ? `${cluster.length}개 병원` : cluster[0].name,
        icon: markerIcon,
        zIndex: 100,
      })

      // InfoWindow 생성
      let infoContent: string

      if (isCluster) {
        // 클러스터인 경우 리스트 형식으로 표시
        infoContent = `
          <div style="
            padding: 12px;
            min-width: 300px;
            max-width: 400px;
            max-height: 400px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            ">
              <span style="font-size: 20px;">🏥</span>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
              ">병원 ${cluster.length}개</h3>
            </div>
            <div style="
              display: flex;
              flex-direction: column;
              gap: 12px;
            ">
              ${cluster.map((hospital, idx) => {
                const { lat, lng } = parseHospitalLocation(hospital.location)
                return `
                  <div style="
                    padding: 10px;
                    background-color: ${idx % 2 === 0 ? "#f9fafb" : "#ffffff"};
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='${idx % 2 === 0 ? "#f9fafb" : "#ffffff"}'">
                    <div style="
                      font-size: 14px;
                      font-weight: 600;
                      color: #1f2937;
                      margin-bottom: 6px;
                    ">${hospital.name}</div>
                    <div style="
                      font-size: 12px;
                      color: #6b7280;
                      line-height: 1.6;
                    ">
                      <div style="margin-bottom: 4px;">
                        <strong>진료과:</strong> ${hospital.department || "정보 없음"}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <strong>주소:</strong> ${hospital.address || "정보 없음"}
                      </div>
                      ${hospital.phone ? `<div><strong>전화:</strong> ${hospital.phone}</div>` : ""}
                    </div>
                  </div>
                `
              }).join("")}
            </div>
          </div>
        `
      } else {
        // 단일 병원인 경우 기존 형식 유지
        const hospital = cluster[0]
        infoContent = `
          <div style="
            padding: 12px;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="font-size: 20px;">🏥</span>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
              ">${hospital.name}</h3>
            </div>
            <div style="
              font-size: 13px;
              color: #6b7280;
              line-height: 1.5;
            ">
              <p style="margin: 4px 0;">
                <strong>진료과:</strong> ${hospital.department || "정보 없음"}
              </p>
              <p style="margin: 4px 0;">
                <strong>주소:</strong> ${hospital.address || "정보 없음"}
              </p>
              <p style="margin: 4px 0;">
                <strong>전화:</strong> ${hospital.phone || "정보 없음"}
              </p>
              ${hospital.info ? `<p style="margin: 4px 0;"><strong>안내:</strong> ${hospital.info}</p>` : ""}
            </div>
          </div>
        `
      }

      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoContent,
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        anchorSize: { width: 10, height: 10 },
        pixelOffset: { x: 0, y: -10 },
        maxWidth: 450,
      })

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, "click", () => {
        // 다른 InfoWindow 닫기
        infoWindowsRef.current.forEach((iw) => iw.close())
        // 현재 InfoWindow 열기
        infoWindow.open(mapInstanceRef.current, marker)
      })

      locationMarkersRef.current.push(marker)
      infoWindowsRef.current.push(infoWindow)
    })

    // 병원이 있으면 지도 범위 조정
    if (hospitalList.length > 0 && mapInstanceRef.current) {
      try {
        const bounds = new window.naver.maps.LatLngBounds()

        clusters.forEach((cluster) => {
          const center = calculateClusterCenter(cluster)
          bounds.extend(new window.naver.maps.LatLng(center.lat, center.lng))
        })

        // 사용자 위치도 범위에 포함
        if (userLocation) {
          bounds.extend(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng))
        }

        mapInstanceRef.current.fitBounds(bounds, { padding: 50 })
      } catch (error) {
        console.error("지도 범위 조정 실패:", error)
      }
    }
  }, [clusterHospitals, calculateClusterCenter, userLocation])

  // 근처 병원 조회 함수
  const handleSearchNearbyHospitals = useCallback(async () => {
    if (!mapInstanceRef.current || !window.naver) {
      alert("지도가 아직 준비되지 않았습니다.")
      return
    }

    // 현재 위치가 없으면 먼저 위치를 가져옴
    let searchLat = userLocation?.lat
    let searchLng = userLocation?.lng

    if (!searchLat || !searchLng) {
      // 현재 위치 가져오기
      if (!navigator.geolocation) {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.")
        return
      }

      setIsSearchingHospitals(true)
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        })

        searchLat = position.coords.latitude
        searchLng = position.coords.longitude
      } catch (error) {
        setIsSearchingHospitals(false)
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.")
        return
      }
    }

    if (!searchLat || !searchLng) {
      setIsSearchingHospitals(false)
      return
    }

    setIsSearchingHospitals(true)

    try {
      // 검색 반경을 지도에 표시
      displaySearchRadius(searchLat, searchLng, searchRadiusKm)

      const hospitalList = await findNearbyHospitals({
        lat: searchLat,
        lng: searchLng,
        km: searchRadiusKm,
      })

      setHospitals(hospitalList)
      displayHospitalMarkers(hospitalList)

      if (hospitalList.length === 0) {
        alert("근처에 병원이 없습니다.")
      }
    } catch (error) {
      console.error("근처 병원 검색 실패:", error)
      alert("근처 병원 검색에 실패했습니다. API 서버 연결을 확인해주세요.")
    } finally {
      setIsSearchingHospitals(false)
    }
  }, [userLocation, displayHospitalMarkers, displaySearchRadius, searchRadiusKm])

  // 내 위치 보기 버튼 클릭 핸들러
  const handleCurrentLocation = () => {
    if (!mapInstanceRef.current || !window.naver) return
    getCurrentLocation()
  }

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start px-6 pt-24 md:px-12 md:pt-28 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl h-full flex flex-col pt-4">
        <div
          className={`mb-4 transition-all duration-700 md:mb-6 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-3xl font-light tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Maps
          </h2>
          <p className="mb-4 font-mono text-sm text-foreground/60 md:text-base">/ Find hospitals near you</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-3">
              <button
                onClick={handleSearchNearbyHospitals}
                disabled={isSearchingHospitals}
                className="px-4 py-2 rounded-lg border border-foreground/30 bg-transparent text-sm font-sans text-foreground/70 hover:border-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearchingHospitals ? "검색 중..." : "근처 병원 조회"}
              </button>
              <button
                onClick={() => {
                  // 근처 약국 조회 기능 구현
                  console.log("근처 약국 조회")
                }}
                className="px-4 py-2 rounded-lg border border-foreground/30 bg-transparent text-sm font-sans text-foreground/70 hover:border-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
              >
                근처 약국 조회
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground/60">검색 반경:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((km) => (
                  <button
                    key={km}
                    onClick={() => setSearchRadiusKm(km)}
                    className={`px-3 py-1 rounded-md text-xs font-sans transition-all duration-200 ${
                      searchRadiusKm === km
                        ? "bg-foreground text-background"
                        : "border border-foreground/30 bg-transparent text-foreground/70 hover:border-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative flex-1 rounded-lg overflow-hidden border border-foreground/10 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "200ms", maxHeight: "calc(100vh - 200px)" }}
        >
          <div 
            ref={mapRef} 
            className="w-full h-full [&_a[title*='NAVER']]:hidden [&_a[href*='naver']]:hidden [&_div[title*='NAVER']]:hidden"
          />
          <button
            onClick={handleCurrentLocation}
            className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-foreground/90 backdrop-blur-md text-white hover:bg-foreground transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="내 위치 보기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="M4.93 4.93l2.83 2.83" />
              <path d="M16.24 16.24l2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="M4.93 19.07l2.83-2.83" />
              <path d="M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
