import { useState, useEffect, useCallback } from "react";
import type { AIQuestion } from "../services/aiQuestions.service";
import {
  fetchGettingStartedAIQuestions,
  fetchGettingStartedFollowUp,
  fetchWhereIAmNowAIQuestions,
  fetchWhereIAmNowFollowUp,
  type AIFollowUpRequest,
  type WhereIAmNowFollowUpRequest,
} from "../services/aiQuestions.service";

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_PREFIX = "lifeplan_ai_questions_";

// ==================== CACHE UTILITIES ====================

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(module: string, type: string, identifier?: string): string {
  return `${STORAGE_PREFIX}${module}_${type}${identifier ? `_${identifier}` : ""}`;
}

function setCache<T>(key: string, data: T): void {
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.warn("Failed to cache data:", error);
  }
}

function getCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const cached = JSON.parse(item) as CachedData<T>;
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.warn("Failed to retrieve cached data:", error);
    return null;
  }
}

// ==================== GETTING STARTED QUESTIONS HOOK ====================

interface UseGettingStartedQuestionsState {
  questions: AIQuestion[];
  loading: boolean;
  error: string | null;
}

export const useGettingStartedQuestions = (token: string | null) => {
  const [state, setState] = useState<UseGettingStartedQuestionsState>({
    questions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log("[useGettingStartedQuestions] Token:", token ? "exists" : "missing");
    
    if (!token) {
      console.log("[useGettingStartedQuestions] No token, setting empty state");
      setState({ questions: [], loading: false, error: null });
      return;
    }

    let isMounted = true;

    const loadQuestions = async () => {
      try {
        const cacheKey = getCacheKey("getting-started", "questions");
        console.log("[useGettingStartedQuestions] Cache key:", cacheKey);
        
        // Check for cache bypass flag in URL (development)
        const params = new URLSearchParams(window.location.search);
        const bypassCache = params.has("no-cache");
        console.log("[useGettingStartedQuestions] Bypass cache:", bypassCache);
        
        const cached = !bypassCache ? getCache<AIQuestion[]>(cacheKey) : null;
        console.log("[useGettingStartedQuestions] Cached data:", cached ? "found" : "not found/bypassed");

        if (cached && isMounted) {
          console.log("[useGettingStartedQuestions] Using cached questions (to bypass, add ?no-cache to URL)");
          setState({ questions: cached, loading: false, error: null });
          return;
        }

        console.log("[useGettingStartedQuestions] Fetching from API...");
        setState((prev) => ({ ...prev, loading: true })); // Ensure loading state
        
        const questions = await fetchGettingStartedAIQuestions(token);
        console.log("[useGettingStartedQuestions] API returned:", questions.length, "questions");

        if (isMounted) {
          setCache(cacheKey, questions);
          setState({ questions, loading: false, error: null });
        }
      } catch (error) {
        console.error("[useGettingStartedQuestions] Error:", error);
        if (isMounted) {
          setState({
            questions: [],
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to load questions",
          });
        }
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return state;
};

// ==================== GETTING STARTED FOLLOW-UP HOOK ====================

interface UseGettingStartedFollowUpState {
  followupQuestions: AIQuestion[];
  loading: boolean;
  error: string | null;
}

export const useGettingStartedFollowUp = (token: string | null) => {
  const [state, setState] = useState<UseGettingStartedFollowUpState>({
    followupQuestions: [],
    loading: false,
    error: null,
  });

  const generateFollowUp = useCallback(
    async (request: AIFollowUpRequest) => {
      if (!token) {
        setState({
          followupQuestions: [],
          loading: false,
          error: "Not authenticated",
        });
        return;
      }

      setState({ followupQuestions: [], loading: true, error: null });

      try {
        const followupQuestions = await fetchGettingStartedFollowUp(
          token,
          request
        );
        setState({
          followupQuestions,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          followupQuestions: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate follow-up",
        });
      }
    },
    [token]
  );

  return { ...state, generateFollowUp };
};

// ==================== WHERE I AM NOW QUESTIONS HOOK ====================

interface UseWhereIAmNowQuestionsState {
  questionsByDomain: Record<string, AIQuestion[]>;
  loading: boolean;
  error: string | null;
}

export const useWhereIAmNowQuestions = (token: string | null) => {
  const [state, setState] = useState<UseWhereIAmNowQuestionsState>({
    questionsByDomain: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log("[useWhereIAmNowQuestions] Token:", token ? "exists" : "missing");
    
    if (!token) {
      console.log("[useWhereIAmNowQuestions] No token, setting empty state");
      setState({ questionsByDomain: {}, loading: false, error: null });
      return;
    }

    let isMounted = true;

    const loadQuestions = async () => {
      try {
        const cacheKey = getCacheKey("where-i-am-now", "questions");
        console.log("[useWhereIAmNowQuestions] Cache key:", cacheKey);
        
        // Check for cache bypass flag in URL (development)
        const params = new URLSearchParams(window.location.search);
        const bypassCache = params.has("no-cache");
        console.log("[useWhereIAmNowQuestions] Bypass cache:", bypassCache);
        
        const cached = !bypassCache ? getCache<Record<string, AIQuestion[]>>(cacheKey) : null;
        console.log("[useWhereIAmNowQuestions] Cached data:", cached ? "found" : "not found/bypassed");

        if (cached && isMounted) {
          console.log("[useWhereIAmNowQuestions] Using cached questions (to bypass, add ?no-cache to URL)");
          setState({
            questionsByDomain: cached,
            loading: false,
            error: null,
          });
          return;
        }

        console.log("[useWhereIAmNowQuestions] Fetching from API...");
        setState((prev) => ({ ...prev, loading: true })); // Ensure loading state
        
        const questionsByDomain = await fetchWhereIAmNowAIQuestions(token);
        console.log("[useWhereIAmNowQuestions] API returned:", Object.keys(questionsByDomain).length, "domains");

        if (isMounted) {
          setCache(cacheKey, questionsByDomain);
          setState({
            questionsByDomain,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("[useWhereIAmNowQuestions] Error:", error);
        if (isMounted) {
          setState({
            questionsByDomain: {},
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load questions",
          });
        }
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return state;
};

// ==================== WHERE I AM NOW FOLLOW-UP HOOK ====================

interface UseWhereIAmNowFollowUpState {
  followUp: string;
  loading: boolean;
  error: string | null;
}

export const useWhereIAmNowFollowUp = (token: string | null) => {
  const [state, setState] = useState<UseWhereIAmNowFollowUpState>({
    followUp: "",
    loading: false,
    error: null,
  });

  const generateFollowUp = useCallback(
    async (request: WhereIAmNowFollowUpRequest) => {
      if (!token) {
        setState({
          followUp: "",
          loading: false,
          error: "Not authenticated",
        });
        return;
      }

      setState({ followUp: "", loading: true, error: null });

      try {
        const followUp = await fetchWhereIAmNowFollowUp(token, request);
        setState({
          followUp,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          followUp: "",
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate follow-up",
        });
      }
    },
    [token]
  );

  return { ...state, generateFollowUp };
};

// ==================== CLEAR CACHE UTILITIES ====================

export const clearAIQuestionsCache = (module?: string): void => {
  try {
    if (module) {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`${STORAGE_PREFIX}${module}`)
      );
      keys.forEach((key) => {
        localStorage.removeItem(key);
        console.log("[clearAIQuestionsCache] Cleared:", key);
      });
      console.log(`[clearAIQuestionsCache] Cleared ${keys.length} cache entries for module: ${module}`);
    } else {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(STORAGE_PREFIX)
      );
      keys.forEach((key) => {
        localStorage.removeItem(key);
        console.log("[clearAIQuestionsCache] Cleared:", key);
      });
      console.log(`[clearAIQuestionsCache] Cleared all ${keys.length} AI cache entries`);
    }
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
};

// Utility to check cache status
export const getAICacheStatus = (): { [key: string]: any } => {
  try {
    const cacheItems: { [key: string]: any } = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item) as CachedData<any>;
            const ageMs = Date.now() - parsed.timestamp;
            const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(1);
            const isExpired = ageMs > CACHE_DURATION;
            cacheItems[key] = {
              age: `${ageHours} hours`,
              expired: isExpired,
              timestamp: new Date(parsed.timestamp).toISOString(),
            };
          }
        } catch {
          // Skip invalid cache entries
        }
      }
    });
    return cacheItems;
  } catch (error) {
    console.warn("Failed to get cache status:", error);
    return {};
  }
};

export default {
  useGettingStartedQuestions,
  useGettingStartedFollowUp,
  useWhereIAmNowQuestions,
  useWhereIAmNowFollowUp,
  clearAIQuestionsCache,
};
