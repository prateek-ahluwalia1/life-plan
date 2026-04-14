import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import WhereIAmNow from "../models/whereIAmNow.model";
import { buildModulePdf } from "../services/pdf.service";
import type {
  AssessmentColumn,
  DomainKey,
  DomainTableEntry,
  TableData,
  WhereIAmNowFlow,
  WhereIAmNowPayload,
} from "../types/whereIAmNow";

const domainKeys: DomainKey[] = [
  "personal",
  "family",
  "church",
  "vocation",
  "community",
];
const assessmentColumns: AssessmentColumn[] = [
  "right",
  "wrong",
  "confused",
  "missing",
];
const assessmentLabels: Record<AssessmentColumn, string> = {
  right: "What is right",
  wrong: "What is wrong",
  confused: "What is confused",
  missing: "What is missing",
};
const domainLabels: Record<DomainKey, string> = {
  personal: "Personal",
  family: "Family & Friends",
  church: "Church & Kingdom",
  vocation: "Vocation",
  community: "Community",
};

const createEmptyDomainEntry = (): DomainTableEntry => ({
  right: "",
  wrong: "",
  confused: "",
  missing: "",
});

const createEmptyTableData = (): TableData => ({
  personal: createEmptyDomainEntry(),
  family: createEmptyDomainEntry(),
  church: createEmptyDomainEntry(),
  vocation: createEmptyDomainEntry(),
  community: createEmptyDomainEntry(),
});

const createEmptyFlow = (): WhereIAmNowFlow => ({
  domainIndex: 0,
  questionIndex: 0,
  isComplete: false,
  lastReflection: "",
  hasAnswered: false,
});

const sanitizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sanitizeTableData = (value: unknown): TableData => {
  const fallback = createEmptyTableData();
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const raw = value as Record<string, unknown>;
  for (const domain of domainKeys) {
    const domainObj = raw[domain];
    if (!domainObj || typeof domainObj !== "object") {
      continue;
    }

    const typedDomainObj = domainObj as Record<string, unknown>;
    for (const column of assessmentColumns) {
      fallback[domain][column] = sanitizeText(typedDomainObj[column]);
    }
  }

  return fallback;
};

const sanitizeFlow = (value: unknown): WhereIAmNowFlow => {
  const flow = createEmptyFlow();
  if (!value || typeof value !== "object") {
    return flow;
  }

  const raw = value as Record<string, unknown>;
  if (typeof raw.domainIndex === "number") {
    flow.domainIndex = Math.max(0, Math.min(4, Math.floor(raw.domainIndex)));
  }
  if (typeof raw.questionIndex === "number") {
    flow.questionIndex = Math.max(
      0,
      Math.min(3, Math.floor(raw.questionIndex)),
    );
  }
  if (typeof raw.isComplete === "boolean") {
    flow.isComplete = raw.isComplete;
  }
  flow.lastReflection = sanitizeText(raw.lastReflection);
  if (typeof raw.hasAnswered === "boolean") {
    flow.hasAnswered = raw.hasAnswered;
  }

  return flow;
};

const sanitizePayload = (body: unknown): WhereIAmNowPayload => {
  const rawBody =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const moduleProgressRaw = rawBody.moduleProgress;
  const moduleProgress =
    typeof moduleProgressRaw === "number"
      ? Math.max(0, Math.min(100, Math.round(moduleProgressRaw)))
      : 0;

  return {
    tableData: sanitizeTableData(rawBody.tableData),
    followupTableData: sanitizeTableData(rawBody.followupTableData),
    analysis: sanitizeText(rawBody.analysis),
    flow: sanitizeFlow(rawBody.flow),
    moduleProgress,
  };
};

const getInitialPayload = (): WhereIAmNowPayload => ({
  tableData: createEmptyTableData(),
  followupTableData: createEmptyTableData(),
  analysis: "",
  flow: createEmptyFlow(),
  moduleProgress: 0,
});

const getPdfSections = (payload: WhereIAmNowPayload) => {
  const sections: Array<{ heading: string; paragraphs: string[] }> = [];

  for (const domain of domainKeys) {
    const primary = payload.tableData[domain];
    const followup = payload.followupTableData[domain];
    const paragraphs: string[] = [];

    for (const column of assessmentColumns) {
      const base = primary[column].trim();
      const next = followup[column].trim();

      if (base) {
        paragraphs.push(`${assessmentLabels[column]}: ${base}`);
      }
      if (next) {
        paragraphs.push(`${assessmentLabels[column]} follow-up: ${next}`);
      }
    }

    if (paragraphs.length > 0) {
      sections.push({ heading: domainLabels[domain], paragraphs });
    }
  }

  if (payload.analysis.trim()) {
    sections.push({
      heading: "Final Reflection",
      paragraphs: [payload.analysis],
    });
  }

  if (sections.length === 0) {
    sections.push({
      heading: "Current State Assessment",
      paragraphs: ["No assessment responses have been saved yet."],
    });
  }

  return sections;
};

const getWhereIAmNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleDoc = await WhereIAmNow.findOne({ userId: req.user.id }).lean();

    if (!moduleDoc) {
      return res.status(200).json({ data: getInitialPayload() });
    }

    return res.status(200).json({
      data: {
        tableData: moduleDoc.tableData,
        followupTableData: moduleDoc.followupTableData,
        analysis: moduleDoc.analysis || "",
        flow: moduleDoc.flow,
        moduleProgress: moduleDoc.moduleProgress || 0,
      },
    });
  } catch (error) {
    console.error("Get Where I Am Now error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const upsertWhereIAmNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = sanitizePayload(req.body);

    const updated = await WhereIAmNow.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          tableData: payload.tableData,
          followupTableData: payload.followupTableData,
          analysis: payload.analysis,
          flow: payload.flow,
          moduleProgress: payload.moduleProgress,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      message: "Where I Am Now progress saved",
      data: {
        tableData: updated?.tableData || payload.tableData,
        followupTableData:
          updated?.followupTableData || payload.followupTableData,
        analysis: updated?.analysis || payload.analysis,
        flow: updated?.flow || payload.flow,
        moduleProgress: updated?.moduleProgress ?? payload.moduleProgress,
      },
    });
  } catch (error) {
    console.error("Save Where I Am Now error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetWhereIAmNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await WhereIAmNow.findOneAndDelete({ userId: req.user.id });
    return res.status(200).json({ message: "Where I Am Now progress reset" });
  } catch (error) {
    console.error("Reset Where I Am Now error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const downloadWhereIAmNowPdf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleDoc = await WhereIAmNow.findOne({ userId: req.user.id }).lean();
    const payload = moduleDoc
      ? sanitizePayload(moduleDoc)
      : getInitialPayload();

    const pdf = await buildModulePdf(
      "Where I Am Now - Current State Assessment",
      getPdfSections(payload),
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="where-i-am-now.pdf"',
    );
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(pdf);
  } catch (error) {
    console.error("Download Where I Am Now PDF error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default {
  getWhereIAmNow,
  upsertWhereIAmNow,
  resetWhereIAmNow,
  downloadWhereIAmNowPdf,
};
