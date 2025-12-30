"use client"

import { useReveal } from "@/hooks/use-reveal"
import { useEffect, useRef, useState } from "react"

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
  const [isLoaded, setIsLoaded] = useState(false)

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

  // 지도 초기화 및 마커 표시
  useEffect(() => {
    if (!isVisible || !isLoaded || !mapRef.current || !window.naver || mapInstanceRef.current) return

    const mapOptions = {
      center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울시청 좌표
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

    // Mock 데이터로 마커 생성
    mockLocations.forEach((location) => {
      const isHospital = location.type === "hospital"
      const markerColor = isHospital ? "#FF0000" : "#00AA00" // 병원: 빨간색, 약국: 초록색
      const iconSymbol = isHospital ? "🏥" : "💊"

      const markerIcon = {
        content: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              width: 30px;
              height: 30px;
              background-color: ${markerColor};
              border: 2px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                font-size: 16px;
              ">${iconSymbol}</div>
            </div>
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
            ">${location.name}</div>
          </div>
        `,
        anchor: new window.naver.maps.Point(15, 45),
      }

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(location.lat, location.lng),
        map: mapInstanceRef.current,
        title: location.name,
        icon: markerIcon,
        zIndex: 100,
      })

      // InfoWindow 생성
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
            <span style="font-size: 20px;">${iconSymbol}</span>
            <h3 style="
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
            ">${location.name}</h3>
          </div>
          <div style="
            font-size: 13px;
            color: #6b7280;
            line-height: 1.5;
          ">
            <p style="margin: 4px 0;">
              <strong>유형:</strong> ${isHospital ? "병원" : "약국"}
            </p>
            <p style="margin: 4px 0;">
              <strong>주소:</strong> 서울특별시 중구 세종대로 110
            </p>
            <p style="margin: 4px 0;">
              <strong>전화:</strong> ${isHospital ? "02-2072-2114" : "02-1234-5678"}
            </p>
            ${isHospital ? '<p style="margin: 4px 0;"><strong>진료과:</strong> 내과, 외과, 소아과</p>' : '<p style="margin: 4px 0;"><strong>영업시간:</strong> 09:00 - 21:00</p>'}
          </div>
        </div>
      `

      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoContent,
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        anchorSize: { width: 10, height: 10 },
        pixelOffset: { x: 0, y: -10 },
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
  }, [isVisible, isLoaded])

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

  // 내 위치 보기 버튼 클릭 핸들러
  const handleCurrentLocation = () => {
    if (!mapInstanceRef.current || !window.naver) return

    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 정보를 지원하지 않습니다.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = new window.naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        )

        // 지도 중심 이동
        mapInstanceRef.current.setCenter(userLocation)
        mapInstanceRef.current.setZoom(16)

        // 기존 마커 제거
        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setMap(null)
        }

        // 새 마커 추가
        userLocationMarkerRef.current = new window.naver.maps.Marker({
          position: userLocation,
          map: mapInstanceRef.current,
          icon: {
            content:
              '<div style="position:relative;width:24px;height:24px;"><div style="position:absolute;top:0;left:0;width:24px;height:24px;background:#4285F4;border-radius:50%;border:4px solid #1a56db;box-shadow:0 2px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,1);"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;background:white;border-radius:50%;"></div></div>',
            anchor: new window.naver.maps.Point(12, 12),
          },
          title: "내 위치",
        })
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error)
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.")
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
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
          <div className="flex gap-3">
            <button
              onClick={() => {
                // 근처 병원 조회 기능 구현
                console.log("근처 병원 조회")
              }}
              className="px-4 py-2 rounded-lg border border-foreground/30 bg-transparent text-sm font-sans text-foreground/70 hover:border-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
            >
              근처 병원 조회
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
