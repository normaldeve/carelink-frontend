import { NextRequest, NextResponse } from "next/server"

/**
 * 근처 병원 검색 API 프록시
 * CORS 문제를 해결하기 위한 Next.js API Route
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const km = searchParams.get("km")

  // 파라미터 검증
  if (!lat || !lng || !km) {
    return NextResponse.json(
      { error: "필수 파라미터가 누락되었습니다. (lat, lng, km)" },
      { status: 400 }
    )
  }

  // 백엔드 API URL
  const backendUrl = process.env.BACKEND_API_BASE_URL || "http://localhost:8080"
  const apiUrl = `${backendUrl}/hospitals/nearby?lat=${lat}&lng=${lng}&km=${km}`

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Next.js에서 서버 사이드에서 요청하므로 CORS 문제가 없음
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("백엔드 API 에러:", response.status, errorText)
      return NextResponse.json(
        { error: `백엔드 API 오류: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // CORS 헤더 추가 (필요시)
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("API 프록시 에러:", error)
    return NextResponse.json(
      { error: "백엔드 서버에 연결할 수 없습니다." },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

