import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { apiURL } from "../utils/exports";

type ModuleAccessStatus = "available" | "locked" | "loading" | "error";

interface ModuleAccessInfo {
  status: ModuleAccessStatus;
  requiredModules?: string[];
  completedModules?: string[];
  error?: string;
}

/**
 * Hook to check module access and enforce prerequisites
 */
export const useModuleAccess = (moduleName: string) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [accessInfo, setAccessInfo] = useState<ModuleAccessInfo>({
    status: "loading",
  });

  const checkAccess = useCallback(async () => {
    if (!token) {
      setAccessInfo({
        status: "locked",
        error: "Not authenticated",
        requiredModules: [],
      });
      return false;
    }

    try {
      // Map frontend module names to backend module names
      const moduleMap: Record<string, string> = {
        "getting-started": "getting-started",
        "where-i-am-now": "whereiam",
        perspective: "perspective",
        surrender: "surrender",
        "my-purpose": "mypurpose",
      };

      const backendModuleName = moduleMap[moduleName] || moduleName;

      const response = await fetch(
        `${apiURL}modules/access-check/${backendModuleName}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          const error = (await response.json()) as {
            requiredModules?: string[];
          };
          setAccessInfo({
            status: "locked",
            error: "Module prerequisites not met",
            requiredModules: error.requiredModules,
          });
          return false;
        }
        throw new Error("Failed to check module access");
      }

      const data = (await response.json()) as {
        isAccessible: boolean;
        completedPrerequisites?: string[];
        requiredPrerequisites?: string[];
      };

      if (data.isAccessible) {
        setAccessInfo({ status: "available" });
        return true;
      } else {
        setAccessInfo({
          status: "locked",
          error: "Module prerequisites not met",
          requiredModules: data.requiredPrerequisites,
          completedModules: data.completedPrerequisites,
        });
        return false;
      }
    } catch (err) {
      setAccessInfo({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return false;
    }
  }, [token, moduleName]);

  // Auto-check access on mount and when moduleName or token changes
  useEffect(() => {
    void checkAccess();
  }, [moduleName, token, checkAccess]);

  return {
    ...accessInfo,
    checkAccess,
    isLocked: accessInfo.status !== "available",
  };
};

export default useModuleAccess;
