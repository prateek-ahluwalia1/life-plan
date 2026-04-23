import type { Request, Response } from "express";
import GettingStartedModules from "../models/gettingStartedModules.model";
import LifePlanModules from "../models/lifePlanModules.model";
import type {
  GettingStartedProgress,
  GettingStartedModulesPayload,
} from "../types/gettingStartedModules";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { buildModulePdf } from "../services/pdf.service";
import {
  createConfirmationToken,
  verifyConfirmationToken,
} from "../services/confirmationService";

const createEmptyProgress = (): GettingStartedProgress => ({
  overallGoalComplete: false,
  personalDomainComplete: false,
  familyDomainComplete: false,
  churchDomainComplete: false,
  vocationDomainComplete: false,
  communityDomainComplete: false,
});

const createInitialPayload = (): GettingStartedModulesPayload => ({
  progress: createEmptyProgress(),
  overallGoal: "",
  goalPersonal: "",
  goalFamilyFriends: "",
  goalChurchKingdom: "",
  goalVocation: "",
  goalCommunity: "",
});

const sanitizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sanitizeProgressPatch = (
  value: unknown,
): Partial<GettingStartedProgress> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const patch: Partial<GettingStartedProgress> = {};

  if (typeof raw.overallGoalComplete === "boolean")
    patch.overallGoalComplete = raw.overallGoalComplete;
  if (typeof raw.personalDomainComplete === "boolean")
    patch.personalDomainComplete = raw.personalDomainComplete;
  if (typeof raw.familyDomainComplete === "boolean")
    patch.familyDomainComplete = raw.familyDomainComplete;
  if (typeof raw.churchDomainComplete === "boolean")
    patch.churchDomainComplete = raw.churchDomainComplete;
  if (typeof raw.vocationDomainComplete === "boolean")
    patch.vocationDomainComplete = raw.vocationDomainComplete;
  if (typeof raw.communityDomainComplete === "boolean")
    patch.communityDomainComplete = raw.communityDomainComplete;

  return patch;
};

const normalizePayload = (
  doc?: Partial<GettingStartedModulesPayload> | null,
): GettingStartedModulesPayload => ({
  progress: {
    ...createEmptyProgress(),
    ...(doc?.progress || {}),
  },
  overallGoal: sanitizeText(doc?.overallGoal),
  goalPersonal: sanitizeText(doc?.goalPersonal),
  goalFamilyFriends: sanitizeText(doc?.goalFamilyFriends),
  goalChurchKingdom: sanitizeText(doc?.goalChurchKingdom),
  goalVocation: sanitizeText(doc?.goalVocation),
  goalCommunity: sanitizeText(doc?.goalCommunity),
});

const buildDocumentSections = (payload: GettingStartedModulesPayload) => {
  const sections = [];

  if (payload.overallGoal) {
    sections.push({
      heading: "Overall LifePlan Goal",
      paragraphs: [payload.overallGoal],
    });
  }
  if (payload.goalPersonal) {
    sections.push({
      heading: "Personal Domain Goal",
      paragraphs: [payload.goalPersonal],
    });
  }
  if (payload.goalFamilyFriends) {
    sections.push({
      heading: "Family & Friends Domain Goal",
      paragraphs: [payload.goalFamilyFriends],
    });
  }
  if (payload.goalChurchKingdom) {
    sections.push({
      heading: "Church & Kingdom Domain Goal",
      paragraphs: [payload.goalChurchKingdom],
    });
  }
  if (payload.goalVocation) {
    sections.push({
      heading: "Vocation Domain Goal",
      paragraphs: [payload.goalVocation],
    });
  }
  if (payload.goalCommunity) {
    sections.push({
      heading: "Community Domain Goal",
      paragraphs: [payload.goalCommunity],
    });
  }

  return sections;
};

const getGettingStartedModules = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let doc = await GettingStartedModules.findOne({ userId });

    if (!doc) {
      const initialPayload = createInitialPayload();
      doc = new GettingStartedModules({ userId, ...initialPayload });
      await doc.save();
    }

    const normalized = normalizePayload(doc.toObject());
    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Get Getting Started Modules error:", error);
    return res.status(500).json({ error: "Failed to retrieve module data" });
  }
};

