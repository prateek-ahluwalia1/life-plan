import { useState } from "react";
import Loader from "./Loader";

interface DynamicFollowUpProps {
  isVisible: boolean;
  isLoading: boolean;
  followUpDepth: 0 | 1 | 2; // 0 = no follow-up, 1 = one, 2 = two
  currentFollowUpIndex?: 0 | 1; // Which follow-up are we on
  followUpPrompt?: string;
  userResponse: string;
  onResponseChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onSkip?: () => void;
}

/**
 * Component for handling dynamic follow-up questions
 * Adapts to support 0, 1, or 2 follow-ups without breaking layout
 */
const DynamicFollowUp = ({
  isVisible,
  isLoading,
  followUpDepth,
  currentFollowUpIndex = 0,
  followUpPrompt = "Can you tell me more about this?",
  userResponse,
  onResponseChange,
  onSubmit,
  onSkip,
}: DynamicFollowUpProps) => {
  const [skipped, setSkipped] = useState(false);

  if (!isVisible || followUpDepth === 0) {
    return null; // No follow-up needed
  }

  if (skipped) {
    return null; // User chose to skip follow-ups
  }

  const followUpNumber = currentFollowUpIndex + 1;
  const isLastFollowUp = currentFollowUpIndex === followUpDepth - 1;

  const handleSkip = () => {
    setSkipped(true);
    onSkip?.();
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        borderLeft: "4px solid #0916308",
        backgroundColor: "#f0f5fa",
        borderRadius: "4px",
      }}
    >
      <p
        style={{
          fontSize: "0.9rem",
          fontWeight: 500,
          marginBottom: "10px",
          color: "#0916308",
        }}
      >
        Follow-up {followUpNumber}
        {followUpDepth > 1 && ` of ${followUpDepth}`}
      </p>

      <p
        style={{
          fontSize: "0.95rem",
          fontWeight: 500,
          marginBottom: "10px",
          color: "#333",
        }}
      >
        {followUpPrompt}
      </p>

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Type your response here..."
        disabled={isLoading}
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "0.95rem",
          fontFamily: "inherit",
          resize: "vertical",
          opacity: isLoading ? 0.6 : 1,
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleSkip}
          disabled={isLoading}
          style={{
            padding: "8px 16px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          Skip {isLastFollowUp ? "Follow-ups" : "This"}
        </button>

        <button
          onClick={onSubmit}
          disabled={isLoading || !userResponse.trim()}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#0916308",
            color: "white",
            cursor: isLoading || !userResponse.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !userResponse.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isLoading ? <Loader /> : "Continue"}
          {isLastFollowUp && " (Final)"}
        </button>
      </div>
    </div>
  );
};

export default DynamicFollowUp;
