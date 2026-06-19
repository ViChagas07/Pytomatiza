/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — AuraBackground
   Symbolic AI automation serpent — "Intelligence flowing through systems".

   An abstract, futuristic Python-inspired visual identity element built
   from intelligent workflow paths, automation lines, AI nodes, circuitry,
   and subtle geometric structures.

   ── Design principles ──
   • Extremely subtle (4–10% opacity) — users discover it naturally
   • Serpent formed from workflow paths, NOT an animal illustration
   • Head: upper right (partially off-screen)
   • Body: S-curve flowing diagonally through the page
   • Tail: lower left (partially off-screen)
   • Soft moving aura clouds around key segments
   • Subtle parallax on mouse movement

   ── Visual elements ──
   • Main serpent body (3 overlapping paths for depth)
   • AI decision nodes along the spine
   • Circuit branches (L/T-shaped workflow paths from nodes)
   • Gears/mechanical details at junction points
   • Micro-nodes (tiny data/flow dots)
   • Geometric head cluster (processor-die aesthetic)
   • Aura clouds (blurred ellipses with slow breathing animation)

   Colors resolve from CSS custom properties set by
   AccentColorScript and AppearanceSync, adapting to
   the user's chosen accent color and theme.

   Respects .reduce-motion automatically.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function AuraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [motionOffset, setMotionOffset] = useState({ x: 0, y: 0 });

  /* Detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Delay initial render so CSS variables from AccentColorScript settle */
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  /* ── Device motion (shake → sway effect) ───────────────────── */
  useEffect(() => {
    let lastX = 0, lastY = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const ax = e.accelerationIncludingGravity?.x ?? 0;
      const ay = e.accelerationIncludingGravity?.y ?? 0;
      // Smooth the motion
      const smoothX = lastX + (ax - lastX) * 0.3;
      const smoothY = lastY + (ay - lastY) * 0.3;
      lastX = smoothX;
      lastY = smoothY;
      setMotionOffset({ x: smoothX * 3, y: smoothY * 3 });
    };

    if (typeof DeviceMotionEvent !== "undefined") {
      // Request permission for iOS
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        // Needs user gesture to request — skip for now, use mouse/touch instead
      } else {
        window.addEventListener("devicemotion", handleMotion);
      }
    }
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  /* ── Mouse parallax ──────────────────────────────────────────── */
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : e.clientY;

      const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [handlePointerMove]);

  const parallaxX = mousePos.x * 10 + motionOffset.x;
  const parallaxY = mousePos.y * 10 + motionOffset.y;
  const cloudOffsetX = mousePos.x * -5 + motionOffset.x * 0.5;
  const cloudOffsetY = mousePos.y * -5 + motionOffset.y * 0.5;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 will-change-transform"
      aria-hidden="true"
      style={{
        opacity: isMounted ? 1 : 0,
        transition: "opacity 1.2s ease-in",
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          filter: isMobile ? "brightness(2.5) saturate(1.5)" : undefined,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── Filters ──────────────────────────────────────── */}
          <filter id="aura-blur-1">
            <feGaussianBlur stdDeviation="60" />
          </filter>
          <filter id="aura-blur-2">
            <feGaussianBlur stdDeviation="80" />
          </filter>
          <filter id="aura-blur-3">
            <feGaussianBlur stdDeviation="45" />
          </filter>
          <filter id="aura-blur-4">
            <feGaussianBlur stdDeviation="35" />
          </filter>
          <filter id="body-glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* ── Gradients ────────────────────────────────────── */}
          <linearGradient
            id="serpent-grad"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--brand-accent)" />
            <stop
              offset="60%"
              stopColor="var(--brand-accent)"
              stopOpacity="0.8"
            />
            <stop
              offset="100%"
              stopColor="var(--brand-primary)"
              stopOpacity="0.6"
            />
          </linearGradient>

          <linearGradient
            id="branch-grad"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--brand-accent-light)" />
            <stop offset="100%" stopColor="var(--brand-primary)" />
          </linearGradient>
        </defs>

        {/* ══════════════════════════════════════════════════════
           AURA CLOUDS — Soft blurred ellipses with slow breathing
           Positioned at key segments of the serpent body.
           ══════════════════════════════════════════════════════ */}
        <g
          style={{
            transform: `translate(${cloudOffsetX}px, ${cloudOffsetY}px)`,
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Cloud 1 — near head */}
          <ellipse
            cx="1120"
            cy="180"
            rx="280"
            ry="160"
            fill="var(--brand-accent)"
            opacity="0.04"
            filter="url(#aura-blur-1)"
            className="aura-cloud aura-cloud-1"
          />

          {/* Cloud 2 — mid-body */}
          <ellipse
            cx="750"
            cy="480"
            rx="340"
            ry="200"
            fill="var(--brand-primary)"
            opacity="0.03"
            filter="url(#aura-blur-2)"
            className="aura-cloud aura-cloud-2"
          />

          {/* Cloud 3 — near tail */}
          <ellipse
            cx="320"
            cy="760"
            rx="240"
            ry="150"
            fill="var(--brand-accent-light)"
            opacity="0.025"
            filter="url(#aura-blur-3)"
            className="aura-cloud aura-cloud-3"
          />

          {/* Cloud 4 — inner curve accent glow */}
          <ellipse
            cx="520"
            cy="380"
            rx="200"
            ry="140"
            fill="var(--brand-python-blue)"
            opacity="0.02"
            filter="url(#aura-blur-4)"
            className="aura-cloud aura-cloud-4"
          />
        </g>

        {/* ══════════════════════════════════════════════════════
           MAIN SERPENT BODY — S-curve from top-right to bottom-left
           
           Path tracing:
           M 1400,20  → head starts off-screen top-right
           C …        → S-curve through center
           C …        → tail ends off-screen bottom-left
           
           Three overlapping paths create depth:
           1. Outer glow     (12px, blurred)
           2. Main body      (3px, primary accent)
           3. Inner line     (1px, blue highlight)
           4. Offset line    (1.5px, for depth)
           ══════════════════════════════════════════════════════ */}

        {/* 1 — Outer glow path */}
        <path
          d="M 1400,20 C 1200,160 1100,90 1020,260 C 940,430 860,360 780,500 C 700,640 580,570 480,690 C 380,810 240,760 80,900"
          stroke="var(--brand-accent)"
          strokeWidth="12"
          fill="none"
          opacity="0.015"
          filter="url(#body-glow)"
          className="serpent-glow"
        />

        {/* 2 — Main body path (primary accent color) */}
        <path
          d="M 1400,20 C 1200,160 1100,90 1020,260 C 940,430 860,360 780,500 C 700,640 580,570 480,690 C 380,810 240,760 80,900"
          stroke="var(--brand-accent)"
          strokeWidth="2.5"
          fill="none"
          opacity="0.065"
          className="serpent-body-main"
        />

        {/* 3 — Inner highlight line (blue, thinner) */}
        <path
          d="M 1400,24 C 1200,164 1100,94 1020,264 C 940,434 860,364 780,504 C 700,644 580,574 480,694 C 380,814 240,764 80,904"
          stroke="var(--brand-primary)"
          strokeWidth="1"
          fill="none"
          opacity="0.045"
          className="serpent-body-inner"
        />

        {/* 4 — Secondary offset body (creates depth) */}
        <path
          d="M 1400,16 C 1200,156 1100,86 1020,256 C 940,426 860,356 780,496 C 700,636 580,566 480,686 C 380,806 240,756 80,896"
          stroke="var(--brand-python-blue)"
          strokeWidth="1.2"
          fill="none"
          opacity="0.035"
          className="serpent-body-offset"
        />

        {/* ══════════════════════════════════════════════════════
           CIRCUIT BRANCHES — L/T-shaped workflow paths branching
           from key nodes along the body. Represents automation
           orchestration and system connections.
           ══════════════════════════════════════════════════════ */}
        <g
          opacity="0.05"
          stroke="var(--brand-accent)"
          strokeWidth="0.7"
          className="serpent-branches"
        >
          {/* Branch set 1 — near head */}
          <path
            d="M 1130,140 L 1170,130 L 1170,100"
            className="serpent-branch"
          />
          <path
            d="M 1130,140 L 1090,150 L 1090,180"
            className="serpent-branch"
          />

          {/* Branch set 2 — upper curve */}
          <path
            d="M 1040,220 L 1080,240 L 1110,220"
            className="serpent-branch"
          />
          <path
            d="M 1040,220 L 1000,200 L 970,220"
            className="serpent-branch"
          />

          {/* Branch set 3 — upper inflection */}
          <path
            d="M 940,360 L 980,340 L 1010,360"
            className="serpent-branch"
          />
          <path
            d="M 940,360 L 900,390 L 870,370"
            className="serpent-branch"
          />
          <path
            d="M 940,360 L 950,400 L 920,420"
            className="serpent-branch"
          />

          {/* Branch set 4 — mid-body */}
          <path
            d="M 830,470 L 870,490 L 900,470"
            className="serpent-branch"
          />
          <path
            d="M 830,470 L 790,450 L 760,470"
            className="serpent-branch"
          />

          {/* Branch set 5 — lower curve */}
          <path
            d="M 710,590 L 750,610 L 780,590"
            className="serpent-branch"
          />
          <path
            d="M 710,590 L 670,570 L 640,590"
            className="serpent-branch"
          />

          {/* Branch set 6 — bottom */}
          <path
            d="M 580,630 L 540,610 L 510,630"
            className="serpent-branch"
          />
          <path
            d="M 580,630 L 620,650 L 650,630"
            className="serpent-branch"
          />

          {/* Branch set 7 — rising curve */}
          <path
            d="M 460,710 L 420,730 L 390,710"
            className="serpent-branch"
          />
          <path
            d="M 460,710 L 500,730 L 530,710"
            className="serpent-branch"
          />

          {/* Branch set 8 — near tail */}
          <path
            d="M 340,780 L 300,760 L 270,780"
            className="serpent-branch"
          />
          <path
            d="M 340,780 L 380,800 L 410,780"
            className="serpent-branch"
          />

          {/* Branch set 9 — tail */}
          <path
            d="M 200,830 L 160,850 L 130,830"
            className="serpent-branch"
          />
        </g>

        {/* ══════════════════════════════════════════════════════
           HEAD — Geometric cluster suggesting an intelligent
           processor core / neural network structure.
           NOT an animal head — purely abstract AI geometry.
           ══════════════════════════════════════════════════════ */}
        <g opacity="0.06" className="serpent-head">
          {/* Outer head shell */}
          <path
            d="M 1160,100 C 1200,60 1250,80 1230,140 C 1210,200 1140,200 1120,160 C 1100,120 1120,80 1160,100"
            stroke="var(--brand-accent)"
            strokeWidth="1.2"
            fill="none"
            className="head-outer"
          />

          {/* Inner head core */}
          <path
            d="M 1150,110 C 1180,80 1220,95 1205,140 C 1190,185 1145,185 1130,155 C 1115,125 1130,95 1150,110"
            stroke="var(--brand-accent-light)"
            strokeWidth="0.8"
            fill="none"
            className="head-inner"
          />

          {/* Head geometric nodes */}
          <circle
            cx="1160"
            cy="120"
            r="3.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.8"
            fill="var(--brand-accent)"
            fillOpacity="0.25"
          />
          <circle
            cx="1180"
            cy="100"
            r="2"
            stroke="var(--brand-primary)"
            strokeWidth="0.7"
            fill="var(--brand-primary)"
            fillOpacity="0.2"
          />
          <circle
            cx="1200"
            cy="135"
            r="1.8"
            stroke="var(--brand-accent)"
            strokeWidth="0.6"
            fill="none"
          />
          <circle
            cx="1140"
            cy="150"
            r="2.5"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.7"
            fill="var(--brand-python-blue)"
            fillOpacity="0.2"
          />
          <circle
            cx="1185"
            cy="160"
            r="1.5"
            stroke="var(--brand-accent-light)"
            strokeWidth="0.5"
            fill="var(--brand-accent-light)"
            fillOpacity="0.3"
          />

          {/* Head connecting wires */}
          <line
            x1="1160"
            y1="120"
            x2="1180"
            y2="100"
            stroke="var(--brand-accent)"
            strokeWidth="0.7"
          />
          <line
            x1="1180"
            y1="100"
            x2="1200"
            y2="135"
            stroke="var(--brand-primary)"
            strokeWidth="0.5"
          />
          <line
            x1="1200"
            y1="135"
            x2="1140"
            y2="150"
            stroke="var(--brand-accent)"
            strokeWidth="0.5"
          />
          <line
            x1="1140"
            y1="150"
            x2="1160"
            y2="120"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.5"
          />
          <line
            x1="1180"
            y1="100"
            x2="1185"
            y2="160"
            stroke="var(--brand-accent-light)"
            strokeWidth="0.4"
          />
          <line
            x1="1200"
            y1="135"
            x2="1160"
            y2="120"
            stroke="var(--brand-primary)"
            strokeWidth="0.4"
          />
        </g>

        {/* ══════════════════════════════════════════════════════
           AI / SPINE NODES — Decision points along the body.
           Positioned at key intervals tracing the S-curve.
           ══════════════════════════════════════════════════════ */}
        <g opacity="0.055" className="serpent-nodes">
          <circle
            cx="1210"
            cy="90"
            r="2"
            stroke="var(--brand-accent)"
            strokeWidth="0.7"
            fill="var(--brand-accent)"
          />
          <circle
            cx="1130"
            cy="140"
            r="3"
            stroke="var(--brand-primary)"
            strokeWidth="0.8"
            fill="var(--brand-primary)"
          />
          <circle
            cx="1040"
            cy="220"
            r="2"
            stroke="var(--brand-accent)"
            strokeWidth="0.6"
            fill="var(--brand-accent)"
          />
          <circle
            cx="960"
            cy="310"
            r="3.5"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.8"
            fill="var(--brand-python-blue)"
          />
          <circle
            cx="890"
            cy="390"
            r="2.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.7"
            fill="var(--brand-accent)"
          />
          <circle
            cx="830"
            cy="470"
            r="3"
            stroke="var(--brand-primary)"
            strokeWidth="0.8"
            fill="var(--brand-primary)"
          />
          <circle
            cx="710"
            cy="590"
            r="2"
            stroke="var(--brand-accent)"
            strokeWidth="0.6"
            fill="var(--brand-accent)"
          />
          <circle
            cx="580"
            cy="630"
            r="3.5"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.8"
            fill="var(--brand-python-blue)"
          />
          <circle
            cx="460"
            cy="710"
            r="2.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.7"
            fill="var(--brand-accent)"
          />
          <circle
            cx="340"
            cy="780"
            r="3"
            stroke="var(--brand-primary)"
            strokeWidth="0.8"
            fill="var(--brand-primary)"
          />
          <circle
            cx="200"
            cy="830"
            r="2"
            stroke="var(--brand-accent)"
            strokeWidth="0.6"
            fill="var(--brand-accent)"
          />
          <circle
            cx="110"
            cy="880"
            r="1.5"
            stroke="var(--brand-accent-light)"
            strokeWidth="0.5"
            fill="none"
          />
        </g>

        {/* ══════════════════════════════════════════════════════
           GEARS — Mechanical details at junction points.
           Simple circles with dashed stroke for teeth.
           ══════════════════════════════════════════════════════ */}
        <g opacity="0.04" className="serpent-gears">
          {/* Gear 1 — head junction */}
          <circle
            cx="1160"
            cy="120"
            r="7"
            stroke="var(--brand-accent)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="3 2"
          />
          <circle
            cx="1160"
            cy="120"
            r="2.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.4"
            fill="none"
          />

          {/* Gear 2 — upper curve */}
          <circle
            cx="960"
            cy="310"
            r="6.5"
            stroke="var(--brand-primary)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2.5 2"
          />
          <circle
            cx="960"
            cy="310"
            r="2"
            stroke="var(--brand-primary)"
            strokeWidth="0.4"
            fill="none"
          />

          {/* Gear 3 — mid-body */}
          <circle
            cx="830"
            cy="470"
            r="5.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.45"
            fill="none"
            strokeDasharray="2 1.5"
          />
          <circle
            cx="830"
            cy="470"
            r="2"
            stroke="var(--brand-accent)"
            strokeWidth="0.35"
            fill="none"
          />

          {/* Gear 4 — lower curve */}
          <circle
            cx="580"
            cy="630"
            r="6"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2.5 2"
          />
          <circle
            cx="580"
            cy="630"
            r="2"
            stroke="var(--brand-python-blue)"
            strokeWidth="0.4"
            fill="none"
          />

          {/* Gear 5 — rising curve */}
          <circle
            cx="460"
            cy="710"
            r="4.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.45"
            fill="none"
            strokeDasharray="2 1.5"
          />
          <circle
            cx="460"
            cy="710"
            r="1.5"
            stroke="var(--brand-accent)"
            strokeWidth="0.35"
            fill="none"
          />

          {/* Gear 6 — near tail */}
          <circle
            cx="200"
            cy="830"
            r="3.5"
            stroke="var(--brand-primary)"
            strokeWidth="0.4"
            fill="none"
            strokeDasharray="1.5 1"
          />
          <circle
            cx="200"
            cy="830"
            r="1.2"
            stroke="var(--brand-primary)"
            strokeWidth="0.3"
            fill="none"
          />
        </g>

        {/* ══════════════════════════════════════════════════════
           MICRO NODES — Tiny scattered data/flow dots near
           workflow paths, suggesting data packets in transit.
           ══════════════════════════════════════════════════════ */}
        <g opacity="0.035" className="serpent-micro-nodes">
          <circle cx="1170" cy="170" r="0.8" fill="var(--brand-accent)" />
          <circle cx="1070" cy="130" r="1" fill="var(--brand-primary)" />
          <circle cx="1020" cy="240" r="0.7" fill="var(--brand-accent-light)" />
          <circle cx="980" cy="330" r="1.2" fill="var(--brand-accent)" />
          <circle cx="930" cy="440" r="0.8" fill="var(--brand-primary)" />
          <circle cx="870" cy="500" r="1" fill="var(--brand-python-blue)" />
          <circle cx="790" cy="550" r="0.7" fill="var(--brand-accent)" />
          <circle cx="750" cy="600" r="1" fill="var(--brand-primary)" />
          <circle cx="680" cy="610" r="0.8" fill="var(--brand-accent-light)" />
          <circle cx="620" cy="660" r="1.2" fill="var(--brand-accent)" />
          <circle cx="530" cy="680" r="0.8" fill="var(--brand-primary)" />
          <circle cx="490" cy="720" r="1" fill="var(--brand-python-blue)" />
          <circle cx="400" cy="770" r="0.7" fill="var(--brand-accent)" />
          <circle cx="300" cy="810" r="1" fill="var(--brand-accent-light)" />
          <circle cx="240" cy="840" r="0.6" fill="var(--brand-primary)" />
          <circle cx="150" cy="880" r="0.8" fill="var(--brand-accent)" />
        </g>

        {/* ══════════════════════════════════════════════════════
           ORTHOGONAL CIRCUIT TRACES — Small L/T-shaped traces
           near the body, reinforcing the engineering aesthetic.
           ══════════════════════════════════════════════════════ */}
        <g
          opacity="0.03"
          stroke="var(--brand-primary)"
          strokeWidth="0.5"
          className="serpent-circuit-lines"
        >
          <path d="M 1130,140 L 1130,160 L 1150,160" fill="none" />
          <path d="M 1040,220 L 1040,240 L 1020,240" fill="none" />
          <path d="M 940,360 L 940,380 L 920,380" fill="none" />
          <path d="M 830,470 L 830,490 L 810,490" fill="none" />
          <path d="M 710,590 L 710,610 L 730,610" fill="none" />
          <path d="M 580,630 L 580,650 L 560,650" fill="none" />
          <path d="M 460,710 L 460,730 L 480,730" fill="none" />
          <path d="M 340,780 L 340,800 L 320,800" fill="none" />
          <path d="M 200,830 L 200,850 L 180,850" fill="none" />
        </g>

        {/* ══════════════════════════════════════════════════════
           FLOW ARROWS — Subtle directional indicators along
           workflow branches suggesting orchestration flow.
           ══════════════════════════════════════════════════════ */}
        <g
          opacity="0.025"
          stroke="var(--brand-accent)"
          strokeWidth="0.5"
          className="serpent-flow-arrows"
        >
          <path d="M 1080,230 L 1050,250" fill="none" />
          <path d="M 900,380 L 870,400" fill="none" />
          <path d="M 680,570 L 650,590" fill="none" />
          <path d="M 550,650 L 520,670" fill="none" />
          <path d="M 400,740 L 370,760" fill="none" />
        </g>
      </svg>
    </div>
  );
}
