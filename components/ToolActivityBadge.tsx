"use client";

import React, { useState } from "react";
import { Wrench, ChevronDown, ChevronRight, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolExecutionRecord } from "@/lib/gemini/executor";

export default function ToolActivityBadge({
  toolCall,
}: {
  toolCall: ToolExecutionRecord;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isMutation =
    toolCall.toolName === "updateDeliveryAddress" ||
    toolCall.toolName === "cancelOrder";

  const isFailed =
    toolCall.result?.success === false ||
    toolCall.result?.found === false ||
    Boolean(toolCall.result?.error);

  return (
    <div className="my-2 text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] border transition-all cursor-pointer shadow-sm",
          isMutation
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
        )}
      >
        <Wrench className="w-3 h-3 shrink-0" />
        <span className="font-semibold">Tool:</span>
        <span>{toolCall.toolName}()</span>
        {isFailed ? (
          <span className="flex items-center gap-0.5 text-rose-400 font-bold ml-1">
            <AlertTriangle className="w-3 h-3" /> Failed / Rejected
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-emerald-400 font-bold ml-1">
            <Check className="w-3 h-3" /> Executed
          </span>
        )}
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] space-y-2 overflow-x-auto">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Function Arguments
            </div>
            <pre className="text-indigo-300 mt-0.5">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          <div className="border-t border-slate-800 pt-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Database Execution Result
            </div>
            <pre className="text-emerald-300 mt-0.5">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
