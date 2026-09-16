"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  XCircle,
  ShieldAlert,
  ArrowUp,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ToolActivityBadge from "./ToolActivityBadge";
import TrackingTimeline, { TrackingInfo } from "./TrackingTimeline";
import OrderCard, { OrderData } from "./OrderCard";
import { ToolExecutionRecord } from "@/lib/agent/executor";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  toolCalls?: ToolExecutionRecord[];
  trackingData?: TrackingInfo | null;
  orderData?: OrderData | null;
  timestamp: string;
}

interface ChatInterfaceProps {
  onOrderMutated?: (orderNumber: string) => void;
  onSelectOrderPrompt?: (prompt: string) => void;
  injectedPrompt?: string;
  onClearInjectedPrompt?: () => void;
}

const QUICK_SUGGESTIONS = [
  {
    icon: Truck,
    label: "Track ORD-1002",
    prompt: "Track courier shipment for order ORD-1002",
    color: "hover:border-sky-500/40 hover:text-sky-300",
  },
  {
    icon: MapPin,
    label: "Update Address (ORD-1001)",
    prompt:
      "Please change the delivery address for order ORD-1001 to 742 Evergreen Terrace, Springfield, OR 97477",
    color: "hover:border-emerald-500/40 hover:text-emerald-300",
  },
  {
    icon: XCircle,
    label: "Cancel Order (ORD-1001)",
    prompt: "Cancel order ORD-1001 because I ordered the wrong color",
    color: "hover:border-rose-500/40 hover:text-rose-300",
  },
  {
    icon: ShieldAlert,
    label: "Test Guardrail (ORD-1002)",
    prompt: "Please cancel order ORD-1002",
    color: "hover:border-amber-500/40 hover:text-amber-300",
  },
  {
    icon: Package,
    label: "Details (ORD-1003)",
    prompt: "What items are included in my order ORD-1003?",
    color: "hover:border-indigo-500/40 hover:text-indigo-300",
  },
];

