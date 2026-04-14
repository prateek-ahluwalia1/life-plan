export type LifePlanProgress = {
  whereiam: boolean;
  perspective: boolean;
  surrender: boolean;
  mypurpose: boolean;
};

export type LifePlanModulesPayload = {
  progress: LifePlanProgress;
  surrenderItems: string[];
  missionStatement: string;
  visionStatement: string;
  actionPlan: string;
};
