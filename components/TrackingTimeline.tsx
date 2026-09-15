"use client";

import React from "react";
import { CheckCircle2, Clock, MapPin, Truck, AlertCircle } from "lucide-react";
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
  "Order Confirmed",
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

  return (
    <div className="bg-slate-900/90 text-white rounded-xl border border-slate-800 p-4 shadow-lg my-3 space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Carrier</div>
            <div className="text-sm font-semibold text-white">
              {tracking.courierName}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-slate-400">Tracking #</div>
          <div className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-indigo-300 font-semibold">
            {tracking.trackingNumber}
          </div>
        </div>
      </div>

      {/* Progress Bar Stages */}
      <div className="py-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(activeIndex / (ALL_STAGES.length - 1)) * 100}%`,
            }}
          />

          {ALL_STAGES.map((stage, idx) => {
            const isCompleted = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={stage}
                className="relative z-10 flex flex-col items-center group"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors border-2",
                    isCurrent
                      ? "bg-indigo-600 border-white text-white ring-4 ring-indigo-500/30 font-bold"
                      : isCompleted
                      ? "bg-emerald-600 border-emerald-400 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 hidden sm:block text-center max-w-[70px] leading-tight",
                    isCurrent
                      ? "text-indigo-300 font-bold"
                      : isCompleted
                      ? "text-slate-300"
                      : "text-slate-500"
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Checkpoint & ETA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 block">Current Location</span>
            <span className="font-medium text-slate-200">
              {tracking.currentLocation || "In transit"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 block">Estimated Delivery</span>
            <span className="font-semibold text-amber-300">
              {tracking.estimatedDelivery || "Pending Carrier Update"}
            </span>
          </div>
        </div>
      </div>

      {/* Checkpoint logs if available */}
      {tracking.checkpoints && tracking.checkpoints.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Route Activity Log
          </div>
          <div className="space-y-2 pl-2 border-l border-slate-800">
            {tracking.checkpoints.map((cp, idx) => (
              <div key={idx} className="relative pl-3 text-xs">
                <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>{cp.timestamp}</span>
                  <span>{cp.location}</span>
                </div>
                <div className="font-medium text-slate-200">{cp.status}</div>
                <div className="text-slate-400 text-[11px]">{cp.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
