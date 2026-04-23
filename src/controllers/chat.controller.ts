import { openai } from "../config/openai";
import type { Response } from "express";
import crypto from "crypto";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ChatConversation from "../models/chatConversation.model";

const initateThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversationId = crypto.randomUUID();

    // Create new conversation in database
    await ChatConversation.create({
      userId,
      conversationId,
      messages: [],
    });

    return res.status(200).json({ conversationId });
  } catch (error) {
    console.error("Initiate thread error:", error);
    return res.status(500).json({ error: "Failed to initiate conversation" });
  }
};

const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { activeConversationId, message, systemPrompt } = req.body || {};

    if (!activeConversationId || !message) {
      return res.status(400).json({
        error: "conversationId and message are required",
      });
    }

    // Fetch conversation from database
    const conversation = await ChatConversation.findOne({
      conversationId: activeConversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found. Please initiate a new conversation.",
      });
    }

    // Build messages array for API call
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: "user",
        content: systemPrompt,
      });
    }

    // Add conversation history
    messages.push(
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    );

    // Add current user message
    const userMessage = {
      role: "user" as const,
      content: String(message),
    };
    messages.push(userMessage);

    // Call ChatGPT API
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages,
      temperature: 0.7,
    });

    if (!response.choices || response.choices.length === 0) {
      return res.status(500).json({
        error: "No response generated from AI model.",
      });
    }

    const choice = response.choices[0];
    const assistantMessage =
      choice?.message?.content || "No response text returned";

    // Save messages to database
    conversation.messages.push(userMessage);
    conversation.messages.push({
      role: "assistant",
      content: assistantMessage,
    });
    await conversation.save();

    return res.json({
      reply: assistantMessage,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      error: "Failed to send message",
    });
  }
};

export default { initateThread, sendMessage };
