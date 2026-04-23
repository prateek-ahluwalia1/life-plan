import { Document, Schema, model, type Types } from "mongoose";
import type {
  LifePlanModulesPayload,
  LifePlanProgress,
} from "../types/lifePlanModules";

export interface ILifePlanModules extends Document, LifePlanModulesPayload {
  userId: Types.ObjectId;
}

const progressSchema = new Schema<LifePlanProgress>(
  {
    whyiamhere: { type: Boolean, default: false },
    whereiam: { type: Boolean, default: false },
    perspective: { type: Boolean, default: false },
    surrender: { type: Boolean, default: false },
    mypurpose: { type: Boolean, default: false },
  },
  { _id: false },
);

const turningPointSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    impact: { type: String, default: "" },
  },
  { _id: false },
);

const module3Schema = new Schema(
  {
    turningPoints: {
      type: [turningPointSchema],
      default: [
        { title: "", description: "", impact: "" },
        { title: "", description: "", impact: "" },
        { title: "", description: "", impact: "" },
      ],
    },
    keyDecisions: { type: String, default: "" },
    shapingRelationships: { type: String, default: "" },
    challengesOvercome: { type: String, default: "" },
    achievements: { type: String, default: "" },
    spiritualMoments: { type: String, default: "" },
    reflectionNotes: { type: String, default: "" },
    isComplete: { type: Boolean, default: false },
  },
  { _id: false },
);

const lifePlanModulesSchema = new Schema<ILifePlanModules>(
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
    module3: {
      type: module3Schema,
      default: () => ({}),
    },
    surrenderItems: {
      type: [String],
      default: [],
    },
    missionStatement: {
      type: String,
      default: "",
    },
    visionStatement: {
      type: String,
      default: "",
    },
    actionPlan: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default model<ILifePlanModules>(
  "LifePlanModules",
  lifePlanModulesSchema,
  "LifePlanModules",
);