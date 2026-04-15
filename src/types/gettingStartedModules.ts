export type GettingStartedProgress = {
  overallGoalComplete: boolean;
  personalDomainComplete: boolean;
  familyDomainComplete: boolean;
  churchDomainComplete: boolean;
  vocationDomainComplete: boolean;
  communityDomainComplete: boolean;
};

export type GettingStartedModulesPayload = {
  progress: GettingStartedProgress;
  overallGoal: string;
  goalPersonal: string;
  goalFamilyFriends: string;
  goalChurchKingdom: string;
  goalVocation: string;
  goalCommunity: string;
};
