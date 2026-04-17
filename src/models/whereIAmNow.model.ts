import { Document, Schema, model, type Types } from "mongoose";
import type {
  AssessmentColumn,
  DomainKey,
  WhereIAmNowFlow,
} from "../types/whereIAmNow";

type DomainTableEntry = Record<AssessmentColumn, string>;
type TableData = Record<DomainKey, DomainTableEntry>;

export interface IWhereIAmNow extends Document {
  userId: Types.ObjectId;
  tableData: TableData;
  followupTableData: TableData;
  analysis: string;
  flow: WhereIAmNowFlow;
  moduleProgress: number;
}

const domainTableEntrySchema = new Schema<DomainTableEntry>(
  {
    right: { type: String, default: "" },
    wrong: { type: String, default: "" },
    confused: { type: String, default: "" },
    missing: { type: String, default: "" },
  },
  { _id: false },
);

const tableDataSchema = new Schema<TableData>(
  {
    personal: { type: domainTableEntrySchema, default: () => ({}) },
    family: { type: domainTableEntrySchema, default: () => ({}) },
    church: { type: domainTableEntrySchema, default: () => ({}) },
    vocation: { type: domainTableEntrySchema, default: () => ({}) },
    community: { type: domainTableEntrySchema, default: () => ({}) },
  },
  { _id: false },
);

const flowSchema = new Schema<WhereIAmNowFlow>(
  {
    domainIndex: { type: Number, default: 0 },
    questionIndex: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false },
    lastReflection: { type: String, default: "" },
    hasAnswered: { type: Boolean, default: false },
  },
  { _id: false },
);

const whereIAmNowSchema = new Schema<IWhereIAmNow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    tableData: {
      type: tableDataSchema,
      default: () => ({}),
    },
    followupTableData: {
      type: tableDataSchema,
      default: () => ({}),
    },
    analysis: {
      type: String,
      default: "",
    },
    flow: {
      type: flowSchema,
      default: () => ({}),
    },
    moduleProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

export default model<IWhereIAmNow>(
  "WhereIAmNow",
  whereIAmNowSchema,
  "WhereIAmNow",
);
