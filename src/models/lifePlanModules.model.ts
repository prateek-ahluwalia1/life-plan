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
    whereiam: { type: Boolean, default: false },
    perspective: { type: Boolean, default: false },
    surrender: { type: Boolean, default: false },
    mypurpose: { type: Boolean, default: false },
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
