"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

const HERO_PHOTO = process.env.NEXT_PUBLIC_LANDING_HERO_BG

type Particle = {
  width: number
  height: number
  left: number
  top: number
  opacity: number
  duration: number
  delay: number
}

type LandingHeroParkBackdropProps = {
  mouseX: number
  mouseY: number
  particles: Particle[]
  className?: string
}

export function LandingHeroParkBackdrop({
  mouseX,
  mouseY,
  particles,
  className,
}: LandingHeroParkBackdropProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {HERO_PHOTO ? (
        <Image
          src={HERO_PHOTO}
          alt=""
          fill
          className="object-cover opacity-[0.38] mix-blend-soft-light"
          sizes="(max-width: 1024px) 100vw, 1152px"
          priority
        />
      ) : null}

      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0c1814] via-background to-[#040605]"
        style={{
          opacity: HERO_PHOTO ? 0.72 : 1,
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[min(140vw,200vh)] w-[min(140vw,200vh)] -translate-x-1/2 -translate-y-1/2 opacity-[0.09] mix-blend-screen motion-reduce:opacity-[0.04]">
        <div
          className="rootsy-lens-flare h-full w-full"
          style={{
            background:
              "conic-gradient(from 210deg, transparent 0%, transparent 28%, rgba(52, 211, 153, 0.22) 36%, transparent 44%, transparent 48%, rgba(45, 212, 191, 0.12) 52%, transparent 58%, transparent 72%, rgba(16, 185, 129, 0.15) 82%, transparent 92%)",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="rootsy-ambient-pulse absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(16, 185, 129, 0.2), transparent 55%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 75% 85%, rgba(45, 212, 191, 0.08), transparent 50%)",
        }}
      />

      <div
        className="absolute h-[min(100%,520px)] w-[min(100%,520px)] rounded-full opacity-[0.14] blur-[100px] transition-all duration-[2000ms] ease-out motion-reduce:transition-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--rootsy-particle) 55%, transparent) 0%, transparent 68%)",
          left: `${mouseX}%`,
          top: `${mouseY}%`,
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-emerald-950/25 via-transparent to-transparent" />

      {particles.map((particle, i) => (
        <div
          key={i}
          className="animate-float absolute rounded-full motion-reduce:animate-none"
          style={{
            width: particle.width + "px",
            height: particle.height + "px",
            left: particle.left + "%",
            top: particle.top + "%",
            background: "var(--rootsy-particle)",
            opacity: particle.opacity,
            animationDuration: particle.duration + "s",
            animationDelay: particle.delay + "s",
          }}
        />
      ))}

      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,9,0.5)_100%)]"
        style={{
          opacity: HERO_PHOTO ? 0.85 : 1,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent sm:via-background/40" />
    </div>
  )
}
