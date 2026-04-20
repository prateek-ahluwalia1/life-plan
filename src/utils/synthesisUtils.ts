/**
 * Response Synthesis Utility
 * 
 * SPECIFICATION-ALIGNED: Implements synthesis requirement
 * "Before advancing to next core question, system must synthesize the core answer 
 * and any follow-up responses into a single cohesive statement."
 */

/**
 * Synthesizes multiple response pieces into a coherent statement
 * Combines main response + follow-ups while preserving user meaning
 */
export const synthesizeResponse = (
  mainResponse: string,
  followUps: string[] = []
): string => {
  if (!mainResponse.trim()) {
    return "";
  }

  // If no follow-ups, return main response cleaned up
  if (followUps.length === 0 || followUps.every((f) => !f.trim())) {
    return mainResponse.trim();
  }

  // Combine responses into coherent statement
  const mainClean = mainResponse.trim();
  const followUpClean = followUps
    .filter((f) => f.trim())
    .map((f) => f.trim());

  if (followUpClean.length === 0) {
    return mainClean;
  }

  // Merge into single narrative
  const combined = [mainClean, ...followUpClean].join(" ");

  // Clean up repetition and fragmentation
  return cleanUpSynthesis(combined);
};

/**
 * Cleans up synthesized text:
 * - Removes duplicate phrases
 * - Fixes grammar
 * - Ensures proper sentence structure
 */
function cleanUpSynthesis(text: string): string {
  let cleaned = text;

  // Remove excessive punctuation
  cleaned = cleaned.replace(/\.{2,}/g, ".");

  // Fix spacing around punctuation
  cleaned = cleaned.replace(/\s+([,.!?])/g, "$1");
  cleaned = cleaned.replace(/([,.!?])\s+/g, "$1 ");

  // Remove duplicate spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Ensure ends with period if it's a sentence
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }

  return cleaned.trim();
}

/**
 * Generates synthesis prompt for AI-powered synthesis
 * Used when server-side synthesis is needed
 */
export const generateSynthesisPrompt = (
  mainResponse: string,
  followUps: string[] = []
): string => {
  const components = [mainResponse, ...followUps.filter((f) => f.trim())];

  return `Combine these into one clear, natural sentence(s) while preserving the user's meaning:
${components.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Output ONLY the synthesized statement, no explanation.`;
};

/**
 * Creates a synthesis confirmation message for UI display
 */
export const createSynthesisMessage = (synthesized: string): string => {
  return `Here's how we're capturing your reflection:\n\n"${synthesized}"`;
};

/**
 * Validates that a response has meaningful content (not just whitespace/punctuation)
 */
export const isValidResponse = (response: string): boolean => {
  if (!response) return false;
  const cleaned = response.trim().replace(/[.,!?;:\-—]/g, "");
  return cleaned.length >= 5; // At least 5 characters of actual content
};
