import { NextRequest, NextResponse } from "next/server";
import { runGeminiChat } from "@/lib/agent/executor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, message } = body;

    const userMessage = (message || "").trim();
    if (!userMessage) {
      return NextResponse.json(
        { error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    // Format history if provided
    const history = Array.isArray(messages)
      ? messages.map((m: { role: string; content: string }) => ({
          role: (m.role === "model" || m.role === "assistant" ? "model" : "user") as
            | "user"
            | "model",
          content: m.content || "",
        }))
      : [];

    const result = await runGeminiChat(history, userMessage);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("API Chat Route Caught Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";

    const isRateLimit =
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED");
    const isServiceUnavailable =
      msg.includes("503") ||
      msg.includes("UNAVAILABLE") ||
      msg.includes("overloaded");

    const userMessage =
      isRateLimit || isServiceUnavailable
        ? "The AI service is currently experiencing high load. Please try your request again in a few seconds."
        : `I encountered a momentary issue processing your request: ${msg}. Please try again.`;

    // Return HTTP 200 with graceful assistant message so UI never fatal crashes
    return NextResponse.json(
      {
        role: "model",
        text: `⚠️ ${userMessage}`,
        toolCalls: [],
        error: userMessage,
      },
      { status: 200 }
    );
  }
}
