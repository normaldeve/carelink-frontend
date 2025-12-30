"use client"

import { useReveal } from "@/hooks/use-reveal"

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-6 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-12 transition-all duration-700 md:mb-16 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Capabilities
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">/ What CareLink brings to healthcare</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-x-16 md:gap-y-12 lg:gap-x-24">
          {[
            {
              title: "Public Hospital Data Integration",
              subtitle: "Powered by Seoul's official healthcare data",
              description: "CareLink uses trusted public hospital data from Seoul to provide accurate, up-to-date medical information you can rely on.",
              direction: "top",
            },
            {
              title: "Conversational Appointment Booking",
              subtitle: "Book hospitals through natural conversation",
              description: "No phone calls or complex forms. Users can book, view, and cancel hospital appointments simply by chatting with CareLink.",
              direction: "right",
            },
            {
              title: "Smart Reservation Management",
              subtitle: "Your appointments, clearly organized",
              description: "CareLink keeps track of your reservations in one place, allowing you to easily check upcoming visits and manage changes anytime.",
              direction: "left",
            },
            {
              title: "AI-Powered Medical Summaries",
              subtitle: "Turning conversations into clear clinical context",
              description: "CareLink summarizes consultation conversations using AI and delivers structured insights to hospitals before each appointment for smoother care.",
              direction: "bottom",
            },
          ].map((service, i) => (
            <ServiceCard key={i} service={service} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  index,
  isVisible,
}: {
  service: { title: string; subtitle?: string; description: string; direction: string }
  index: number
  isVisible: boolean
}) {
  const getRevealClass = () => {
    if (!isVisible) {
      switch (service.direction) {
        case "left":
          return "-translate-x-16 opacity-0"
        case "right":
          return "translate-x-16 opacity-0"
        case "top":
          return "-translate-y-16 opacity-0"
        case "bottom":
          return "translate-y-16 opacity-0"
        default:
          return "translate-y-12 opacity-0"
      }
    }
    return "translate-x-0 translate-y-0 opacity-100"
  }

  return (
    <div
      className={`group transition-all duration-700 ${getRevealClass()}`}
      style={{
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px w-8 bg-foreground/30 transition-all duration-300 group-hover:w-12 group-hover:bg-foreground/50" />
        <span className="font-mono text-xs text-foreground/60">0{index + 1}</span>
      </div>
      <h3 className="mb-2 font-sans text-2xl font-light text-foreground md:text-3xl">{service.title}</h3>
      {service.subtitle && (
        <p className="mb-2 font-mono text-xs text-foreground/60 md:text-sm">{service.subtitle}</p>
      )}
      <p className="max-w-sm text-sm leading-relaxed text-foreground/80 md:text-base">{service.description}</p>
    </div>
  )
}
