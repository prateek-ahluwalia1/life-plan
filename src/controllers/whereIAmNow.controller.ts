import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import WhereIAmNow from "../models/whereIAmNow.model";
import LifePlanModules from "../models/lifePlanModules.model";
import { buildModulePdf } from "../services/pdf.service";
import {
  createConfirmationToken,
  verifyConfirmationToken,
} from "../services/confirmationService";
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

const domainDefinitions: Record<DomainKey, string> = {
  personal: "physical, emotional, spiritual, & intellectual",
  family: "parents, spouse, children, & extended family relationships",
  church: "ministry, calling, and contribution within the body of Christ",
  vocation: "career, work, and areas of responsibility",
  community: "giving back to society, neighborhood, town, or city",
};

const coreQuestions: Record<AssessmentColumn, string> = {
  right: "What's Right?",
  wrong: "What's Wrong?",
  confused: "What's Confused?",
  missing: "What's Missing?",
};

const exampleIntroductions: Record<AssessmentColumn, string> = {
  right: "Here are some examples of what may be **going well** in your life right now. See what resonates:",
  wrong: "Here are some examples of what may **not be going well** in your life right now. Notice what feels true for you:",
  confused:
    "Here are some examples of areas that may **feel unclear or unsettled** right now. See what stands out:",
  missing:
    "Here are some examples of what may be **missing or lacking** in your life right now. Notice what resonates:",
};

interface ExamplesLibrary {
  [key: string]: {
    [key: string]: string[];
  };
}

