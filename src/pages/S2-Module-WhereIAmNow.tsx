import { useEffect, useMemo, useRef, useState, memo } from "react";
import styles from "../css/WhereAmI.module.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL, downloadModulePdfFromServer } from "../utils/exports";
import useModuleAccess from "../hooks/useModuleAccess";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";
import { useWhereIAmNowQuestions, useWhereIAmNowFollowUp } from "../hooks/useAIQuestions";
import SynthesisConfirmationModal from "../components/SynthesisConfirmationModal";
import { synthesizeResponse, isValidResponse } from "../utils/synthesisUtils";

type AssessmentColumn = "right" | "wrong" | "confused" | "missing";
type DomainKey = "personal" | "family" | "church" | "vocation" | "community";

type DomainEntry = {
  title: string;
  examples: Record<AssessmentColumn, string[]>;
  instructions: { purpose: string; whatToDo: string };
};

type DomainTableEntry = Record<AssessmentColumn, string>;
type TableData = Record<DomainKey, DomainTableEntry>;

type WhereIAmNowFlow = {
  domainIndex: number;
  questionIndex: number;
  isComplete: boolean;
  lastReflection: string;
  hasAnswered: boolean;
};

type WhereIAmNowPayload = {
  tableData: TableData;
  followupTableData: TableData;
  analysis: string;
  flow: WhereIAmNowFlow;
  moduleProgress: number;
};

type QuestionStep = {
  column: AssessmentColumn;
  label: string;
  prompt: string;
  placeholder: string;
};

const domains: Array<{ key: DomainKey; config: DomainEntry }> = [
  {
    key: "personal",
    config: {
      title: "Personal",
      examples: {
        right: ["I've been taking better care of my physical health.", "I feel emotionally steady and less reactive.", "My time with God is consistent."],
        wrong: ["My sleep is completely disrupted lately.", "I'm carrying a lot of unmanaged stress.", "I feel spiritually dry and distant."],
        confused: ["I'm not sure what my actual priorities should be.", "I feel conflicted about how to spend my free time.", "I'm unsure why my energy suddenly drops."],
        missing: ["I need a more structured morning routine.", "I lack a true space for deep rest.", "I'm missing a sense of emotional safety."]
      },
      instructions: {
        purpose: "This domain explores your inner world — your health, emotions, sense of purpose, and spiritual life. These are the most intimate signals of where you truly are right now.",
        whatToDo: "Reflect honestly on how you are doing personally. Write 1–3 sentences for each question. There are no right or wrong answers — only what is true for you today.",
      },
    },
  },
  {
    key: "family",
    config: {
      title: "Family & Friends",
      examples: {
        right: ["We are communicating more intentionally this month.", "I feel fully supported by my close friends.", "Family dinners are helping us reconnect."],
        wrong: ["There is underlying tension with my spouse.", "I've been too busy and neglected my friends.", "We are easily irritated with each other."],
        confused: ["I don't know how to resolve a recurring argument.", "I'm unsure how to best support my child right now.", "Boundaries feel unclear in a specific friendship."],
        missing: ["We lack quality, undistracted time together.", "I need deeper vulnerability in my friendships.", "We are missing a shared sense of fun and playfulness."]
      },
      instructions: {
        purpose: "Your closest relationships shape everything. This domain explores how your key connections — spouse, children, close friends — are showing up in your life right now.",
        whatToDo: "Think about the people closest to you. Write 1–3 sentences for each question. Be honest — this assessment is private and meant to help you grow.",
      },
    },
  },
  {
    key: "church",
    config: {
      title: "Church & Kingdom",
      examples: {
        right: ["Serving has brought me fresh energy.", "I feel deeply connected to my small group.", "My personal prayer life is growing."],
        wrong: ["I feel disconnected during weekend services.", "I am wrestling with heavy doubt and frustration.", "I feel burned out from over-serving."],
        confused: ["I'm unsure where I fit in my church community.", "I feel conflicted about some theological questions.", "I don't know what my spiritual gifts are."],
        missing: ["I lack a spiritual mentor or guide.", "I need more authentic, vulnerable community.", "I'm missing a sense of awe and worship."]
      },
      instructions: {
        purpose: "Your faith community and spiritual engagement are central to your LifePlan. This domain looks at how your relationship with God and His people is thriving or struggling.",
        whatToDo: "Reflect on your involvement in your church and your personal walk with God. Write 1–3 sentences for each question.",
      },
    },
  },
  {
    key: "vocation",
    config: {
      title: "Vocation",
      examples: {
        right: ["I am doing work that aligns with my values.", "I have clarity on my key priorities.", "I feel respected by my team."],
        wrong: ["I am constantly exhausted and overworked.", "I feel completely undervalued in my role.", "My daily tasks drain me completely."],
        confused: ["I don't know if I should stay or look for a new job.", "I'm unsure what my next career step should be.", "I get mixed feedback on my performance."],
        missing: ["I lack a clear path for professional growth.", "I need more meaning and purpose in my tasks.", "I'm missing healthy work-life boundaries."]
      },
      instructions: {
        purpose: "Your calling, career, and daily work form a major part of your identity and contribution. This domain examines alignment between what you do and who God has called you to be.",
        whatToDo: "Consider your work, your sense of calling, and whether your daily efforts feel purposeful. Write 1–3 sentences for each question.",
      },
    },
  },
  {
    key: "community",
    config: {
      title: "Community",
      examples: {
        right: ["I feel connected to my neighbors.", "My volunteer work is deeply fulfilling.", "I am showing up consistently for causes I care about."],
        wrong: ["I am completely isolated from my local neighborhood.", "I feel cynical about the state of the world.", "I overcommitted and can't sustain my involvement."],
        confused: ["I want to help but don't know where to start.", "I'm conflicted about which causes deserve my limited time.", "I'm unsure how to engage safely."],
        missing: ["I lack deep roots in my local area.", "I need a tangible way to give back.", "I'm missing relationships outside my usual bubble."]
      },
      instructions: {
        purpose: "Beyond your immediate circle, how are you showing up in the world around you? This domain reflects your broader impact, social presence, and contribution to others.",
        whatToDo: "Think about your neighbors, networks, and the people you influence beyond your family. Write 1–3 sentences for each question.",
      },
    },
  },
];

