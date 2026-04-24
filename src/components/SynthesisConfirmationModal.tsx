import React from "react";
import styles from "../css/SynthesisConfirmationModal.module.css";

interface SynthesisConfirmationModalProps {
  isOpen: boolean;
  title: string;
  synthesizedText: string;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

/**
 * SynthesisConfirmationModal
 * 
 * SPECIFICATION-ALIGNED: Implements synthesis checkpoint requirement
 * "Before advancing to next core question, system must synthesize..."
 * 
 * Users must review and confirm the synthesized response before proceeding.
 * This ensures they've reflected on their entry and agreed with the summary.
 */
const SynthesisConfirmationModal: React.FC<SynthesisConfirmationModalProps> = ({
  isOpen,
  title,
  synthesizedText,
  onConfirm,
  onEdit,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <p className={styles.modalSubtitle}>
            Here's what we're capturing from your reflection
          </p>
        </div>

        {/* Synthesis Display */}
        <div className={styles.synthesisContent}>
          <p className={styles.synthesizedText}>{synthesizedText}</p>
        </div>

        {/* Guidance */}
        <div className={styles.guidance}>
          <p className={styles.guidanceText}>
            Does this capture your thoughts accurately? You can edit it if needed,
            or confirm and continue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.modalFooter}>
          <button
            className={styles.buttonEdit}
            onClick={onEdit}
            disabled={isLoading}
          >
            Edit My Response
          </button>
          <button
            className={styles.buttonConfirm}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm & Continue"}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SynthesisConfirmationModal;
