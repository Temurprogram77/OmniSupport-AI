"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  HelpCircle,
  CheckCircle,
  Truck,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ToolActivityBadge from "./ToolActivityBadge";
import TrackingTimeline, { TrackingInfo } from "./TrackingTimeline";
import OrderCard, { OrderData } from "./OrderCard";
import { ToolExecutionRecord } from "@/lib/gemini/executor";

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
    label: "📍 Track ORD-1002",
    prompt: "Track courier shipment for order ORD-1002",
  },
  {
    label: "🏠 Update Address (ORD-1001)",
    prompt:
      "Please change the delivery address for order ORD-1001 to 742 Evergreen Terrace, Springfield, OR 97477",
  },
  {
    label: "❌ Cancel Order (ORD-1001)",
    prompt: "Cancel order ORD-1001 because I ordered the wrong color",
  },
  {
    label: "🛑 Cancel In-Transit (ORD-1002)",
    prompt: "Can I cancel order ORD-1002?",
  },
  {
    label: "📦 Order Details (ORD-1003)",
    prompt: "What items are included in my order ORD-1003?",
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
        "Hello! I am **OmniSupport AI**, your autonomous logistics and order specialist.\n\n" +
        "I can help you look up orders, track live couriers with full checkpoint timelines, update shipping destinations before dispatch, or cancel orders.\n\n" +
        "How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle injected prompt from sandbox panel buttons
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
      // Build history payload for backend
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: historyPayload.slice(0, -1), // prior history
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Check if any courier tracking was found in tool calls
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
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: `⚠️ **Error Processing Request**: ${errMsg}. Please try again.`,
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
          "Conversation restarted. Ask me anything about your orders or shipments!",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                OmniSupport AI
              </h1>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Logistics & Order Support · Gemini 2.0 Flash Tool Calling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5",
                msg.role === "user"
                  ? "bg-slate-700 text-slate-200"
                  : "bg-indigo-600 text-white"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[88%] sm:max-w-[82%]",
                msg.role === "user"
                  ? "bg-indigo-600 text-white shadow-md rounded-tr-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 shadow-md rounded-tl-none"
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

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans text-[13.5px]">
                {msg.content}
              </div>

              {/* Courier Tracking Timeline Widget if applicable */}
              {msg.trackingData && (
                <TrackingTimeline tracking={msg.trackingData} />
              )}

              {/* Order Card Widget if applicable */}
              {msg.orderData && <OrderCard order={msg.orderData} />}

              {/* Timestamp */}
              <div
                className={cn(
                  "text-[10px] mt-1.5",
                  msg.role === "user" ? "text-indigo-200 text-right" : "text-slate-500"
                )}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing request & executing tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 sm:px-6 py-2 border-t border-slate-900 bg-slate-950/90 overflow-x-auto flex gap-2 no-scrollbar">
        {QUICK_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => sendMessage(s.prompt)}
            className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about orders, track courier, update delivery address, or cancel..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:hover:bg-indigo-600 cursor-pointer"
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[11px] text-slate-500">
            Powered by Google Gemini 2.0 Flash Tool Calling · Next.js 16 · Prisma ORM
          </span>
        </div>
      </div>
    </div>
  );
}
