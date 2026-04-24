import React, { useState } from "react";

interface EditableTableCellProps {
  value: string;
  isEditing: boolean;
  tempValue: string;
  onTempChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  minHeight?: number;
}

/**
 * Editable table cell component
 * Supports inline editing with save/cancel
 */
const EditableTableCell: React.FC<EditableTableCellProps> = ({
  value,
  isEditing,
  tempValue,
  onTempChange,
  onStartEdit,
  onSave,
  onCancel,
  isLoading = false,
  minHeight = 60,
}) => {
  const [hovered, setHovered] = useState(false);

  if (isEditing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px",
        }}
      >
        <textarea
          value={tempValue}
          onChange={(e) => onTempChange(e.target.value)}
          disabled={isLoading}
          autoFocus
          style={{
            width: "100%",
            minHeight: `${minHeight}px`,
            padding: "8px",
            border: "2px solid #0916308",
            borderRadius: "4px",
            fontFamily: "inherit",
            fontSize: "0.9rem",
            resize: "vertical",
            opacity: isLoading ? 0.7 : 1,
            transition: "border-color 0.2s",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "6px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "4px 12px",
              border: "1px solid #ddd",
              borderRadius: "3px",
              background: "#f5f5f5",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading || !tempValue.trim()}
            style={{
              padding: "4px 12px",
              border: "none",
              borderRadius: "3px",
              background: "#0916308",
              color: "white",
              cursor: isLoading || !tempValue.trim() ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              opacity: isLoading || !tempValue.trim() ? 0.6 : 1,
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onStartEdit}
      style={{
        padding: "8px",
        cursor: "pointer",
        borderRadius: "3px",
        background: hovered ? "#f0f5fa" : "transparent",
        position: "relative",
        minHeight: `${minHeight}px`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        transition: "background-color 0.2s",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      <span>{value || <em style={{ color: "#999" }}>Click to edit</em>}</span>
      {hovered && (
        <span
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            fontSize: "0.75rem",
            background: "#0916308",
            color: "white",
            padding: "2px 6px",
            borderRadius: "2px",
            opacity: 0.7,
          }}
        >
          ✎ Edit
        </span>
      )}
    </div>
  );
};

export default EditableTableCell;
