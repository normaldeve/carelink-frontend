"use client"

import { useReveal } from "@/hooks/use-reveal"
import { useState, type FormEvent } from "react"
import { MagneticButton } from "@/components/magnetic-button"
import { ChatBot } from "@/components/chat-bot"

export function ContactSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [formData, setFormData] = useState({ name: "", phoneNumber: "", selectedService: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showChatBot, setShowChatBot] = useState(false)

  const services = [
    "병원 예약",
    "예약 조회",
    "예약 취소",
    "근처 약국 조회"
  ]

  const handleServiceSelect = (service: string) => {
    setFormData({ ...formData, selectedService: service })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name || !formData.phoneNumber || !formData.selectedService) {
      return
    }

    setIsSubmitting(true)

    // Simulate form submission delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsSubmitting(false)
    setShowChatBot(true)
  }

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-4 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] md:gap-16 lg:gap-24">
          <div className="flex flex-col justify-center">
            <div
              className={`mb-6 transition-all duration-700 md:mb-12 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
              }`}
            >
              <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
                Let's
                <br />
                talk
              </h2>
              <p className="font-mono text-xs text-foreground/60 md:text-base">/ Get in touch</p>
            </div>

            <div className="space-y-4 md:space-y-8">
            </div>
          </div>

          {/* Right side - Form or ChatBot */}
          <div className="flex flex-col justify-center">
            {showChatBot ? (
              <div className="h-[700px] w-full rounded-lg border border-foreground/10 bg-background/50 backdrop-blur-sm">
                <ChatBot
                  userName={formData.name}
                  phoneNumber={formData.phoneNumber}
                  onClose={() => setShowChatBot(false)}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                  }`}
                  style={{ transitionDelay: "200ms" }}
                >
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

                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                  }`}
                  style={{ transitionDelay: "350ms" }}
                >
                  <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                  }`}
                  style={{ transitionDelay: "500ms" }}
                >
                  <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Service</label>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceSelect(service)}
                        className={`px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-sans ${
                          formData.selectedService === service
                            ? "bg-foreground/10 border-foreground/50 text-foreground"
                            : "bg-transparent border-foreground/30 text-foreground/70 hover:border-foreground/50 hover:text-foreground"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  }`}
                  style={{ transitionDelay: "650ms" }}
                >
                  <MagneticButton
                    variant="primary"
                    size="lg"
                    className="w-full disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </MagneticButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
