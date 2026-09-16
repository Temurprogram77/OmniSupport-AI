"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function SandboxBanner() {
  return (
    <aside
      aria-label="Sandbox Environment Notice"
      className="w-full bg-amber-500/[0.07] backdrop-blur-md border-b border-amber-500/20 text-xs text-amber-200/90 py-1.5 px-3 sm:px-4 flex items-center justify-center shrink-0 z-20 select-none"
    >
      <div className="flex items-center gap-2.5 max-w-7xl mx-auto">
        {/* Amber pulsing radar status dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
        </span>

        {/* Copy - Responsive Desktop & Mobile */}
        <div className="text-center font-medium tracking-tight">
          <span className="hidden sm:inline">
            <span className="font-semibold text-amber-100">
              Interactive Sandbox:
            </span>{" "}
            Pre-authenticated as{" "}
            <span className="text-amber-100 font-semibold px-1 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
              Sarah Jenkins
            </span>{" "}
            for instant live tool-calling. No login required.
          </span>
          <span className="inline sm:hidden">
            <span className="font-semibold text-amber-100">Demo Sandbox:</span>{" "}
            Pre-authenticated for instant testing.
          </span>
        </div>

        {/* Subtle pill tag for technical recruiters / leads */}
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300 ml-1">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>Live Supabase &amp; Tools</span>
        </span>
      </div>
    </aside>
  );
}
