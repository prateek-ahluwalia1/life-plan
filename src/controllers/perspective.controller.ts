import { Request, Response } from "express";
import LifePlanModules from "../models/lifePlanModules.model";

// GET /api/v1/modules/perspective/module-3
export const getModule3Data = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const record = await LifePlanModules.findOne({ userId });

    if (!record || !record.module3) {
      return res.status(200).json({
        data: {
          turningPoints: [
            { title: "", description: "", impact: "" },
            { title: "", description: "", impact: "" },
            { title: "", description: "", impact: "" },
          ],
          keyDecisions: "",
          shapingRelationships: "",
          challengesOvercome: "",
          achievements: "",
          spiritualMoments: "",
          reflectionNotes: "",
          isComplete: false,
        },
      });
    }

    return res.status(200).json({ data: record.module3 });
  } catch (error) {
    console.error("Error getting module 3 data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/v1/modules/perspective/module-3
export const saveModule3Data = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { turningPoints, keyDecisions, shapingRelationships, challengesOvercome, achievements, spiritualMoments, reflectionNotes, isComplete } = req.body;

    const record = await LifePlanModules.findOneAndUpdate(
      { userId },
      {
        $set: {
          module3: {
            turningPoints,
            keyDecisions,
            shapingRelationships,
            challengesOvercome,
            achievements,
            spiritualMoments,
            reflectionNotes,
            isComplete,
          },
        },
      },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      message: "Module 3 data saved",
      data: record.module3,
    });
  } catch (error) {
    console.error("Error saving module 3 data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/v1/modules/perspective/module-3
export const deleteModule3Data = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await LifePlanModules.findOneAndUpdate(
      { userId },
      {
        $unset: { module3: "" },
      },
      { new: true },
    );

    return res.status(200).json({ message: "Module 3 data deleted" });
  } catch (error) {
    console.error("Error deleting module 3 data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
