"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  reservations?: Reservation[]
  pharmacies?: Pharmacy[]
}

interface ChatBotProps {
  userName: string
  phoneNumber: string
  onClose?: () => void
  onShowLocation?: (lat: number, lng: number, name: string) => void
  onNavigateToMaps?: () => void
}

interface Reservation {
  id: string
  hospitalName: string
  department: string
  date: string
  time: string
  status: "예약완료" | "예약취소"
}

interface Pharmacy {
  id: string
  name: string
  address: string
  phone: string
  lat: number
  lng: number
  distance: string
}

export function ChatBot({ userName, phoneNumber, onClose, onShowLocation, onNavigateToMaps }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: `Hello ${userName}! I'm here to help you with your medical consultation. How can I assist you today?`,
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Mock 예약 데이터
  const mockReservations: Reservation[] = [
    {
      id: "1",
      hospitalName: "서울대학교병원",
      department: "내과",
      date: "2024-01-15",
      time: "14:00",
      status: "예약완료",
    },
    {
      id: "2",
      hospitalName: "세브란스병원",
      department: "정형외과",
      date: "2024-01-20",
      time: "10:30",
      status: "예약완료",
    },
    {
      id: "3",
      hospitalName: "아산병원",
      department: "소아과",
      date: "2024-01-18",
      time: "15:00",
      status: "예약취소",
    },
  ]

  // Mock 약국 데이터
  const mockPharmacies: Pharmacy[] = [
    {
      id: "pharmacy-1",
      name: "건강약국",
      address: "서울특별시 중구 세종대로 110",
      phone: "02-1234-5678",
      lat: 37.5685,
      lng: 126.9800,
      distance: "0.3km",
    },
    {
      id: "pharmacy-2",
      name: "메디컬약국",
      address: "서울특별시 중구 명동길 26",
      phone: "02-2345-6789",
      lat: 37.5630,
      lng: 126.9850,
      distance: "0.5km",
    },
    {
      id: "pharmacy-3",
      name: "24시 약국",
      address: "서울특별시 중구 을지로 100",
      phone: "02-3456-7890",
      lat: 37.5650,
      lng: 126.9900,
      distance: "0.8km",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 채팅 영역에 마우스가 있을 때 페이지 스크롤 방지
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer) return

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isAtTop = scrollTop === 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
      const isScrollingUp = e.deltaY < 0
      const isScrollingDown = e.deltaY > 0

      // 채팅 영역이 스크롤 가능한 상태이고, 위/아래 끝에 도달하지 않았으면 페이지 스크롤 방지
      if (scrollHeight > clientHeight) {
        if ((isScrollingUp && !isAtTop) || (isScrollingDown && !isAtBottom)) {
          e.stopPropagation()
        }
      } else {
        // 채팅 영역이 스크롤 불가능하면 페이지 스크롤 허용
        return
      }
    }

    messagesContainer.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      messagesContainer.removeEventListener("wheel", handleWheel)
    }
  }, [])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = inputMessage.trim()
    setInputMessage("")
    setIsTyping(true)

    // 예약 조회 및 약국 검색 키워드 확인
    setTimeout(() => {
      let botResponse = ""
      let reservations: Reservation[] | undefined = undefined
      let pharmacies: Pharmacy[] | undefined = undefined
      
      if (userInput.includes("예약 조회") || userInput.includes("예약조회") || userInput.includes("예약 확인")) {
        if (mockReservations.length === 0) {
          botResponse = "현재 예약된 내역이 없습니다."
        } else {
          botResponse = `총 ${mockReservations.length}건의 예약 내역이 있습니다.`
          reservations = mockReservations
        }
      } else if (userInput.includes("약국") || userInput.includes("근처 약국") || userInput.includes("약국 조회")) {
        if (mockPharmacies.length === 0) {
          botResponse = "근처 약국을 찾을 수 없습니다."
        } else {
          botResponse = `근처 약국 ${mockPharmacies.length}곳을 찾았습니다.`
          pharmacies = mockPharmacies
        }
      } else {
        botResponse = "Thank you for sharing your symptoms. I'm processing your information and will help you find the right medical service. Can you provide more details about when your symptoms started?"
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
        reservations: reservations,
        pharmacies: pharmacies,
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src="/chatbot-icon.png" 
            alt="Chatbot" 
            className="w-10 h-10 object-contain"
            onError={(e) => {
              // 이미지가 없을 경우 숨김 처리
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">CareLink Assistant</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
              <p className="font-mono text-xs text-foreground/60">Online</p>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="font-mono text-xs text-foreground/60 hover:text-foreground transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scrollbar"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.sender === "bot" && (
              <img 
                src="/chatbot-icon.png" 
                alt="Chatbot" 
                className="w-8 h-8 object-contain flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === "user"
                  ? "bg-foreground/10 text-foreground"
                  : "bg-foreground/5 text-foreground"
              }`}
            >
              <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              {message.reservations && message.reservations.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-foreground/20">
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">병원명</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">진료과</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">날짜</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">시간</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {message.reservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className="border-b border-foreground/10 hover:bg-foreground/5 transition-colors"
                        >
                          <td className="py-2 px-2 text-foreground/90">{reservation.hospitalName}</td>
                          <td className="py-2 px-2 text-foreground/90">{reservation.department}</td>
                          <td className="py-2 px-2 text-foreground/90">{reservation.date}</td>
                          <td className="py-2 px-2 text-foreground/90">{reservation.time}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs ${
                                reservation.status === "예약완료"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-600"
                              }`}
                            >
                              {reservation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {message.pharmacies && message.pharmacies.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-foreground/20">
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">약국명</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">주소</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">전화</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">거리</th>
                        <th className="text-left py-2 px-2 font-semibold text-foreground/80">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {message.pharmacies.map((pharmacy) => (
                        <tr
                          key={pharmacy.id}
                          className="border-b border-foreground/10 hover:bg-foreground/5 transition-colors"
                        >
                          <td className="py-2 px-2 text-foreground/90">{pharmacy.name}</td>
                          <td className="py-2 px-2 text-foreground/90">{pharmacy.address}</td>
                          <td className="py-2 px-2 text-foreground/90">{pharmacy.phone}</td>
                          <td className="py-2 px-2 text-foreground/90">{pharmacy.distance}</td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => {
                                if (onNavigateToMaps) {
                                  onNavigateToMaps()
                                }
                                if (onShowLocation) {
                                  setTimeout(() => {
                                    onShowLocation(pharmacy.lat, pharmacy.lng, pharmacy.name)
                                  }, 500)
                                }
                              }}
                              className="px-2 py-1 text-xs rounded bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                            >
                              자세히 보기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="font-mono text-xs text-foreground/40 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start justify-start gap-2">
            <img 
              src="/chatbot-icon.png" 
              alt="Chatbot" 
              className="w-8 h-8 object-contain flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="bg-foreground/5 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-foreground/10 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-b border-foreground/30 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </form>
    </div>
  )
}

