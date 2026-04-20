import React, { useState } from "react";
import type { AIQuestion } from "../services/aiQuestions.service";

// ==================== STYLES (as CSS Module) ====================

const styles = {
  container: "ai-question-container",
  header: "ai-question-header",
  title: "ai-question-title",
  subtitle: "ai-question-subtitle",
  content: "ai-question-content",
  prompt: "ai-question-prompt",
  guidance: "ai-question-guidance",
  guidanceIcon: "ai-guidance-icon",
  guidanceText: "ai-guidance-text",
  examplesSection: "ai-examples-section",
  examplesTitle: "ai-examples-title",
  example: "ai-example",
  exampleBullet: "ai-example-bullet",
  inputArea: "ai-input-area",
  textarea: "ai-textarea",
  actions: "ai-actions",
  button: "ai-button",
  buttonPrimary: "ai-button-primary",
  buttonSecondary: "ai-button-secondary",
  loading: "ai-loading",
  spinner: "ai-spinner",
};

// ==================== COMPONENT TYPES ====================

interface AIQuestionDisplayProps {
  question: AIQuestion;
  onSubmit: (answer: string) => void;
  loading?: boolean;
  showExamples?: boolean;
  showGuidance?: boolean;
  placeholder?: string;
  customStyles?: Partial<typeof styles>;
}

interface AIQuestionNavigatorProps {
  questions: AIQuestion[];
  onSubmit: (questionId: string, answer: string) => void;
  loading?: boolean;
  showProgress?: boolean;
  completedQuestions?: Set<string>;
  customStyles?: Partial<typeof styles>;
}

// ==================== SINGLE QUESTION DISPLAY ====================

export const AIQuestionDisplay: React.FC<AIQuestionDisplayProps> = ({
  question,
  onSubmit,
  loading = false,
  showExamples = true,
  showGuidance = true,
  placeholder = "Share your thoughts...",
  customStyles = {},
}) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer("");
    }
  };

  const mergedStyles = { ...styles, ...customStyles };

  return (
    <div className={mergedStyles.container}>
      <div className={mergedStyles.header}>
        <h2 className={mergedStyles.title}>{question.question}</h2>
        {question.domain && (
          <p className={mergedStyles.subtitle}>
            {question.domain.charAt(0).toUpperCase() + question.domain.slice(1)}
          </p>
        )}
      </div>

      <div className={mergedStyles.content}>
        {question.prompt && (
          <p className={mergedStyles.prompt}>{question.prompt}</p>
        )}

        {showGuidance && question.guidance && (
          <div className={mergedStyles.guidance}>
            <span className={mergedStyles.guidanceIcon}>💡</span>
            <span className={mergedStyles.guidanceText}>
              {question.guidance}
            </span>
          </div>
        )}

        {showExamples && question.examples && question.examples.length > 0 && (
          <div className={mergedStyles.examplesSection}>
            <p className={mergedStyles.examplesTitle}>Examples:</p>
            {question.examples.map((example, idx) => (
              <div key={idx} className={mergedStyles.example}>
                <span className={mergedStyles.exampleBullet}>•</span>
                <span>{example}</span>
              </div>
            ))}
          </div>
        )}

        <div className={mergedStyles.inputArea}>
          <textarea
            className={mergedStyles.textarea}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            rows={5}
          />
        </div>

        <div className={mergedStyles.actions}>
          <button
            className={`${mergedStyles.button} ${mergedStyles.buttonPrimary}`}
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
          >
            {loading ? (
              <>
                <span className={mergedStyles.spinner} /> Processing...
              </>
            ) : (
              "Submit Response"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== QUESTION NAVIGATOR ====================

export const AIQuestionNavigator: React.FC<AIQuestionNavigatorProps> = ({
  questions,
  onSubmit,
  loading = false,
  showProgress = true,
  completedQuestions = new Set(),
  customStyles = {},
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="ai-no-questions">
        <p>No questions available.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCompleted = completedQuestions.has(currentQuestion.id);
  const progress = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  const handleSubmit = (answer: string) => {
    onSubmit(currentQuestion.id, answer);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="ai-navigator-container">
      {showProgress && (
        <div className="ai-progress-section">
          <div className="ai-progress-bar">
            <div
              className="ai-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="ai-progress-text">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
      )}

      <AIQuestionDisplay
        question={currentQuestion}
        onSubmit={handleSubmit}
        loading={loading}
        customStyles={customStyles}
      />

      <div className="ai-navigation">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="ai-nav-button"
        >
          ← Previous
        </button>

        <span className="ai-nav-status">
          {isCompleted && "✓ Completed"}
        </span>

        <button
          onClick={() =>
            setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
          }
          disabled={currentIndex === questions.length - 1}
          className="ai-nav-button"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// ==================== LOADING STATE ====================

export const AIQuestionLoading: React.FC<{ message?: string }> = ({
  message = "Generating personalized questions...",
}) => (
  <div className={`${styles.container} ${styles.loading}`}>
    <div className={styles.spinner} />
    <p>{message}</p>
  </div>
);

// ==================== ERROR STATE ====================

export const AIQuestionError: React.FC<{
  error: string;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="ai-error-container">
    <div className="ai-error-message">
      <span className="ai-error-icon">⚠️</span>
      <p>{error}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry} className={`${styles.button} ${styles.buttonSecondary}`}>
        Try Again
      </button>
    )}
  </div>
);

export default {
  AIQuestionDisplay,
  AIQuestionNavigator,
  AIQuestionLoading,
  AIQuestionError,
};