const EXAMPLES: ExamplesLibrary = {
  personal: {
    right: [
      "I've been taking care of my physical health and energy levels.",
      "I've been noticing and managing my emotions and am less reactive.",
      "I am intentional in putting energy into learning new things.",
      "I'm growing in self-awareness about how I think and respond.",
    ],
    wrong: [
      "I've been neglecting my physical health and it's starting to show.",
      "I feel disconnected from my spiritual practices lately.",
      "I've been overworking and not giving myself enough rest and play.",
      "I'm reacting more than responding in stressful situations.",
    ],
    confused: [
      "I'm not sure what direction I should take in my personal growth right now.",
      "I feel unclear about what I actually need in this season.",
      "I don't see how I can add anything else to my schedule for improvements in this domain.",
      "I feel torn between different priorities in my life.",
    ],
    missing: [
      "I'm missing consistent rhythms that support my physical and emotional health.",
      "I don't have enough margin in my life to rest and reflect.",
      "I'm lacking clarity about my identity and purpose in this season.",
      "I'm missing practices that help me stay grounded and centered.",
    ],
  },
  family: {
    right: [
      "I have a few relationships where I feel safe, known, and supported.",
      "I'm being more intentional about investing in the people who matter most.",
      "Communication in my close relationships has been open and honest.",
      "I feel connected and present when I'm with my family and friends.",
    ],
    wrong: [
      "I've been distant or distracted in some of my key relationships.",
      "I have not made space/time for opportunities to meet/connect with new possible (local) friends.",
      "There's tension in some of my relationships that I have been avoiding.",
      "I sometimes prioritize productivity over connection.",
    ],
    confused: [
      "I'm unsure which relationships I should be investing in more deeply.",
      "I don't always know how to navigate certain relational dynamics.",
      "I'm not making enough space for deeper connections and more play with my spouse.",
      "I'm unclear on what healthy boundaries should look like.",
    ],
    missing: [
      "I'm missing deeper, more meaningful conversations with people I care about.",
      "I have not updated my relationships with my adult children from a parenting-child to more of a peer relationship.",
      "I feel like I don't have enough margin to be present with others.",
      "I don't have friends (locally) that I feel safe to be vulnerable with.",
    ],
  },
  church: {
    right: [
      "I feel a sense of community and fulfillment in my involvement in a local church.",
      "I'm actively using my gifts in ways that serve others and honor God.",
      "I have a growing sense of calling and purpose.",
      "My friendships through my church extend beyond church activities to doing life together.",
    ],
    wrong: [
      "I have wounds from past church trauma.",
      "My spouse and I cannot agree on the need for a church home or which one to choose.",
      "My current life season doesn't provide much margin and further engagement just doesn't seem doable.",
      "I don't have clarity on how God wants me to handle church right now.",
    ],
    confused: [
      "I'm unsure of how to differentiate between my relationship with God and my thoughts and feelings about church.",
      "I'm unclear on what's from God and what's from others regarding involvement in church right now.",
      "I'm unclear how my gifts fit into a larger Kingdom purpose.",
      "I don't always know how to discern God's direction.",
    ],
    missing: [
      "I haven't been able to utilize my gifts at church.",
      "I'm missing a sense of belonging within a local body of believers.",
      "I'm lacking relationships that support my spiritual growth within a church setting.",
      "I don't connect with the already established opportunities at my church but don't understand how or if I can propose something new.",
    ],
  },
  vocation: {
    right: [
      "I feel aligned with the work I'm doing and the value I'm creating.",
      "I'm using my strengths in ways that energize me.",
      "I have clarity around my current responsibilities and priorities.",
      "I feel a sense of purpose and contribution in my job role.",
    ],
    wrong: [
      "I feel stuck or unfulfilled in my current work.",
      "My job role is so time-consuming, I don't feel I have time to explore other interests and passions.",
      "My work doesn't fully align with my strengths or passions.",
      "I feel unclear or overwhelmed by my responsibilities.",
    ],
    confused: [
      "I'm unsure what direction I should be moving in professionally.",
      "I feel torn between multiple opportunities or paths.",
      "I don't know how to align my work with my deeper purpose.",
      "I'm unclear what success should look like in this season.",
    ],
    missing: [
      "I don't have the time and mental space to consider other roles I might like to pursue.",
      "I don't feel a peace about how my other roles/responsibilities get shortchanged because of this commitment.",
      "I'm lacking opportunities to use my strengths more fully.",
      "I'm missing feedback or guidance to help me move forward.",
    ],
  },
  community: {
    right: [
      "I've begun building relationships in my local community (neighbors, groups, activities).",
      "I feel a sense of familiarity and comfort in my surroundings.",
      "I've found a few places or activities where I enjoy showing up regularly.",
      "I'm open and curious about meeting new people and exploring this community.",
    ],
    wrong: [
      "I haven't explored what local charities/nonprofits I might enjoy giving time to.",
      "I feel I need guidance from someone already engaged in community activities.",
      "I haven't prioritized investing time in community involvement.",
      "I can get overwhelmed with the what's and how's.",
    ],
    confused: [
      "I'm not sure where I would best fit or belong in this community.",
      "I feel unsure how to find opportunities that align with my interests and values.",
      "I don't know how to move from casual connections to deeper involvement.",
      "I feel unclear about how much time I want to invest in community activities.",
    ],
    missing: [
      "I don't yet have a clear pathway or plan for getting involved.",
      "I'm missing relationships that would naturally connect me into the community.",
      "I don't have enough information about local opportunities.",
      "I'm lacking a clear filter to help me decide where to invest.",
    ],
  },
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleDoc = await WhereIAmNow.findOne({ userId }).lean();

    if (!moduleDoc) {
      return res.status(200).json(getInitialPayload());
    }

    return res.status(200).json({
      tableData: moduleDoc.tableData,
      followupTableData: moduleDoc.followupTableData,
      analysis: moduleDoc.analysis || "",
      flow: moduleDoc.flow,
      moduleProgress: moduleDoc.moduleProgress || 0,
    });
  } catch (error) {
    console.error("Get Where I Am Now error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const upsertWhereIAmNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = sanitizePayload(req.body);

    const updated = await WhereIAmNow.findOneAndUpdate(
      { userId },
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

    // AUTO-UNLOCK DASHBOARD LOGIC
    if (payload.flow.isComplete || payload.moduleProgress >= 100) {
      await LifePlanModules.findOneAndUpdate(
        { userId },
        { $set: { "progress.whereiam": true } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(200).json({
      tableData: updated?.tableData || payload.tableData,
      followupTableData:
        updated?.followupTableData || payload.followupTableData,
      analysis: updated?.analysis || payload.analysis,
      flow: updated?.flow || payload.flow,
      moduleProgress: updated?.moduleProgress ?? payload.moduleProgress,
    });
  } catch (error) {
    console.error("Save Where I Am Now error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetWhereIAmNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const confirmationId = req.body?.confirmationId as string | undefined;

    if (!confirmationId) {
      const newConfirmationId = createConfirmationToken(userId, "reset_where_i_am_now");
      return res.status(200).json({
        status: "confirmation_required",
        confirmationId: newConfirmationId,
        message: "Please confirm module restart",
      });
    }

    const isValid = verifyConfirmationToken(confirmationId, userId, "reset_where_i_am_now");
    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired confirmation ID",
      });
    }

    await WhereIAmNow.findOneAndDelete({ userId });

    // AUTO-LOCK DASHBOARD LOGIC
    await LifePlanModules.findOneAndUpdate(
      { userId },
      { $set: { "progress.whereiam": false } }
    );

    return res.status(200).json({
      status: "reset_complete",
      message: "Where I Am Now progress reset",
    });
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleDoc = await WhereIAmNow.findOne({ userId }).lean();
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

const getExamples = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(EXAMPLES);
  } catch (error) {
    console.error("Get examples error:", error);
    return res.status(500).json({ error: "Failed to retrieve examples" });
  }
};

const getMetadata = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      domains: {
        keys: domainKeys,
        labels: domainLabels,
        definitions: domainDefinitions,
      },
      assessmentColumns: {
        keys: assessmentColumns,
        questions: coreQuestions,
        introductions: exampleIntroductions,
      },
    });
  } catch (error) {
    console.error("Get metadata error:", error);
    return res.status(500).json({ error: "Failed to retrieve metadata" });
  }
};

export default {
  getWhereIAmNow,
  upsertWhereIAmNow,
  resetWhereIAmNow,
  downloadWhereIAmNowPdf,
  getExamples,
  getMetadata,
};