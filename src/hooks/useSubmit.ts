import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { apiURL } from "../utils/exports";
import type { RootState } from "../store/store";
import { toast } from "react-toastify";

type SubmitOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
};

const useSubmit = ({ isAuth = false }: { isAuth?: boolean } = {}) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const submit = useCallback(
    async (
      endpoint: string,
      body?: Record<string, unknown> | FormData,
      options: SubmitOptions = {},
    ) => {
      const { method = "POST" } = options;
      const isFormData = body instanceof FormData;

      setLoading(true);
      setData(null);

      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
        };

        if (!isFormData) {
          headers["Content-Type"] = "application/json";
        }

        if (isAuth && token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
          method,
          headers,
          credentials: "include",
        };

        if (method !== "GET" && method !== "HEAD") {
          fetchOptions.body = isFormData ? body : JSON.stringify(body ?? {});
        }

        const res = await fetch(`${apiURL}${endpoint}`, fetchOptions);
        const json = await res.json();

        if (!res.ok) {
          let errorMsg = "Something went wrong";

          if (json?.message) {
            errorMsg = json.message as string;
          } else if (json?.errors && typeof json.errors === "object") {
            const firstErrorKey = Object.keys(json.errors)[0];
            if (firstErrorKey && Array.isArray(json.errors[firstErrorKey])) {
              errorMsg = json.errors[firstErrorKey][0] as string;
            }
          }

          console.error("Submit API error:", errorMsg);
          toast.error(errorMsg);
          return null;
        }

        setData(json);
        return json;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        toast.error("Submit request failed:");
        console.error("Submit request error:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuth, token],
  );

  return { submit, loading, data };
};

export default useSubmit;