export default function ChatInterface({
  onOrderMutated,
  injectedPrompt,
  onClearInjectedPrompt,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "model",
      content:
        "Hello! I am **OmniSupport AI**, your autonomous logistics and customer service specialist.\n\n" +
        "I am directly connected to your **Supabase PostgreSQL** database and carry out real-world operations using **Google Gemini Tool Calling**.\n\n" +
        "• **Inquire**: Ask for details on any order (e.g. `ORD-1001`, `ORD-1003`)\n" +
        "• **Track**: Live telemetry for courier parcels (e.g. `ORD-1002` via DHL)\n" +
        "• **Mutate Address**: Update shipping addresses for processing orders\n" +
        "• **Guardrails**: Try cancelling a dispatched shipment to see policy enforcement in action\n\n" +
        "How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle injected prompt from sandbox buttons
  useEffect(() => {
    if (injectedPrompt) {
      sendMessage(injectedPrompt);
      if (onClearInjectedPrompt) {
        onClearInjectedPrompt();
      }
    }
  }, [injectedPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: historyPayload.slice(0, -1),
        }),
      });

      const data = await res.json();

      let trackingData: TrackingInfo | null = null;
      let orderData: OrderData | null = null;

      if (Array.isArray(data.toolCalls)) {
        for (const tc of data.toolCalls) {
          if (tc.toolName === "getCourierStatus" && tc.result?.found) {
            trackingData = {
              courierName: tc.result.courierName as string,
              trackingNumber: tc.result.trackingNumber as string,
              currentStatus: tc.result.currentStatus as string,
              currentLocation: tc.result.currentLocation as string,
              estimatedDelivery: tc.result.estimatedDelivery as string,
              checkpoints: tc.result.checkpoints as any,
            };
          }

          if (tc.toolName === "getOrderDetails" && tc.result?.found) {
            orderData = tc.result.order as OrderData;
          }

          if (tc.toolName === "updateDeliveryAddress" && tc.result?.success) {
            if (tc.result.order) {
              orderData = {
                orderNumber: tc.result.orderNumber,
                status: tc.result.order.status,
                totalAmount: tc.result.order.totalAmount,
                shippingAddress: {
                  street: tc.result.order.shippingStreet,
                  city: tc.result.order.shippingCity,
                  state: tc.result.order.shippingState,
                  postalCode: tc.result.order.shippingPostalCode,
                  country: tc.result.order.shippingCountry,
                },
                items: tc.result.order.items || [],
              };
            }
            if (onOrderMutated) {
              onOrderMutated(tc.result.orderNumber);
            }
          }

          if (tc.toolName === "cancelOrder" && tc.result?.success) {
            if (onOrderMutated) {
              onOrderMutated(tc.result.orderNumber);
            }
          }
        }
      }

      const botMessageId = `model-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          role: "model",
          content: data.text || "Action completed.",
          toolCalls: data.toolCalls || [],
          trackingData,
          orderData,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const errMsg =
        err instanceof Error ? err.message : "Failed to process request";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: `⚠️ **Notice**: ${errMsg}. Please feel free to try your request again.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared-welcome",
        role: "model",
        content:
          "Conversation cleared. How can I help you manage your orders today?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar for Chat Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Support Specialist
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Agent
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Autonomous Tool Calling · Gemini Flash · Supabase PostgreSQL
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-white/[0.08]"
          title="Reset conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar z-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl animate-in fade-in duration-200",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5",
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-300 border border-white/[0.08]"
                  : "bg-sky-600 text-white shadow-sky-500/20"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3.5 text-sm leading-relaxed max-w-[88%] sm:max-w-[82%] relative shadow-lg",
                msg.role === "user"
                  ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-tr-sm"
                  : "bg-[#121215] border border-white/[0.08] text-zinc-200 rounded-tl-sm backdrop-blur"
              )}
            >
              {/* Tool Execution Badges */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="space-y-1 mb-2">
                  {msg.toolCalls.map((tc, idx) => (
                    <ToolActivityBadge key={idx} toolCall={tc} />
                  ))}
                </div>
              )}

              {/* Text Body with Clean Typography */}
              <div className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed">
                {msg.content}
              </div>

              {/* Embedded Courier Tracking Timeline Widget */}
              {msg.trackingData && (
                <TrackingTimeline tracking={msg.trackingData} />
              )}

              {/* Embedded Order Card Widget */}
              {msg.orderData && <OrderCard order={msg.orderData} />}

              {/* Timestamp */}
              <div
                className={cn(
                  "text-[10px] mt-2 font-mono",
                  msg.role === "user" ? "text-sky-200/70 text-right" : "text-zinc-400"
                )}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Live Thinking & Tool Invocation State */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 text-zinc-400 text-xs shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              </div>
              <span className="text-zinc-300 font-medium">
                Reasoning & invoking tools via Gemini API...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips Carousel */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-white/[0.06] bg-[#0c0c0e]/95 overflow-x-auto flex gap-2 no-scrollbar z-10">
        {QUICK_SUGGESTIONS.map((s, idx) => {
          const IconComponent = s.icon;
          return (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => sendMessage(s.prompt)}
              className={cn(
                "whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-[#18181b] text-zinc-300 hover:text-white border border-white/[0.08] transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shadow-sm",
                s.color
              )}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Bar */}
      <div className="p-3.5 sm:p-5 border-t border-white/[0.08] bg-[#0c0c0e]/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-[#121215] border border-white/[0.08] focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 rounded-2xl transition-all duration-200 shadow-xl">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about orders, track courier, change address, or test cancel guardrail..."
              className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all disabled:opacity-50 pr-24"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-0.5 text-[10px] text-zinc-400 font-mono bg-zinc-800/80 px-1.5 py-1 rounded border border-white/[0.06]">
                <span>Enter</span>
                <CornerDownLeft className="w-2.5 h-2.5" />
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 text-zinc-950 font-bold rounded-xl transition-all duration-200 disabled:text-zinc-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-sky-500/20"
                title="Send query"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
            <span>Enterprise E-Commerce Support Engine</span>
            <span className="font-mono text-[10px]">Gemini Flash • Supabase PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
