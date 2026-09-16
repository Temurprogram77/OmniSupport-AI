import { GoogleGenAI } from "@google/genai";
import {
  geminiTools,
  SYSTEM_INSTRUCTION,
  executeTool,
  executeGetOrderDetails,
  executeGetCourierStatus,
  executeUpdateDeliveryAddress,
  executeCancelOrder,
  executeEscalateToHumanAgent,
} from "./tools";

export {
  executeTool,
  executeGetOrderDetails,
  executeGetCourierStatus,
  executeUpdateDeliveryAddress,
  executeCancelOrder,
  executeEscalateToHumanAgent,
};

export interface ToolExecutionRecord {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface ChatResponsePayload {
  role: "model";
  text: string;
  toolCalls: ToolExecutionRecord[];
  updatedOrder?: unknown;
  error?: string;
}

// Strict runtime check for required environment variables
export function validateEnvironmentVariables() {
  const missing: string[] = [];
  if (!process.env.GEMINI_API_KEY?.trim()) {
    missing.push("GEMINI_API_KEY");
  }
  if (!process.env.DATABASE_URL?.trim()) {
    missing.push("DATABASE_URL");
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration Error: Missing required environment variable(s): ${missing.join(
        ", "
      )}. Please configure them in .env.`
    );
  }
}

// Helper to delay for retries
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Live Gemini Tool Calling Multi-Turn Loop with complete defensive error boundaries
export async function runGeminiChat(
  history: Array<{ role: "user" | "model"; content: string }>,
  userMessage: string
): Promise<ChatResponsePayload> {
  validateEnvironmentVariables();

  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const ai = new GoogleGenAI({ apiKey });

  const toolCalls: ToolExecutionRecord[] = [];
  let updatedOrder: unknown = undefined;

  // Build contents history
  const contents: Array<any> = history.map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Append current user message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  // Multi-turn tool calling loop (max 5 turns)
  let currentIteration = 0;
  while (currentIteration < 5) {
    currentIteration++;

    let response: any = null;
    let attempts = 0;
    const maxAttempts = 2;

    // Retry loop for transient rate-limiting (429) or temporary server hiccups (503)
    while (attempts < maxAttempts) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: geminiTools,
          },
        });
        break; // Succeeded
      } catch (genErr: unknown) {
        const errMsg = genErr instanceof Error ? genErr.message : String(genErr);
        console.warn(
          `Gemini API generation attempt ${attempts} failed (${errMsg}).`
        );

        if (
          attempts < maxAttempts &&
          (errMsg.includes("429") ||
            errMsg.includes("503") ||
            errMsg.includes("quota") ||
            errMsg.includes("RESOURCE_EXHAUSTED"))
        ) {
          await wait(1500 * attempts);
        } else {
          // If all attempts fail, return a graceful response without crashing the route
          return {
            role: "model",
            text:
              "The AI service is currently experiencing high load. Please try your request again in a few seconds.",
            toolCalls,
            updatedOrder,
            error: "Rate limit or service overload",
          };
        }
      }
    }

    const candidate = response?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Find function calls
    const functionCallParts = parts.filter(
      (part: any) => part.functionCall !== undefined && part.functionCall !== null
    );

    if (functionCallParts.length === 0) {
      // No further function calls: extract final natural text response
      const textParts: string[] = [];
      for (const part of parts) {
        if (typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
      const finalContent =
        textParts.join("\n").trim() || "I have completed processing your request.";

      return {
        role: "model",
        text: finalContent,
        toolCalls,
        updatedOrder,
      };
    }

    // Add model's function call turn to contents
    contents.push({
      role: "model",
      parts,
    });

    // Execute each function call defensively
    const functionResponseParts: Array<any> = [];

    for (const fcp of functionCallParts) {
      const fc = fcp.functionCall!;
      const toolName = fc.name || "";
      const toolArgs = (fc.args as Record<string, unknown>) || {};

      let toolResult: Record<string, unknown>;

      // Complete try/catch wrapper around tool execution
      try {
        toolResult = await executeTool(toolName, toolArgs);
      } catch (toolExecErr: unknown) {
        console.error(`Unexpected exception running tool "${toolName}":`, toolExecErr);
        const errDetails =
          toolExecErr instanceof Error ? toolExecErr.message : "Internal tool failure";
        toolResult = {
          success: false,
          status: "FAILED",
          error: `Error executing ${toolName}: ${errDetails}`,
        };
      }

      if (toolResult && toolResult.order) {
        updatedOrder = toolResult.order;
      }

      toolCalls.push({
        toolName,
        args: toolArgs,
        result: toolResult,
        timestamp: new Date().toISOString(),
      });

      // Feed error or success response back into Gemini's conversation turn
      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          id: fc.id,
          response: toolResult,
        },
      });
    }

    // Pass tool responses back to Gemini for the next turn
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  return {
    role: "model",
    text: "I have completed all operations on your order.",
    toolCalls,
    updatedOrder,
  };
}
