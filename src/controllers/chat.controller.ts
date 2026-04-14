import { openai } from "../config/openai";
import type { Request, Response } from "express";

const initateThread = async (req: Request, res: Response) => {
  try {
    const conversation = await openai.conversations.create();
    return res.status(200).json({ conversationId: conversation.id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to initiate conversation" });
  }
};

const sendMessage = async (req: Request, res: Response) => {
  try {
    const { activeConversationId, message } = req.body || {};

    if (!activeConversationId || !message) {
      return res.status(400).json({
        error: "conversationId and message are required",
      });
    }

    const promptId = process.env.YOUR_LIFEPLAN_PROMPT_ID;

    if (!promptId) {
      return res.status(500).json({
        error:
          "Server configuration error: YOUR_LIFEPLAN_PROMPT_ID is required",
      });
    }

    const response = await openai.responses.create({
      conversation: activeConversationId,
      prompt: { id: promptId },
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: String(message) }],
        },
      ],
    });

    if (response.status === "completed") {
      return res.json({
        reply: response.output_text || "No response text returned.",
      });
    }

    return res.status(500).json({
      error: "Response generation failed or is incomplete.",
      status: response.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send message" });
  }
};

export default { initateThread, sendMessage };