const questionFlow: QuestionStep[] = [
  {
    column: "right",
    label: "What is right",
    prompt: "What has been going well for you in this area?",
    placeholder: "Share Your Thoughts ... What is working well ? What are you grateful for in this area ? ",
  },
  {
    column: "wrong",
    label: "What is wrong",
    prompt: "What feels off, difficult, or draining in this area right now?",
    placeholder: "Write 1-3 sentences about what is not going well...",
  },
  {
    column: "confused",
    label: "What is confused",
    prompt: "Where do you feel unclear, conflicted, or uncertain?",
    placeholder: "Write 1-3 sentences about confusion or mixed signals...",
  },
  {
    column: "missing",
    label: "What is missing",
    prompt: "What do you sense is absent that would make this area healthier?",
    placeholder: "Write 1-3 sentences about what is missing...",
  },
];

const createEmptyTableData = (): TableData => ({
  personal: { right: "", wrong: "", confused: "", missing: "" },
  family: { right: "", wrong: "", confused: "", missing: "" },
  church: { right: "", wrong: "", confused: "", missing: "" },
  vocation: { right: "", wrong: "", confused: "", missing: "" },
  community: { right: "", wrong: "", confused: "", missing: "" },
});

const ProgressTable = ({
  styles,
  tableData,
  followupTableData,
  lastUpdatedCell,
  handleEditQuestion,
  domains,
  questionFlow
}: {
  styles: any;
  tableData: TableData;
  followupTableData: TableData;
  lastUpdatedCell: { domain: DomainKey; column: AssessmentColumn } | null;
  handleEditQuestion: (domain: DomainKey, column: AssessmentColumn) => void;
  domains: Array<{ key: DomainKey; config: DomainEntry }>;
  questionFlow: QuestionStep[];
}) => {
  return (
    <div className={styles["live-table"]}>
      <table className={styles["live-table-table"]}>
        <thead>
          <tr>
            <th>Domain</th>
            <th>What&apos;s Right?</th>
            <th>What&apos;s Wrong?</th>
            <th>What&apos;s Confused?</th>
            <th>What&apos;s Missing?</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => {
            const values = tableData[domain.key];
            return (
              <tr key={domain.key}>
                <td>
                  <strong>{domain.config.title}</strong>
                </td>
                {questionFlow.map((question) => {
                  const isHighlighted =
                    lastUpdatedCell?.domain === domain.key &&
                    lastUpdatedCell.column === question.column;
                  const mainAnswer = values[question.column];
                  const followupAnswer =
                    followupTableData[domain.key][question.column];
                  const hasAnyAnswer = Boolean(
                    mainAnswer || followupAnswer,
                  );
                  return (
                    <td
                      key={`${domain.key}-${question.column}`}
                      className={
                        isHighlighted ? styles["cell-updated"] : ""
                      }
                    >
                      <div className={styles["table-cell-content"]}>
                        <div
                          className={styles["table-answer-preview"]}
                          title={mainAnswer || "No answer yet"}
                        >
                          {mainAnswer || "—"}
                        </div>

                        {followupAnswer && (
                          <span
                            className={styles["table-followup-pill"]}
                            title={`Follow-up: ${followupAnswer}`}
                          >
                            {followupAnswer}
                          </span>
                        )}

                        {hasAnyAnswer && (
                          <button
                            type="button"
                            onClick={() =>
                              handleEditQuestion(
                                domain.key,
                                question.column,
                              )
                            }
                            className={styles["table-edit-btn"]}
                            title="Edit this response"
                            aria-label="Edit this response"
                          >
                            <svg
                              className={styles["table-edit-icon"]}
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M12 20h9"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const MemoizedProgressTable = memo(ProgressTable);

const WhereIAmNow = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useDispatch();
  const userdata = useSelector((state: RootState) => state.auth.userdata);
  const token = useSelector((state: RootState) => state.auth.token);

  // Module access gating
  const { isLocked } = useModuleAccess("where-i-am-now");

  // AI Questions & Follow-Up hooks
  const { questionsByDomain: aiQuestionsByDomain, loading: aiLoading, error: aiError } = useWhereIAmNowQuestions(token);

  // Destructure the internally managed states directly from the hook. No separate useState required!
  const { followUp: dynamicFollowUp, loading: isGeneratingFollowUp, generateFollowUp } = useWhereIAmNowFollowUp(token);

  // Module restart state
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const profileInitials = (() => {
    const source = (userdata?.name || userdata?.email || "U").trim();
    if (!source) return "U";
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  const [tableData, setTableData] = useState<TableData>(createEmptyTableData());
  const [followupTableData, setFollowupTableData] = useState<TableData>(
    createEmptyTableData()
  );

  const [domainIndex, setDomainIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [lastReflection, setLastReflection] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const [isStepSubmitted, setIsStepSubmitted] = useState(false);
  const [followupValue, setFollowupValue] = useState("");
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [lastUpdatedCell, setLastUpdatedCell] = useState<{
    domain: DomainKey;
    column: AssessmentColumn;
  } | null>(null);

  const [hasAnswered, setHasAnswered] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteSyncReady, setIsRemoteSyncReady] = useState(false);

  // Synthesis confirmation modal state
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [synthesisData, setSynthesisData] = useState<{
    domain: DomainKey;
    column: AssessmentColumn;
    mainResponse: string;
    synthesized: string;
  } | null>(null);

  const persistTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef(false);

  const [analysis, setAnalysis] = useState("");

  const getNextUnansweredStep = (data: TableData) => {
    for (let d = 0; d < domains.length; d += 1) {
      for (let q = 0; q < questionFlow.length; q += 1) {
        const domainKey = domains[d].key;
        const columnKey = questionFlow[q].column;
        if (!data[domainKey][columnKey].trim()) {
          return { domainIndex: d, questionIndex: q, isComplete: false };
        }
      }
    }
    return {
      domainIndex: domains.length - 1,
      questionIndex: questionFlow.length - 1,
      isComplete: true,
    };
  };

  const getFallbackFollowUp = (column: string) => {
    switch (column) {
      case "right": return "What feels most impactful or encouraging about these areas that are going well right now?";
      case "wrong": return "What feels most draining about this, and what is one small step that might ease it?";
      case "confused": return "If you had to guess the root of this confusion, what might it be?";
      case "missing": return "Why do you think this is missing, and what would it look like to begin adding it?";
      default: return "What else comes to mind when you reflect on this?";
    }
  };

  const currentDomain = domains[domainIndex];
  const baseQuestion = questionFlow[questionIndex];
  const totalQuestions = domains.length * questionFlow.length;

  // Safely extract AI data for the current domain matching the exact column
  const domainAiData = aiQuestionsByDomain?.[currentDomain.key];
  let aiQuestionObj: any = null;

  if (Array.isArray(domainAiData) && domainAiData.length > 0) {
    aiQuestionObj = domainAiData.find((q: any) => q.core === baseQuestion.column || q.id?.includes(baseQuestion.column));
  }

  const isUsingAIQuestions = !!aiQuestionObj && !aiLoading;

  const activePrompt = isUsingAIQuestions ? (aiQuestionObj.prompt || baseQuestion.prompt) : baseQuestion.prompt;
  const activeExamples = isUsingAIQuestions && aiQuestionObj?.examples?.length > 0
    ? aiQuestionObj.examples
    : currentDomain.config.examples[baseQuestion.column];

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const domainData of Object.values(tableData)) {
      for (const value of Object.values(domainData)) {
        if (value.trim().length > 0) count++;
      }
    }
    return count;
  }, [tableData]);

  const moduleProgress = useMemo(
    () => Math.round((answeredCount / totalQuestions) * 100),
    [answeredCount, totalQuestions]
  );

  const applyRestoredData = (restored: {
    tableData: TableData;
    followupTableData: TableData;
    analysis: string;
    flow: Partial<WhereIAmNowFlow>;
  }) => {
    setTableData(restored.tableData);
    setFollowupTableData(restored.followupTableData);
    setAnalysis(restored.analysis);
    setLastReflection(restored.flow.lastReflection || "");

    const hasSavedAnswers = Object.values(restored.tableData).some(
      (domainData) =>
        Object.values(domainData).some((value) => value.trim().length > 0),
    );

    setHasAnswered(restored.flow.hasAnswered ?? hasSavedAnswers);

    const resume = getNextUnansweredStep(restored.tableData);
    const safeDomainIndex =
      typeof restored.flow.domainIndex === "number"
        ? Math.max(0, Math.min(domains.length - 1, restored.flow.domainIndex))
        : resume.domainIndex;
    const safeQuestionIndex =
      typeof restored.flow.questionIndex === "number"
        ? Math.max(
          0,
          Math.min(questionFlow.length - 1, restored.flow.questionIndex),
        )
        : resume.questionIndex;

    setDomainIndex(safeDomainIndex);
    setQuestionIndex(safeQuestionIndex);
    setIsComplete(restored.flow.isComplete ?? resume.isComplete);
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      setIsRemoteSyncReady(true);
      return;
    }

    let isCancelled = false;
    setIsRemoteSyncReady(false);

    const loadRemoteData = async () => {
      try {
        const response = await fetch(`${apiURL}modules/where-i-am-now`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) return;

        const json = (await response.json()) as WhereIAmNowPayload;
        if (isCancelled || !json) return;

        applyRestoredData({
          tableData: json.tableData || createEmptyTableData(),
          followupTableData: json.followupTableData || createEmptyTableData(),
          analysis: json.analysis || "",
          flow: json.flow || {},
        });
      } catch {
        // Keep local fallback when backend is unavailable
      } finally {
        if (!isCancelled) setIsRemoteSyncReady(true);
      }
    };

    void loadRemoteData();

    return () => { isCancelled = true; };
  }, [token, isHydrated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isComplete && !isStepSubmitted && !isEditingExisting) {
      const timer = window.setTimeout(() => { mainInputRef.current?.focus(); }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [domainIndex, questionIndex, isComplete, isStepSubmitted, isEditingExisting]);

  useEffect(() => {
    if (!isHydrated || !isRemoteSyncReady || !token) return;

    const flow = { domainIndex, questionIndex, isComplete, lastReflection, hasAnswered };

    if (persistTimeoutRef.current) window.clearTimeout(persistTimeoutRef.current);

    persistTimeoutRef.current = window.setTimeout(async () => {
      if (pendingSaveRef.current) return;

      pendingSaveRef.current = true;
      try {
        await fetch(`${apiURL}modules/where-i-am-now`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ tableData, followupTableData, analysis, flow, moduleProgress }),
        });
      } catch (err) {
        console.error("Network error during auto-save:", err);
      } finally {
        pendingSaveRef.current = false;
      }
    }, 500);
  }, [tableData, followupTableData, analysis, domainIndex, questionIndex, isComplete, lastReflection, hasAnswered, isHydrated, isRemoteSyncReady, token, moduleProgress]);

  useEffect(() => {
    return () => { if (persistTimeoutRef.current) window.clearTimeout(persistTimeoutRef.current); };
  }, []);

  const isTableComplete = answeredCount === totalQuestions;

  const getReflectionText = (response: string, domainTitle: string, questionLabel: string) => {
    const condensed = response.trim().replace(/\s+/g, " ");
    const preview = condensed.length > 110 ? `${condensed.slice(0, 110)}...` : condensed;
    return `Thank you. For ${domainTitle}, you identified ${questionLabel}: "${preview}"`;
  };

  const moveToNextStep = () => {
    if (questionIndex < questionFlow.length - 1) {
      setQuestionIndex((prev: number) => prev + 1);
      return;
    }
    if (domainIndex < domains.length - 1) {
      setDomainIndex((prev: number) => prev + 1);
      setQuestionIndex(0);
      return;
    }
    setIsComplete(true);
  };

  const handleShowSynthesis = (domain: DomainKey, column: AssessmentColumn, mainResponse: string) => {
    if (!isValidResponse(mainResponse)) {
      setTableData((prev) => ({ ...prev, [domain]: { ...prev[domain], [column]: mainResponse } }));
      return;
    }

    const synthesized = synthesizeResponse(mainResponse, []);
    setSynthesisData({ domain, column, mainResponse, synthesized });
    setShowSynthesisModal(true);
  };

  const handleSynthesisConfirm = async () => {
    if (!synthesisData) return;
    const { domain, column, mainResponse } = synthesisData;

    setTableData((prev) => ({ ...prev, [domain]: { ...prev[domain], [column]: mainResponse } }));
    setLastUpdatedCell({ domain, column });
    setLastReflection(getReflectionText(mainResponse, domains.find(d => d.key === domain)?.config.title || domain, `${column} assessment`));
    setInputValue("");
    setHasAnswered(true);
    setIsStepSubmitted(true);

    setTimeout(() => {
      document.getElementById("affirmationBlock")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    setShowSynthesisModal(false);
    setSynthesisData(null);

    // FETCH AI FOLLOW-UP (Passing exactly ONE object)
    if (generateFollowUp && !isEditingExisting) {
      // NOTE: If your TypeScript still throws an error on `userResponse` or `assessmentType`, 
      // change them to `response: mainResponse` and `column: column` depending on your interface!
      generateFollowUp({
        domain: domain,
        userResponse: mainResponse,
        assessmentType: column
      }).catch(err => console.error("Failed to generate follow up:", err));
    }
  };

  const handleSynthesisEdit = () => {
    setShowSynthesisModal(false);
    setSynthesisData(null);
  };

  const handleSubmitAnswer = () => {
    const cleaned = inputValue.trim();
    if (!cleaned || isComplete) return;
    const activeDomain = domains[domainIndex];
    const activeQuestion = questionFlow[questionIndex];
    handleShowSynthesis(activeDomain.key, activeQuestion.column, cleaned);
  };

  const generatePDF = () => {
    if (!token) return;
    void downloadModulePdfFromServer(token, "modules/where-i-am-now/pdf", "where-i-am-now.pdf");
  };

  const handleUnlockPerspective = async () => {
    if (!token) {
      navigate("/perspective");
      return;
    }
    try {
      await fetch(`${apiURL}modules/life-plan-modules`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ progress: { whereiam: true } }),
      });
      navigate("/perspective");
    } catch (error) {
      console.error("Error saving progress:", error);
      navigate("/perspective");
    }
  };

  const handleFollowupSubmit = () => {
    const cleanedFollowup = followupValue.trim();
    if (!cleanedFollowup && !isEditingExisting) return;

    const activeDomain = domains[domainIndex];
    const activeQuestion = questionFlow[questionIndex];

    setFollowupTableData((prev) => ({
      ...prev,
      [activeDomain.key]: { ...prev[activeDomain.key], [activeQuestion.column]: cleanedFollowup },
    }));

    if (isEditingExisting) {
      setIsEditingExisting(false);
      setIsStepSubmitted(false);
      setFollowupValue("");
      setInputValue("");
      return;
    }

    setIsStepSubmitted(false);
    setFollowupValue("");
    setInputValue("");
    moveToNextStep();

    setTimeout(() => {
      document.querySelector(`.${styles["question-card"]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      mainInputRef.current?.focus();
    }, 80);
  };

  const handleEditQuestion = (domain: DomainKey, column: AssessmentColumn) => {
    const nextDomainIndex = domains.findIndex((item) => item.key === domain);
    const nextQuestionIndex = questionFlow.findIndex((item) => item.column === column);

    if (nextDomainIndex < 0 || nextQuestionIndex < 0) return;

    setDomainIndex(nextDomainIndex);
    setQuestionIndex(nextQuestionIndex);
    setIsComplete(false);
    setIsEditingExisting(true);
    setIsStepSubmitted(false);
    setInputValue(tableData[domain][column] || "");
    setFollowupValue(followupTableData[domain][column] || "");
    setLastUpdatedCell({ domain, column });

    setTimeout(() => {
      document.querySelector(`.${styles["question-card"]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const handleResetTable = () => {
    const confirmed = window.confirm("This will clear all answers and follow-up notes for this module. Continue?");
    if (!confirmed) return;

    if (token) {
      fetch(`${apiURL}modules/where-i-am-now`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
      }).catch((err) => console.error("Failed to delete module data:", err));
    }

    setTableData(createEmptyTableData());
    setFollowupTableData(createEmptyTableData());
    setDomainIndex(0);
    setQuestionIndex(0);
    setInputValue("");
    setFollowupValue("");
    setLastReflection("");
    setAnalysis("");
    setIsComplete(false);
    setIsStepSubmitted(false);
    setIsEditingExisting(false);
    setHasAnswered(false);
    setLastUpdatedCell(null);
  };

  const handleRestart = async () => {
    if (!token) return;
    try {
      const result = await requestModuleRestart(token, "modules/where-i-am-now");
      if (result?.confirmationId) {
        setRestartConfirmId(result.confirmationId);
        setShowRestartConfirm(true);
      }
    } catch (err) {
      console.error("Failed to initiate restart:", err);
    }
  };

  const handleConfirmRestart = async () => {
    if (!token || !restartConfirmId) return;
    try {
      const result = await confirmModuleRestart(token, "modules/where-i-am-now", restartConfirmId);
      if (result?.status === "reset_complete") {
        setTableData(createEmptyTableData());
        setFollowupTableData(createEmptyTableData());
        setAnalysis("");
        setDomainIndex(0);
        setQuestionIndex(0);
        setInputValue("");
        setLastReflection("");
        setIsComplete(false);
        setIsStepSubmitted(false);
        setFollowupValue("");
        setIsEditingExisting(false);
        setLastUpdatedCell(null);
        setHasAnswered(false);
        setShowRestartConfirm(false);
        setRestartConfirmId(null);
      }
    } catch (err) {
      console.error("Failed to confirm restart:", err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  if (isLocked) {
    return <ModuleGatingBlock moduleName="Where I Am Now" requiredModules={["getting-started"]} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.bg}></div>

      <nav className={styles.nav}>
        <div className={styles["nav-brand"]}>
          <Link
            to="/"
            aria-label="Back to homepage"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", color: "white", textDecoration: "none", marginRight: "10px" }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className={styles["nav-wordmark"]}>YourLifePlanJourney<em>.com</em></div>
        </div>
        <div className={styles["nav-center"]}>
          <div className={styles["nav-center-dot"]}></div>Faith-Based Life Journey
        </div>
        <div className={styles["nav-right"]} ref={profileMenuRef} style={{ position: "relative" }}>
          <button type="button" className={styles["nav-avatar"]} onClick={() => setIsProfileMenuOpen((prev) => !prev)} aria-haspopup="menu" aria-expanded={isProfileMenuOpen} style={{ border: "none" }}>
            {profileInitials}
          </button>
          {isProfileMenuOpen && (
            <div role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: "120px", background: "#1f2937", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "6px", zIndex: 20 }}>
              <button type="button" onClick={handleLogout} style={{ width: "100%", border: "none", background: "transparent", color: "white", textAlign: "left", padding: "8px 10px", borderRadius: "8px", cursor: "pointer" }}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles["stage-bar"]}>
        <span className={styles["sb-label"]}>Stage 1 — Where I Am Now</span>
        <div className={styles["sb-track"]}>
          <div className={styles["sb-fill"]} style={{ width: `${moduleProgress}%` }}></div>
        </div>
        <span className={styles["sb-count"]}>{moduleProgress}% complete</span>
      </div>

      <aside className={styles.sidebar}>
        <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
          <button className={`${styles["sb-btn"]} ${styles.active}`}>
            <svg className={styles.icon} viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className={styles["sb-tip"]}>Dashboard</span>
          </button>
        </Link>
        <Link to={"/journey-complete"} state={{ hideHero: true }} className={styles["sb-btn"]} style={{ color: "grey" }}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className={styles["sb-tip"]}>Deliverables</span>
        </Link>

        <div className={styles["sb-spacer"]}></div>

        <button onClick={handleRestart} className={styles["sb-btn"]} style={{ color: "#ff9800" }}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          <span className={styles["sb-tip"]}>Restart Module</span>
        </button>

        <button onClick={handleLogout} className={styles["sb-btn"]} style={{ color: "grey" }}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className={styles["sb-tip"]}>Sign Out</span>
        </button>
      </aside>

      <div className={styles.layout}>
        <div className={styles.content}>
          {aiLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "8px", color: "#6366f1" }}>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Generating personalized assessment questions...</span>
            </div>
          )}

          {aiError && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#ef4444" }}>
              <span style={{ fontSize: "14px" }}>⚠️ {aiError}</span>
            </div>
          )}

          <div className={styles["left-panel"]}>
            <section className={styles["worksheet-shell"]}>
              <div className={styles["block-instructions"]}>
                <div className={styles["bi-tag"]}>📌 Instructions</div>
                <div className={styles["bi-text"]}>
                  This module helps you take an honest snapshot of where you are in life by reflecting across five key domains. Let's start with the <strong>Personal</strong> domain — your spiritual, intellectual, emotional, and physical life.<br /><br />
                  For each domain you'll answer 4 questions. Take a moment to reflect before answering.
                  <strong> Your response should describe what is actually true for you right now.</strong>
                </div>
              </div>

              <div className={styles["progress-row"]}>
                <div className={styles["progress-chip"]}>
                  Question {questionIndex + 1} of {questionFlow.length}
                </div>
              </div>

              {aiLoading && (
                <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", marginBottom: "24px" }}>
                  <p style={{ marginTop: "16px", color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>Generating personalized assessment questions...</p>
                </div>
              )}

              {aiError && (
                <div style={{ padding: "16px 20px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.3)", borderRadius: "12px", marginBottom: "24px", color: "rgba(255, 150, 150, 0.9)", fontSize: "14px" }}>
                  ⚠️ Unable to load AI questions: {aiError}. Using standard assessment.
                </div>
              )}

              {!aiLoading && aiQuestionsByDomain && (
                Array.isArray(aiQuestionsByDomain) ? aiQuestionsByDomain.length > 0 && !aiError : Object.keys(aiQuestionsByDomain).length > 0 && !aiError
              ) && (
                  <div style={{ padding: "12px 16px", background: "rgba(100, 200, 100, 0.1)", border: "1px solid rgba(100, 200, 100, 0.3)", borderRadius: "12px", marginBottom: "24px", color: "rgba(150, 255, 150, 0.9)", fontSize: "13px" }}>
                    ✓ Personalized with AI insights
                  </div>
                )}

              {!isComplete && (
                <>
                  <div className={styles["examples-card"]} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <div className={styles["card-title"]} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                      Click the examples below to add them to your reflection, or type your own:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {activeExamples.map((example: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const currentVal = inputValue || "";
                            const newValue = currentVal.trim() ? `${currentVal.trim()}\n- ${example}` : `- ${example}`;
                            setInputValue(newValue);
                            mainInputRef.current?.focus();
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                            e.currentTarget.style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                          }}
                          style={{ textAlign: "left", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.8)", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          <span style={{ lineHeight: "1.4" }}>{example}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles["question-card"]}>
                    <h2 className={styles["question-title"]} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      {currentDomain.config.title}: {baseQuestion.label}
                      {isUsingAIQuestions ? (
                        <span style={{ fontSize: "12px", opacity: 0.9, fontWeight: "normal", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                          ✓ AI-Generated
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", opacity: 0.7, fontWeight: "normal", color: "#fbbf24", background: "rgba(251, 191, 36, 0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                          (Sample Question)
                        </span>
                      )}
                    </h2>

                    <div className={styles["question-prompt"]} style={{ marginBottom: "16px" }}>
                      {isUsingAIQuestions ? (
                        <>
                          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                            {aiQuestionObj.question}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {activePrompt}
                          </span>
                        </>
                      ) : (
                        activePrompt
                      )}
                    </div>

                    <textarea
                      ref={mainInputRef}
                      className={styles["reflection-input"]}
                      placeholder={aiQuestionObj?.guidance || baseQuestion.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      rows={4}
                    />

                    <button
                      className={styles["submit-btn"]}
                      onClick={handleSubmitAnswer}
                      disabled={isStepSubmitted && !isEditingExisting}
                      style={isStepSubmitted && !isEditingExisting ? { opacity: 0.5, cursor: "not-allowed", background: "#555", color: "#aaa", pointerEvents: "none" } : undefined}
                    >
                      {isStepSubmitted && !isEditingExisting ? "✓ Answer Submitted" : isEditingExisting ? "Save Main Answer" : "Submit Answer"}
                    </button>
                  </div>
                  {(isStepSubmitted || isEditingExisting) && (
                    <>
                      <div className={styles["block-affirmation"]} id="affirmationBlock">
                        <div className={styles["aff-row"]}>
                          <div className={styles["aff-av"]}>✦</div>
                          <div className={styles["aff-bubble"]} id="affirmationText">
                            That reflects a strong sense of intentionality and growth across multiple areas of your life. You're not only building consistent habits, but also integrating what you're learning into how you live and relate to others. There's a meaningful sense of forward movement as you explore what a full and healthy life looks like in this new season.
                          </div>
                        </div>
                      </div>

                      <div className={styles["block-followup"]} id="followupBlock">
                        <div className={styles["bf-label"]}>✦ Follow-Up Question</div>

                        <div className={styles["bf-text"]}>
                          {isGeneratingFollowUp ? (
                            <span style={{ color: "#10b981" }}>
                              Generating thoughtful follow-up...
                            </span>
                          ) : (
                            dynamicFollowUp || getFallbackFollowUp(baseQuestion.column)
                          )}
                        </div>

                        <textarea
                          className={styles["bf-textarea"]}
                          id="followupAnswer"
                          placeholder="Share your response here..."
                          value={followupValue}
                          onChange={(e) => setFollowupValue(e.target.value)}
                          disabled={isGeneratingFollowUp}
                        />
                        <button
                          className={styles["bf-submit"]}
                          onClick={handleFollowupSubmit}
                          disabled={isGeneratingFollowUp}
                        >
                          {isEditingExisting ? "Save Follow-up Update" : "Submit & Move to Next Question →"}
                        </button>
                        {isEditingExisting && (
                          <button
                            className={styles["btn-ghost"]}
                            onClick={() => {
                              setIsEditingExisting(false);
                              setIsStepSubmitted(false);
                              setInputValue("");
                              setFollowupValue("");
                            }}
                            style={{ marginTop: "10px" }}
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </section>

            <section className={styles["table-panel"]}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", color: "#fff" }}>
                View My Progress
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={handleResetTable} style={{ border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: "8px", fontSize: "0.8rem", padding: "6px 10px", cursor: "pointer" }}>Reset Table</button>
                  <span style={{ display: "flex", gap: "5px" }}>{answeredCount} <span> of</span> <span style={{ color: "var(--gs)" }}>{totalQuestions}</span></span>
                </div>
              </div>

              <MemoizedProgressTable
                styles={styles}
                tableData={tableData}
                followupTableData={followupTableData}
                lastUpdatedCell={lastUpdatedCell}
                handleEditQuestion={handleEditQuestion}
                domains={domains}
                questionFlow={questionFlow}
              />
            </section>

            {isTableComplete && (
              <>
                <div className={styles["analysis-section"]}>
                  <div className={styles["as-title"]}>Final Reflection Notes</div>
                  <textarea className={styles["analysis-textarea"]} value={analysis} onChange={(e) => setAnalysis(e.target.value)} placeholder="Capture any summary insights from your assessment before continuing." rows={6} />
                </div>
                <div className={styles["save-actions"]}>
                  <button onClick={handleUnlockPerspective} className={styles["btn-complete"]}>Continue to Perspective</button>
                  <button className={styles["btn-pdf"]} onClick={generatePDF}>Download PDF Report</button>
                  <button className={styles["btn-ghost"]} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showRestartConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "8px", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginTop: 0, color: "#d32f2f" }}>Confirm Module Restart</h3>
            <p>This will permanently delete all your answers and follow-up notes for this module.<strong> This action cannot be undone.</strong></p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowRestartConfirm(false)} style={{ padding: "10px 20px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirmRestart} style={{ padding: "10px 20px", background: "#d32f2f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Confirm Reset</button>
            </div>
          </div>
        </div>
      )}

      <SynthesisConfirmationModal isOpen={showSynthesisModal} title={`Confirm: ${synthesisData?.domain || ""}`} synthesizedText={synthesisData?.synthesized || ""} onConfirm={handleSynthesisConfirm} onEdit={handleSynthesisEdit} />
    </div>
  );
};

export default WhereIAmNow;