const upsertGettingStartedModules = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { progress, overallGoal, goalPersonal, goalFamilyFriends, goalChurchKingdom, goalVocation, goalCommunity } =
      req.body || {};

    let doc = await GettingStartedModules.findOne({ userId });

    if (!doc) {
      doc = new GettingStartedModules({ userId });
    }

    if (progress && typeof progress === "object") {
      const progressPatch = sanitizeProgressPatch(progress);
      if (Object.keys(progressPatch).length > 0) {
        doc.progress = { ...doc.progress, ...progressPatch };
      }
    }

    if (overallGoal !== undefined) doc.overallGoal = sanitizeText(overallGoal);
    if (goalPersonal !== undefined) doc.goalPersonal = sanitizeText(goalPersonal);
    if (goalFamilyFriends !== undefined) doc.goalFamilyFriends = sanitizeText(goalFamilyFriends);
    if (goalChurchKingdom !== undefined) doc.goalChurchKingdom = sanitizeText(goalChurchKingdom);
    if (goalVocation !== undefined) doc.goalVocation = sanitizeText(goalVocation);
    if (goalCommunity !== undefined) doc.goalCommunity = sanitizeText(goalCommunity);

    await doc.save();

    // AUTO-UNLOCK DASHBOARD LOGIC
    const mergedProgress = doc.progress as GettingStartedProgress;
    const isWhyIAmHereDone =
      mergedProgress.overallGoalComplete &&
      mergedProgress.personalDomainComplete &&
      mergedProgress.familyDomainComplete &&
      mergedProgress.churchDomainComplete &&
      mergedProgress.vocationDomainComplete &&
      mergedProgress.communityDomainComplete;

    if (isWhyIAmHereDone) {
      await LifePlanModules.findOneAndUpdate(
        { userId },
        { $set: { "progress.whyiamhere": true } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    const normalized = normalizePayload(doc.toObject());
    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Upsert Getting Started Modules error:", error);
    return res.status(500).json({ error: "Failed to update module data" });
  }
};

const resetGettingStartedModules = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const confirmationId = req.body?.confirmationId as string | undefined;

    if (!confirmationId) {
      const newConfirmationId = createConfirmationToken(userId, "reset_getting_started");
      return res.status(200).json({
        status: "confirmation_required",
        confirmationId: newConfirmationId,
        message: "Please confirm module restart",
      });
    }

    const isValid = verifyConfirmationToken(confirmationId, userId, "reset_getting_started");
    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired confirmation ID",
      });
    }

    await GettingStartedModules.findOneAndDelete({ userId });

    const initialPayload = createInitialPayload();
    const newDoc = new GettingStartedModules({ userId, ...initialPayload });
    await newDoc.save();

    // AUTO-LOCK DASHBOARD LOGIC
    await LifePlanModules.findOneAndUpdate(
      { userId },
      { $set: { "progress.whyiamhere": false } }
    );

    return res.status(200).json({
      status: "reset_complete",
      message: "Getting Started module reset",
      data: initialPayload,
    });
  } catch (error) {
    console.error("Reset Getting Started Modules error:", error);
    return res.status(500).json({ error: "Failed to reset module" });
  }
};

const downloadGettingStartedModulesPdf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const doc = await GettingStartedModules.findOne({ userId });

    if (!doc) {
      return res.status(404).json({ error: "Module data not found" });
    }

    const payload = normalizePayload(doc.toObject());
    const sections = buildDocumentSections(payload);

    if (sections.length === 0) {
      return res
        .status(400)
        .json({ error: "No goals have been recorded yet" });
    }

    const pdfBuffer = await buildModulePdf(
      "LifePlan Getting Started - My Goals",
      sections,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="getting-started-goals.pdf"',
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Download Getting Started PDF error:", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};

export default {
  getGettingStartedModules,
  upsertGettingStartedModules,
  resetGettingStartedModules,
  downloadGettingStartedModulesPdf,
};