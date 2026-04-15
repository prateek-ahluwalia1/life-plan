import type { Request, Response, NextFunction } from "express";
import GettingStartedModules from "../models/gettingStartedModules.model";
import WhereIAmNow from "../models/whereIAmNow.model";
import LifePlanModules from "../models/lifePlanModules.model";
import type { AuthenticatedRequest } from "./auth.middleware";

// Define module prerequisites
const MODULE_PREREQUISITES: Record<string, string[]> = {
  whereiam: ["getting-started"],
  perspective: ["whereiam"],
  surrender: ["perspective"],
  mypurpose: ["surrender"],
  chat: ["getting-started", "whereiam"],
};

const MODULE_MODELS: Record<
  string,
  typeof GettingStartedModules | typeof WhereIAmNow | typeof LifePlanModules
> = {
  "getting-started": GettingStartedModules,
  whereiam: WhereIAmNow,
  "life-plan": LifePlanModules,
};

/**
 * Module access gating middleware
 * Checks if user has completed prerequisite modules before allowing access
 * Usage: app.use("/api/v1/modules/:module", gatingMiddleware, controllerFunction)
 */
export const moduleGatingMiddleware =
  (requiredModule: string) =>
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const prerequisites = MODULE_PREREQUISITES[requiredModule] || [];

      if (prerequisites.length === 0) {
        // No prerequisites, allow access
        next();
        return;
      }

      // Check each prerequisite module
      const progressChecks = await Promise.all(
        prerequisites.map(async (prereqModule) => {
          const Model = MODULE_MODELS[prereqModule];
          if (!Model) {
            console.warn(`Unknown module for gating: ${prereqModule}`);
            return false;
          }

          const doc = await (Model as any).findOne({ userId }).lean();
          if (!doc) return false;

          // Check if module is complete based on its structure
          if (prereqModule === "getting-started") {
            const gettingStarted = doc as any;
            return (
              gettingStarted.progress?.overallGoalComplete &&
              gettingStarted.progress?.personalDomainComplete &&
              gettingStarted.progress?.familyDomainComplete &&
              gettingStarted.progress?.churchDomainComplete &&
              gettingStarted.progress?.vocationDomainComplete &&
              gettingStarted.progress?.communityDomainComplete
            );
          } else if (prereqModule === "whereiam") {
            const whereIAmNow = doc as any;
            return whereIAmNow.flow?.isComplete === true;
          } else if (prereqModule === "life-plan") {
            const lifePlan = doc as any;
            return lifePlan.progress?.whereiam === true;
          }

          return false;
        }),
      );

      // Check if all prerequisites are met
      const allPrerequisitesMet = progressChecks.every((isComplete) => isComplete);

      if (!allPrerequisitesMet) {
        res.status(403).json({
          error: "Access Denied",
          message: `Required modules must be completed first: ${prerequisites.join(", ")}`,
          requiredModules: prerequisites,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Module gating middleware error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

/**
 * Controller to check module access status without enforcing restrictions
 */
export const checkModuleAccess = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const moduleName = req.params.module as string;
    const prerequisites = MODULE_PREREQUISITES[moduleName] || [];

    const completedPrerequisites: string[] = [];
    let allMet = true;

    // Check each prerequisite module
    for (const prereqModule of prerequisites) {
      const Model = MODULE_MODELS[prereqModule];
      if (!Model && prereqModule !== "perspective" && prereqModule !== "surrender") {
        console.warn(`Unknown module for gating check: ${prereqModule}`);
        allMet = false;
        continue;
      }

      let isComplete = false;

      if (prereqModule === "perspective") {
        // Check LifePlanModules for perspective progress
        const lifePlanDoc = await LifePlanModules.findOne({ userId }).lean();
        isComplete = lifePlanDoc?.progress?.perspective === true;
      } else if (prereqModule === "surrender") {
        // Check LifePlanModules for surrender progress
        const lifePlanDoc = await LifePlanModules.findOne({ userId }).lean();
        isComplete = lifePlanDoc?.progress?.surrender === true;
      } else {
        const doc = await (Model as any).findOne({ userId }).lean();

        if (!doc) {
          isComplete = false;
        } else if (prereqModule === "getting-started") {
          const gettingStarted = doc as any;
          isComplete =
            gettingStarted.progress?.overallGoalComplete &&
            gettingStarted.progress?.personalDomainComplete &&
            gettingStarted.progress?.familyDomainComplete &&
            gettingStarted.progress?.churchDomainComplete &&
            gettingStarted.progress?.vocationDomainComplete &&
            gettingStarted.progress?.communityDomainComplete;
        } else if (prereqModule === "whereiam") {
          const whereIAmNow = doc as any;
          isComplete = whereIAmNow.flow?.isComplete === true;
        } else if (prereqModule === "life-plan") {
          const lifePlan = doc as any;
          isComplete = lifePlan.progress?.whereiam === true;
        }
      }

      if (isComplete) {
        completedPrerequisites.push(prereqModule);
      } else {
        allMet = false;
      }
    }

    res.status(200).json({
      module: moduleName,
      isAccessible: allMet,
      completedPrerequisites,
      requiredPrerequisites: prerequisites,
    });
  } catch (error) {
    console.error("Module access check error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default moduleGatingMiddleware;
