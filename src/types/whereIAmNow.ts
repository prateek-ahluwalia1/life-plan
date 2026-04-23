export type AssessmentColumn = "right" | "wrong" | "confused" | "missing";
export type DomainKey =
  | "personal"
  | "family"
  | "church"
  | "vocation"
  | "community";

export type DomainTableEntry = Record<AssessmentColumn, string>;
export type TableData = Record<DomainKey, DomainTableEntry>;

export type WhereIAmNowFlow = {
  domainIndex: number;
  questionIndex: number;
  isComplete: boolean;
  lastReflection: string;
  hasAnswered: boolean;
};

export type WhereIAmNowPayload = {
  tableData: TableData;
  followupTableData: TableData;
  analysis: string;
  flow: WhereIAmNowFlow;
  moduleProgress: number;
};
