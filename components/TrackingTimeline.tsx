"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Copy,
  CheckCheck,
  Radio,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackingCheckpoint {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  courierName: string;
  trackingNumber: string;
  currentStatus: string;
  currentLocation: string;
  estimatedDelivery: string;
  checkpoints?: TrackingCheckpoint[];
}

const ALL_STAGES = [
  "Confirmed",
  "Label Created",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

export default function TrackingTimeline({
  tracking,
}: {
  tracking: TrackingInfo;
}) {
  const [copied, setCopied] = useState(false);
  const currentNormalized = (tracking.currentStatus || "").toLowerCase();

  const getStageIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return 4;
    if (s.includes("out for delivery")) return 3;
    if (s.includes("transit") || s.includes("picked up")) return 2;
    if (s.includes("label") || s.includes("processing")) return 1;
    return 0;
  };

  const activeIndex = getStageIndex(currentNormalized);

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(tracking.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get carrier brand styling
  const getCarrierBadge = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("dhl")) {
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    }
    if (n.includes("fedex")) {
      return "bg-purple-500/10 text-purple-300 border-purple-500/30";
    }
    if (n.includes("ups")) {
      return "bg-amber-700/20 text-amber-200 border-amber-600/30";
    }
    return "bg-sky-500/10 text-sky-300 border-sky-500/30";
  };

  return (
    <div className="bg-[#121215] text-zinc-100 rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-2xl my-3 space-y-4 backdrop-blur relative overflow-hidden">
      {/* Subtle top highlight gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">
                {tracking.courierName}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  getCarrierBadge(tracking.courierName)
                )}
              >
                Carrier Verified
              </span>
            </div>
            <span className="text-xs text-zinc-400">
              Live Transit Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-white/[0.08] px-2.5 py-1.5 rounded-xl text-xs">
          <span className="text-[11px] text-zinc-400 font-medium">Tracking:</span>
          <span className="font-mono font-bold text-sky-300">
            {tracking.trackingNumber}
          </span>
          <button
            onClick={copyTrackingNumber}
            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer ml-0.5"
            title="Copy tracking number"
          >
            {copied ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar Stages */}
      <div className="py-2 px-1">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out"
            style={{
              width: `calc(${(activeIndex / (ALL_STAGES.length - 1)) * 100}% - 2rem)`,
            }}
          />

          {ALL_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={stage}
                className="relative z-10 flex flex-col items-center group"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-300 border relative",
                    isCurrent
                      ? "bg-sky-500 border-white text-zinc-950 font-bold shadow-lg shadow-sky-500/40 scale-110"
                      : isCompleted
                      ? "bg-emerald-500 border-emerald-400 text-zinc-950 font-bold shadow-sm"
                      : "bg-[#18181b] border-zinc-700 text-zinc-500"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute -inset-1 rounded-full bg-sky-500/30 animate-radar-ping pointer-events-none" />
                  )}

                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span className="font-mono text-[11px]">{idx + 1}</span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] mt-2 text-center max-w-[64px] sm:max-w-[76px] leading-tight transition-colors font-medium",
                    isCurrent
                      ? "text-sky-300 font-bold"
                      : isCompleted
                      ? "text-zinc-300"
                      : "text-zinc-500"
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkpoint ETA & Location Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="bg-[#18181b] p-3 rounded-xl border border-white/[0.06] flex items-start gap-2.5 shadow-sm">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block">
              Current Checkpoint
            </span>
            <span className="font-semibold text-white truncate block mt-0.5">
              {tracking.currentLocation || "In transit"}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {tracking.currentStatus}
            </span>
          </div>
        </div>

        <div className="bg-[#18181b] p-3 rounded-xl border border-white/[0.06] flex items-start gap-2.5 shadow-sm">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block">
              Estimated Delivery
            </span>
            <span className="font-bold text-amber-300 text-sm block mt-0.5">
              {tracking.estimatedDelivery || "Pending carrier confirmation"}
            </span>
            <span className="text-[11px] text-zinc-400">
              Guaranteed Courier Window
            </span>
          </div>
        </div>
      </div>

      {/* Checkpoint logs if available */}
      {tracking.checkpoints && tracking.checkpoints.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-sky-400" />
              Route Transit History
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {tracking.checkpoints.length} Checkpoints
            </span>
          </div>

          <div className="space-y-2.5 pl-2 border-l border-zinc-800 ml-1">
            {tracking.checkpoints.map((cp, idx) => (
              <div key={idx} className="relative pl-3.5 text-xs">
                <div
                  className={cn(
                    "absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ring-2 ring-[#121215]",
                    idx === tracking.checkpoints!.length - 1
                      ? "bg-sky-400"
                      : "bg-zinc-600"
                  )}
                />
                <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono">
                  <span>{cp.timestamp}</span>
                  <span className="text-zinc-500">{cp.location}</span>
                </div>
                <div className="font-semibold text-zinc-200 mt-0.5">
                  {cp.status}
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed">
                  {cp.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
