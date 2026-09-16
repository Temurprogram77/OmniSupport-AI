"use client";

import React, { useState } from "react";
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Copy,
  CheckCheck,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolExecutionRecord } from "@/lib/agent/executor";

export default function ToolActivityBadge({
  toolCall,
}: {
  toolCall: ToolExecutionRecord;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRejected =
    toolCall.result?.status === "REJECTED" ||
    toolCall.result?.ruleViolation === true;

  const isFailed =
    !isRejected &&
    (toolCall.result?.success === false ||
      toolCall.result?.status === "FAILED" ||
      toolCall.result?.found === false ||
      Boolean(toolCall.result?.error));

  const isSuccess = !isRejected && !isFailed;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      JSON.stringify(
        { tool: toolCall.toolName, args: toolCall.args, result: toolCall.result },
        null,
        2
      )
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 text-xs font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-all duration-200 cursor-pointer shadow-sm select-none",
          isRejected
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/40 shadow-rose-500/5"
            : isFailed
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/40 shadow-amber-500/5"
            : "bg-sky-500/10 border-sky-500/25 text-sky-200 hover:bg-sky-500/15 hover:border-sky-500/40 shadow-sky-500/5"
        )}
      >
        <div
          className={cn(
            "p-0.5 rounded",
            isRejected
              ? "bg-rose-500/20 text-rose-300"
              : isFailed
              ? "bg-amber-500/20 text-amber-300"
              : "bg-sky-500/20 text-sky-300"
          )}
        >
          <Terminal className="w-3 h-3" />
        </div>

        <span className="font-semibold text-zinc-400">tool:</span>
        <span className="font-semibold text-white tracking-tight">
          {toolCall.toolName}()
        </span>

        <span className="text-zinc-500">•</span>

        {isRejected ? (
          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
            <AlertTriangle className="w-3 h-3" /> Rejected by Policy
          </span>
        ) : isFailed ? (
          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <Check className="w-3 h-3 stroke-[2.5]" /> Executed
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Accordion Payload Inspector */}
      {isOpen && (
        <div className="mt-2 p-3 bg-[#0d0d10] border border-white/[0.08] rounded-xl text-zinc-300 font-mono text-[11px] shadow-2xl relative overflow-hidden backdrop-blur animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Tool Invocation Trace
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/[0.05]"
              title="Copy JSON trace"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                Parameters
              </div>
              <pre className="text-sky-300 bg-zinc-950/80 p-2 rounded-lg border border-white/[0.04] mt-1 overflow-x-auto">
                {JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                Database Mutation & Result
              </div>
              <pre
                className={cn(
                  "p-2 rounded-lg border mt-1 overflow-x-auto",
                  isRejected
                    ? "text-rose-300 bg-rose-950/20 border-rose-500/20"
                    : isFailed
                    ? "text-amber-300 bg-amber-950/20 border-amber-500/20"
                    : "text-emerald-300 bg-emerald-950/20 border-emerald-500/20"
                )}
              >
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
