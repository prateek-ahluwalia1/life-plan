import { useState, useCallback } from "react";

type EditCell = {
  row: string;
  column: string;
};

/**
 * Hook to manage table editing state
 * Supports edit mode for specific cells
 */
export const useTableEditing = <T extends Record<string, Record<string, string>>>() => {
  const [editingCell, setEditingCell] = useState<EditCell | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startEdit = useCallback((row: string, column: string, currentValue: string) => {
    setEditingCell({ row, column });
    setTempValue(currentValue);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setTempValue("");
  }, []);

  const saveEdit = useCallback(
    (
      data: T,
      onSave: (updatedData: T) => void | Promise<void>,
    ): void => {
      if (!editingCell) return;

      const updatedData = {
        ...data,
        [editingCell.row]: {
          ...data[editingCell.row],
          [editingCell.column]: tempValue,
        },
      };

      onSave(updatedData);
      setEditingCell(null);
      setTempValue("");
    },
    [editingCell, tempValue],
  );

  const isEditing = editingCell !== null;
  const isEditingCell = (row: string, column: string) =>
    isEditing && editingCell.row === row && editingCell.column === column;

  return {
    isEditing,
    isEditingCell,
    editingCell,
    tempValue,
    setTempValue,
    startEdit,
    cancelEdit,
    saveEdit,
  };
};

export default useTableEditing;
