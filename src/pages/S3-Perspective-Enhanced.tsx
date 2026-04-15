import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";
import ModuleGatingBlock from "../components/ModuleGatingBlock";
import EditableTableCell from "../components/EditableTableCell";
import useTableEditing from "../hooks/useTableEditing";
import useModuleAccess from "../hooks/useModuleAccess";
import { requestModuleRestart, confirmModuleRestart } from "../utils/moduleHelpers";
import Loader from "../components/Loader";

interface RangeData {
  low: string;
  mid: string;
  high: string;
  yourAssessment: string;
}

interface PerspectiveData {
  domains: Record<string, RangeData>;
  analysis: string;
  isComplete: boolean;
}

const domains = [
  { key: "personal", label: "Personal" },
  { key: "family", label: "Family & Friends" },
  { key: "church", label: "Church & Kingdom" },
  { key: "vocation", label: "Vocation" },
  { key: "community", label: "Community" },
];

const PerspectiveModule: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const userdata = useSelector((state: RootState) => state.auth.userdata);

  const { isLocked } = useModuleAccess("perspective");
  const { isEditingCell, startEdit, cancelEdit, tempValue, setTempValue } = useTableEditing();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PerspectiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeEditDomain, setActiveEditDomain] = useState<string | null>(null);
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

  // Load module data
  useEffect(() => {
    if (!token || isLocked) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch(`${apiURL}modules/perspective`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load module");
        }

        const loaded = (await response.json()) as PerspectiveData;
        setData(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isLocked]);

  // Save data
  const saveData = async (updates: Partial<PerspectiveData>) => {
    if (!token || !data) return;

    setSaving(true);
    try {
      const response = await fetch(`${apiURL}modules/perspective`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const updated = (await response.json()) as PerspectiveData;
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Handle restart
  const handleRestart = async () => {
    if (!token) return;

    try {
      const result = await requestModuleRestart(token, "modules/perspective");
      if (result?.confirmationId) {
        setRestartConfirmId(result.confirmationId);
        setShowRestartConfirm(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate restart");
    }
  };

  // Confirm restart
  const handleConfirmRestart = async () => {
    if (!token || !restartConfirmId) return;

    try {
      await confirmModuleRestart(token, "modules/perspective", restartConfirmId);
      setData(null);
      setShowRestartConfirm(false);
      setRestartConfirmId(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart");
    }
  };

  // Handle cell edit
  const handleEditCell = (domainKey: string, rangeKey: "low" | "mid" | "high") => {
    setActiveEditDomain(domainKey);
    startEdit(domainKey, rangeKey, data?.domains[domainKey]?.[rangeKey] || "");
  };

  // Handle cell save
  const handleSaveCell = async (domainKey: string, rangeKey: "low" | "mid" | "high") => {
    if (!data) return;

    const newDomains = { ...data.domains };
    newDomains[domainKey] = {
      ...newDomains[domainKey],
      [rangeKey]: tempValue,
    };

    await saveData({ domains: newDomains });
    cancelEdit();
    setActiveEditDomain(null);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader />
      </div>
    );
  }

  if (isLocked) {
    return <ModuleGatingBlock moduleName="Perspective" requiredModules={["where-i-am-now"]} />;
  }

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Failed to load module</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e0e0e0",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0916308" }}>
            Stage 2 — Perspective
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
            Assess your perspective across life domains
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#0916308",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {profileInitials}
          </div>
          <button
            onClick={() => {
              dispatch(logout());
              navigate("/");
            }}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px" }}>
        {error && (
          <div
            style={{
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              padding: "15px",
              marginBottom: "20px",
              color: "#c33",
            }}
          >
            {error}
          </div>
        )}

        {/* Instructions */}
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h2 style={{ marginTop: 0, color: "#0916308" }}>How to Use This Module</h2>
          <p>For each life domain, assess your current perspective across three range questions:</p>
          <ul>
            <li><strong>Low:</strong> Pessimistic or challenging view</li>
            <li><strong>Mid:</strong> Balanced or moderate view</li>
            <li><strong>High:</strong> Optimistic or empowered view</li>
          </ul>
          <p>Click on any cell to edit your assessment. Your changes are automatically saved.</p>
        </div>

        {/* Perspective Table */}
        <div style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold", color: "#333" }}>
                  Domain
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold", color: "#333" }}>
                  Low Perspective
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold", color: "#333" }}>
                  Mid Perspective
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold", color: "#333" }}>
                  High Perspective
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold", color: "#333" }}>
                  Your Assessment
                </th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.key} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", fontWeight: "500", color: "#333" }}>
                    {domain.label}
                  </td>
                  {(["low", "mid", "high"] as const).map((range) => (
                    <td key={range} style={{ padding: "12px" }}>
                      <EditableTableCell
                        value={data.domains[domain.key]?.[range] || ""}
                        isEditing={isEditingCell(domain.key, range) && activeEditDomain === domain.key}
                        tempValue={tempValue}
                        onTempChange={setTempValue}
                        onStartEdit={() => handleEditCell(domain.key, range)}
                        onSave={() => handleSaveCell(domain.key, range)}
                        onCancel={cancelEdit}
                        isLoading={saving}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "12px" }}>
                    <textarea
                      value={data.domains[domain.key]?.yourAssessment || ""}
                      onChange={(e) => {
                        const newDomains = { ...data.domains };
                        newDomains[domain.key] = {
                          ...newDomains[domain.key],
                          yourAssessment: e.target.value,
                        };
                        setData({ ...data, domains: newDomains });
                      }}
                      onBlur={() => saveData({ domains: data.domains })}
                      placeholder="Where do you stand?"
                      style={{
                        width: "100%",
                        minHeight: "60px",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontFamily: "inherit",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "30px", justifyContent: "flex-end" }}>
          <button
            onClick={handleRestart}
            style={{
              padding: "10px 20px",
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Restart Module
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 20px",
              background: "#0916308",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>

        {/* Restart Confirmation Dialog */}
        {showRestartConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                maxWidth: "400px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Confirm Module Restart?</h3>
              <p>This will delete all your answers for this module. This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRestart}
                  style={{
                    padding: "8px 16px",
                    background: "#d32f2f",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Confirm Restart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerspectiveModule;
