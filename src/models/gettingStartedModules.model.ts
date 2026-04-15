import { Document, Schema, model, type Types } from "mongoose";
import type {
  GettingStartedModulesPayload,
  GettingStartedProgress,
} from "../types/gettingStartedModules";

export interface IGettingStartedModules
  extends Document,
    GettingStartedModulesPayload {
  userId: Types.ObjectId;
}

const progressSchema = new Schema<GettingStartedProgress>(
  {
    overallGoalComplete: { type: Boolean, default: false },
    personalDomainComplete: { type: Boolean, default: false },
    familyDomainComplete: { type: Boolean, default: false },
    churchDomainComplete: { type: Boolean, default: false },
    vocationDomainComplete: { type: Boolean, default: false },
    communityDomainComplete: { type: Boolean, default: false },
  },
  { _id: false },
);

const gettingStartedModulesSchema = new Schema<IGettingStartedModules>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    progress: {
      type: progressSchema,
      default: () => ({}),
    },
    overallGoal: {
      type: String,
      default: "",
    },
    goalPersonal: {
      type: String,
      default: "",
    },
    goalFamilyFriends: {
      type: String,
      default: "",
    },
    goalChurchKingdom: {
      type: String,
      default: "",
    },
    goalVocation: {
      type: String,
      default: "",
    },
    goalCommunity: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default model<IGettingStartedModules>(
  "GettingStartedModules",
  gettingStartedModulesSchema,
  "GettingStartedModules",
);
