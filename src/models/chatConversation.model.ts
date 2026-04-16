import mongoose, { Document, model, Schema } from "mongoose";

export interface IConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface IChatConversation extends Document {
  userId: string;
  conversationId: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Auto-delete conversations after 30 days
}

const messageSchema = new Schema<IConversationMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false },
);

const chatConversationSchema = new Schema<IChatConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
  },
  { timestamps: true },
);

export default model<IChatConversation>(
  "ChatConversation",
  chatConversationSchema,
  "ChatConversations",
);
