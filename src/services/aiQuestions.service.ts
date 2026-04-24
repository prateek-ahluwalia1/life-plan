import { apiURL } from "../utils/exports";

// ==================== TYPES ====================

export interface AIQuestion {
  id: string;
  domain: string;
  question: string;
  prompt: string;
  guidance: string;
  examples: string[];
}

export interface AIFollowUpRequest {
  domain: string;
  userContext?: string;
  examples?: string[];
}

export interface WhereIAmNowFollowUpRequest {
  domain: string;
  userResponse: string;
  assessmentType: "right" | "wrong" | "confused" | "missing";
}

// ==================== GETTING STARTED MODULE ====================

/**
 * Fetch AI-generated opening questions for Getting Started module
 */
export const fetchGettingStartedAIQuestions = async (
  token: string
): Promise<AIQuestion[]> => {
  try {
    const url = `${apiURL}modules/getting-started/ai-questions`;
    console.log("[fetchGettingStartedAIQuestions] Calling API:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    console.log("[fetchGettingStartedAIQuestions] Response status:", response.status);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch AI questions: ${response.status}`
      );
    }

    const data = (await response.json()) as {
      questions: AIQuestion[];
    };
    console.log("[fetchGettingStartedAIQuestions] Success:", data.questions.length, "questions");
    return data.questions;
  } catch (error) {
    console.error("[fetchGettingStartedAIQuestions] Error:", error);
    throw error;
  }
};

/**
 * Fetch AI-generated follow-up questions for a domain
 */
export const fetchGettingStartedFollowUp = async (
  token: string,
  request: AIFollowUpRequest
): Promise<AIQuestion[]> => {
  try {
    const response = await fetch(
      `${apiURL}modules/getting-started/ai-followup`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch follow-up questions: ${response.status}`
      );
    }

    const data = (await response.json()) as {
      followupQuestions: AIQuestion[];
    };
    return data.followupQuestions;
  } catch (error) {
    console.error("Fetch Getting Started follow-up error:", error);
    throw error;
  }
};

// ==================== WHERE I AM NOW MODULE ====================

/**
 * Fetch AI-generated assessment questions for Where I Am Now module
 */
export const fetchWhereIAmNowAIQuestions = async (
  token: string
): Promise<Record<string, AIQuestion[]>> => {
  try {
    const response = await fetch(
      `${apiURL}modules/where-i-am-now/ai-questions`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch AI questions: ${response.status}`
      );
    }

    const data = (await response.json()) as {
      questions: Record<string, AIQuestion[]>;
    };
    return data.questions;
  } catch (error) {
    console.error("Fetch Where I Am Now AI questions error:", error);
    throw error;
  }
};

/**
 * Fetch AI-generated contextual follow-up for a specific response
 */
export const fetchWhereIAmNowFollowUp = async (
  token: string,
  request: WhereIAmNowFollowUpRequest
): Promise<string> => {
  try {
    const response = await fetch(
      `${apiURL}modules/where-i-am-now/ai-followup`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch follow-up: ${response.status}`
      );
    }

    const data = (await response.json()) as {
      followUp: string;
    };
    return data.followUp;
  } catch (error) {
    console.error("Fetch Where I Am Now follow-up error:", error);
    throw error;
  }
};

export default {
  fetchGettingStartedAIQuestions,
  fetchGettingStartedFollowUp,
  fetchWhereIAmNowAIQuestions,
  fetchWhereIAmNowFollowUp,
};
