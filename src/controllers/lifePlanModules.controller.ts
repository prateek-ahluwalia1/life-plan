import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import LifePlanModules from "../models/lifePlanModules.model";
import { buildModulePdf } from "../services/pdf.service";
import {
  createConfirmationToken,
  verifyConfirmationToken,
} from "../services/confirmationService";
import type {
  LifePlanModulesPayload,
  LifePlanProgress,
} from "../types/lifePlanModules";

type LifePlanDocumentKey = "surrender" | "mission" | "vision" | "action";

const supportedDocumentKeys: LifePlanDocumentKey[] = [
  "surrender",
  "mission",
  "vision",
  "action",
];

const createEmptyProgress = (): LifePlanProgress => ({
  whyiamhere: false,
  whereiam: false,
  perspective: false,
  surrender: false,
  mypurpose: false,
});

const createInitialPayload = (): LifePlanModulesPayload => ({
  progress: createEmptyProgress(),
  surrenderItems: [],
  missionStatement: "",
  visionStatement: "",
  actionPlan: "",
});

const sanitizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sanitizeItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const result = value
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);

  return Array.from(new Set(result));
};

const sanitizeProgressPatch = (value: unknown): Partial<LifePlanProgress> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const patch: Partial<LifePlanProgress> = {};

  if (typeof raw.whyiamhere === "boolean") {
    patch.whyiamhere = raw.whyiamhere;
  }
  if (typeof raw.whereiam === "boolean") {
    patch.whereiam = raw.whereiam;
  }
  if (typeof raw.perspective === "boolean") {
    patch.perspective = raw.perspective;
  }
  if (typeof raw.surrender === "boolean") {
    patch.surrender = raw.surrender;
  }
  if (typeof raw.mypurpose === "boolean") {
    patch.mypurpose = raw.mypurpose;
  }

  return patch;
};

const normalizePayload = (
  doc?: Partial<LifePlanModulesPayload> | null,
): LifePlanModulesPayload => ({
  progress: {
    ...createEmptyProgress(),
    ...(doc?.progress || {}),
  },
  surrenderItems: sanitizeItems(doc?.surrenderItems),
  missionStatement: sanitizeText(doc?.missionStatement),
  visionStatement: sanitizeText(doc?.visionStatement),
  actionPlan: sanitizeText(doc?.actionPlan),
});

const buildDocumentSections = (
  key: LifePlanDocumentKey,
  payload: LifePlanModulesPayload,
) => {
  if (key === "surrender") {
    return {
      title: "Surrender - Release List",
      fileName: "surrender-release-list.pdf",
      sections: [
        {
          heading: "Items To Surrender",
          paragraphs:
            payload.surrenderItems.length > 0
              ? payload.surrenderItems.map(
                (item, index) => `${index + 1}. ${item}`,
              )
              : ["No surrender items have been saved yet."],
        },
      ],
    };
  }

  if (key === "mission") {
    return {
      title: "My Purpose - Mission Statement",
      fileName: "mission-statement.pdf",
      sections: [
        {
          heading: "Mission Statement",
          paragraphs: [
            payload.missionStatement ||
            "No mission statement has been saved yet.",
          ],
        },
      ],
    };
  }

  if (key === "vision") {
    return {
      title: "My Future - Vision Statement",
      fileName: "vision-statement.pdf",
      sections: [
        {
          heading: "Vision Statement",
          paragraphs: [
            payload.visionStatement ||
            "No vision statement has been saved yet.",
          ],
        },
      ],
    };
  }

  return {
    title: "Next Steps - Purpose Aligned Action Plan",
    fileName: "action-plan.pdf",
    sections: [
      {
        heading: "Purpose Aligned Action Plan",
        paragraphs: [
          payload.actionPlan || "No action plan has been saved yet.",
        ],
      },
    ],
  };
};

const getLifePlanModules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleDoc = await LifePlanModules.findOne({
      userId: req.user.id,
    }).lean();

    if (!moduleDoc) {
      return res.status(200).json({ data: createInitialPayload() });
    }

    return res.status(200).json({
      data: normalizePayload(moduleDoc),
    });
  } catch (error) {
    console.error("Get LifePlan modules error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const upsertLifePlanModules = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existing = normalizePayload(
      await LifePlanModules.findOne({ userId: req.user.id }).lean(),
    );

    const rawBody =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};

    const progressPatch = sanitizeProgressPatch(rawBody.progress);
    const hasSurrenderItemsField = Object.prototype.hasOwnProperty.call(
      rawBody,
      "surrenderItems",
    );
    const hasMissionField = Object.prototype.hasOwnProperty.call(
      rawBody,
      "missionStatement",
    );
    const hasVisionField = Object.prototype.hasOwnProperty.call(
      rawBody,
      "visionStatement",
    );
    const hasActionPlanField = Object.prototype.hasOwnProperty.call(
      rawBody,
      "actionPlan",
    );

    const nextPayload: LifePlanModulesPayload = {
      progress: {
        ...existing.progress,
        ...progressPatch,
      },
      surrenderItems: hasSurrenderItemsField
        ? sanitizeItems(rawBody.surrenderItems)
        : existing.surrenderItems,
      missionStatement: hasMissionField
        ? sanitizeText(rawBody.missionStatement)
        : existing.missionStatement,
      visionStatement: hasVisionField
        ? sanitizeText(rawBody.visionStatement)
        : existing.visionStatement,
      actionPlan: hasActionPlanField
        ? sanitizeText(rawBody.actionPlan)
        : existing.actionPlan,
    };

    const updated = await LifePlanModules.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          progress: nextPayload.progress,
          surrenderItems: nextPayload.surrenderItems,
          missionStatement: nextPayload.missionStatement,
          visionStatement: nextPayload.visionStatement,
          actionPlan: nextPayload.actionPlan,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      message: "LifePlan module state saved",
      data: normalizePayload(updated),
    });
  } catch (error) {
    console.error("Save LifePlan modules error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetLifePlanModules = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const confirmationId = req.body?.confirmationId as string | undefined;

    if (!confirmationId) {
      const newConfirmationId = createConfirmationToken(userId, "reset_lifeplan");
      return res.status(200).json({
        status: "confirmation_required",
        confirmationId: newConfirmationId,
        message: "Please confirm module restart",
      });
    }

    const isValid = verifyConfirmationToken(confirmationId, userId, "reset_lifeplan");
    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired confirmation ID",
      });
    }

    await LifePlanModules.findOneAndDelete({ userId });
    return res.status(200).json({
      status: "reset_complete",
      message: "LifePlan modules reset",
    });
  } catch (error) {
    console.error("Reset LifePlan modules error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const downloadLifePlanModulesPdf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const key = String(req.params.document || "").toLowerCase();
    if (!supportedDocumentKeys.includes(key as LifePlanDocumentKey)) {
      return res.status(400).json({
        message:
          "Invalid document key. Use one of: surrender, mission, vision, action",
      });
    }

    const moduleDoc = await LifePlanModules.findOne({
      userId: req.user.id,
    }).lean();
    const payload = normalizePayload(moduleDoc);
    const document = buildDocumentSections(key as LifePlanDocumentKey, payload);
    const pdf = await buildModulePdf(document.title, document.sections);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.fileName}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(pdf);
  } catch (error) {
    console.error("Download LifePlan modules PDF error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default {
  getLifePlanModules,
  upsertLifePlanModules,
  resetLifePlanModules,
  downloadLifePlanModulesPdf,
};