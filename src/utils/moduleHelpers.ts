import { apiURL } from "./exports";

type RestartResponse = {
  status: "confirmation_required" | "reset_complete" | "error";
  confirmationId?: string;
  message?: string;
  error?: string;
};

/**
 * Request module restart (first step - get confirmation ID)
 */
export const requestModuleRestart = async (
  token: string,
  modulePath: string,
): Promise<RestartResponse> => {
  try {
    const response = await fetch(`${apiURL}${modulePath}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await response.json() as RestartResponse;

    if (!response.ok) {
      return {
        status: "error",
        error: data.message || "Failed to request restart",
      };
    }

    return data;
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Confirm module restart (second step - send confirmation ID)
 */
export const confirmModuleRestart = async (
  token: string,
  modulePath: string,
  confirmationId: string,
): Promise<RestartResponse> => {
  try {
    const response = await fetch(`${apiURL}${modulePath}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ confirmationId }),
    });

    const data = await response.json() as RestartResponse;

    if (!response.ok) {
      return {
        status: "error",
        error: data.message || "Failed to confirm restart",
      };
    }

    return data;
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Get module examples (for Where I Am Now and other modules)
 */
export const getModuleExamples = async (
  modulePath: string,
): Promise<Record<string, Record<string, string[]>> | null> => {
  try {
    const response = await fetch(`${apiURL}${modulePath}/examples`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as Record<string, Record<string, string[]>>;
  } catch (err) {
    console.error("Failed to fetch module examples:", err);
    return null;
  }
};

/**
 * Get module metadata (domain labels, definitions, etc.)
 */
export const getModuleMetadata = async (
  modulePath: string,
): Promise<
  | {
      domains: {
        keys: string[];
        labels: Record<string, string>;
        definitions: Record<string, string>;
      };
      assessmentColumns: {
        keys: string[];
        questions: Record<string, string>;
        introductions: Record<string, string>;
      };
    }
  | null
> => {
  try {
    const response = await fetch(`${apiURL}${modulePath}/metadata`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Failed to fetch module metadata:", err);
    return null;
  }
};

/**
 * Download module PDF
 */
export const downloadModulePdf = async (
  token: string,
  modulePath: string,
  fileName: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${apiURL}${modulePath}/pdf`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (err) {
    console.error("Failed to download module PDF:", err);
    return false;
  }
};
