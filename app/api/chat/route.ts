import { NextRequest, NextResponse } from "next/server";
import { runGeminiChat } from "@/lib/gemini/executor";

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

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("API Chat Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to process chat message", details: message },
      { status: 500 }
    );
  }
}
