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

export default moduleGatingMiddleware;
