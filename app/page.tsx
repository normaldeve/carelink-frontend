"use client"

import { Shader, ChromaFlow, Swirl } from "shaders/react"
import { CustomCursor } from "@/components/custom-cursor"
import { GrainOverlay } from "@/components/grain-overlay"
import { WorkSection } from "@/components/sections/work-section"
import { ServicesSection } from "@/components/sections/services-section"
import { MagneticButton } from "@/components/magnetic-button"
import { ChatBot } from "@/components/chat-bot"
import { useRef, useEffect, useState, type FormEvent } from "react"

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const shaderContainerRef = useRef<HTMLDivElement>(null)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // Consultation 기능을 위한 state
  const [formData, setFormData] = useState({ name: "", phoneNumber: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showChatBot, setShowChatBot] = useState(false)
  const [highlightedLocation, setHighlightedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)


  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "")
    const limitedNumbers = numbers.slice(0, 11)
    if (limitedNumbers.length <= 3) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phoneNumber: formatted })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name || !formData.phoneNumber) {
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSubmitting(false)
    setShowChatBot(true)
  }

  useEffect(() => {
    const checkShaderReady = () => {
      if (shaderContainerRef.current) {
        const canvas = shaderContainerRef.current.querySelector("canvas")
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          setIsLoaded(true)
          return true
        }
      }
      return false
    }

    if (checkShaderReady()) return

    const intervalId = setInterval(() => {
      if (checkShaderReady()) {
        clearInterval(intervalId)
      }
    }, 100)

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true)
    }, 1500)

    return () => {
      clearInterval(intervalId)
      clearTimeout(fallbackTimer)
    }
  }, [])

  // 타이핑 효과
  useEffect(() => {
    if (!isLoaded) return

    const fullText = "Healthcare\njust a conversation"
    let currentIndex = 0
    setIsTyping(true)
    setDisplayedText("")

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
      }
    }, 80) // 각 글자마다 80ms 간격

    return () => {
      clearInterval(typingInterval)
    }
  }, [isLoaded])

  const scrollToSection = (index: number) => {
    setCurrentSection(index)
  }




  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <CustomCursor />
      <GrainOverlay />

      <div
        ref={shaderContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ contain: "strict" }}
      >
        <Shader className="h-full w-full">
          <Swirl
            colorA="#f5f5dc"
            colorB="#22c55e"
            speed={0.8}
            detail={0.8}
            blend={50}
            coarseX={40}
            coarseY={40}
            mediumX={40}
            mediumY={40}
            fineX={40}
            fineY={40}
          />
          <ChromaFlow
            baseColor="#22c55e"
            upColor="#22c55e"
            downColor="#f5f5dc"
            leftColor="#22c55e"
            rightColor="#22c55e"
            intensity={0.9}
            radius={1.8}
            momentum={25}
            maskType="alpha"
            opacity={0.97}
          />
        </Shader>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 transition-opacity duration-700 md:px-12 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => scrollToSection(0)}
          className="flex items-center gap-2 transition-transform hover:scale-105"
        >
          <span className="font-sans text-xl font-semibold tracking-tight text-foreground">CareLink</span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {["Home", "Maps", "Services"].map((item, index) => (
            <button
              key={item}
              onClick={() => scrollToSection(index)}
              className={`group relative font-sans text-base font-medium transition-colors ${
                currentSection === index ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {item}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-foreground transition-all duration-300 ${
                  currentSection === index ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          ))}
        </div>
      </nav>

      <div
        ref={scrollContainerRef}
        data-scroll-container
        className={`relative z-10 h-screen overflow-x-hidden overflow-y-hidden transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSection * 100}%)` }}
        >
        {/* Hero Section */}
        <section className="flex min-h-screen w-screen shrink-0 items-center px-6 pb-16 pt-24 md:px-12 md:pb-24">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-8 md:grid-cols-[1fr_1.3fr] md:gap-16 lg:gap-24">
              {/* Left side - Hero content */}
              <div className="flex flex-col justify-center">
                <h1 className="mb-6 font-sans text-6xl font-light leading-[1.1] tracking-tight text-foreground md:text-7xl lg:text-8xl">
                  <span className="whitespace-pre-line">
                    {displayedText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </span>
                </h1>
                <p className="mb-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 text-lg leading-relaxed text-foreground/90 duration-1000 delay-200 md:text-xl">
                  <span className="text-pretty">
                    CareLink helps you book hospital appointments and access public healthcare services through a simple,
                    conversational chat experience.
                  </span>
                </p>
              </div>

              {/* Right side - Consultation Form/ChatBot */}
              <div className="flex flex-col justify-center">
                {showChatBot ? (
                  <div className="h-[600px] w-full rounded-lg border border-foreground/10 bg-background/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                    <ChatBot
                      userName={formData.name || "Guest"}
                      phoneNumber={formData.phoneNumber}
                      onClose={() => setShowChatBot(false)}
                      onNavigateToMaps={() => scrollToSection(1)}
                      onShowLocation={(lat, lng, name) => setHighlightedLocation({ lat, lng, name })}
                    />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                    <div>
                      <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handlePhoneNumberChange}
                        required
                        className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                        placeholder="010-1234-5678"
                        maxLength={13}
                      />
                    </div>

                    <div>
                      <MagneticButton
                        variant="primary"
                        size="lg"
                        className="w-full disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Starting..." : "Start Consultation"}
                      </MagneticButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        <WorkSection highlightedLocation={highlightedLocation} />
        <ServicesSection />
        </div>
      </div>

      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}
