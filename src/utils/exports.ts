export const apiURL = "http://localhost:4000/api/v1/";
export const GOOGLE_CLIENT_ID =
  "423205543558-6uthg6rtlr5ejfc2rl1v9t793pjcg2sp.apps.googleusercontent.com";

export type LifePlanDeliverablesServerData = {
  missionStatement: string;
  visionStatement: string;
  actionPlan: string;
};

export const fetchLifePlanDeliverablesFromServer = async (
  token: string,
): Promise<LifePlanDeliverablesServerData | null> => {
  try {
    const response = await fetch(`${apiURL}modules/life-plan-modules`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      data?: Partial<LifePlanDeliverablesServerData>;
    };

    if (!json.data) {
      return null;
    }

    return {
      missionStatement: json.data.missionStatement || "",
      visionStatement: json.data.visionStatement || "",
      actionPlan: json.data.actionPlan || "",
    };
  } catch {
    return null;
  }
};

export const saveLifePlanDeliverablesToServer = async (
  token: string,
  next: Partial<LifePlanDeliverablesServerData>,
): Promise<boolean> => {
  try {
    const response = await fetch(`${apiURL}modules/life-plan-modules`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(next),
    });

    return response.ok;
  } catch {
    return false;
  }
};

const getFileNameFromContentDisposition = (
  header: string | null,
  fallback: string,
) => {
  if (!header) {
    return fallback;
  }

  const match = header.match(/filename="?([^";]+)"?/i);
  if (!match || !match[1]) {
    return fallback;
  }

  return match[1];
};

export const downloadModulePdfFromServer = async (
  token: string,
  endpoint: string,
  fallbackFileName: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${apiURL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    const fileName = getFileNameFromContentDisposition(
      response.headers.get("content-disposition"),
      fallbackFileName,
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return true;
  } catch {
    return false;
  }
};
