import { openai } from "../config/openai";
import type { Request, Response } from "express";
import crypto from "crypto";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// In-memory store for conversation histories (replace with database for production)
// Key: conversationId, Value: array of messages
const conversationHistories: Map<string, ConversationMessage[]> = new Map();

const initateThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Generate a unique conversation ID
    const conversationId = crypto.randomUUID();

    // Initialize empty conversation history
    conversationHistories.set(conversationId, []);

    return res.status(200).json({ conversationId });
  } catch (error) {
    console.error("Initiate thread error:", error);
    return res.status(500).json({ error: "Failed to initiate conversation" });
  }
};

const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { activeConversationId, message, systemPrompt } = req.body || {};

    if (!activeConversationId || !message) {
      return res.status(400).json({
        error: "conversationId and message are required",
      });
    }

    // Validate conversation exists
    if (!conversationHistories.has(activeConversationId)) {
      return res.status(404).json({
        error: "Conversation not found. Please initiate a new conversation.",
      });
    }

    const history = conversationHistories.get(activeConversationId) || [];

    // Build messages array for API call
    const messages: ConversationMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: "user",
        content: systemPrompt,
      });
    }

    // Add conversation history
    messages.push(...history);

    // Add current user message
    const userMessage: ConversationMessage = {
      role: "user",
      content: String(message),
    };
    messages.push(userMessage);

    // Call ChatGPT API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!response.choices || response.choices.length === 0) {
      return res.status(500).json({
        error: "No response generated from AI model.",
      });
    }

    const assistantMessage =
      response.choices[0].message.content || "No response text returned.";

    // Store messages in conversation history
    history.push(userMessage);
    history.push({
      role: "assistant",
      content: assistantMessage,
    });
    conversationHistories.set(activeConversationId, history);

    return res.json({
      reply: assistantMessage,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      error: "Failed to send message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default { initateThread, sendMessage };
