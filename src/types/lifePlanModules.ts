export type LifePlanProgress = {
  whereiam: boolean;
  perspective: boolean;
  surrender: boolean;
  mypurpose: boolean;
};

export type TurningPoint = {
  title: string;
  description: string;
  impact: string;
};

export type Module3Data = {
  turningPoints: TurningPoint[];
  keyDecisions: string;
  shapingRelationships: string;
  challengesOvercome: string;
  achievements: string;
  spiritualMoments: string;
  reflectionNotes: string;
  isComplete: boolean;
};

export type LifePlanModulesPayload = {
  progress: LifePlanProgress;
  module3?: Module3Data;
  surrenderItems: string[];
  missionStatement: string;
  visionStatement: string;
  actionPlan: string;
};
