import { Link } from "react-router-dom";

interface ModuleGatingBlockProps {
  moduleName: string;
  requiredModules: string[];
  onRetry?: () => void;
}

/**
 * Component to display when a module is locked due to unmet prerequisites
 */
const ModuleGatingBlock = ({
  moduleName,
  requiredModules,
  onRetry,
}: ModuleGatingBlockProps) => {
  const moduleLabels: Record<string, string> = {
    "getting-started": "Getting Started",
    "where-i-am-now": "Where I Am Now",
    "whereiam": "Where I Am Now",
    "perspective": "Perspective",
    "surrender": "Surrender",
    "my-purpose": "My Purpose",
    "mypurpose": "My Purpose",
  };

  const moduleRoutes: Record<string, string> = {
    "getting-started": "/getting-started",
    "where-i-am-now": "/where-i-am-now",
    "whereiam": "/where-i-am-now",
    "perspective": "/perspective",
    "surrender": "/surrender",
    "my-purpose": "/my-purpose",
    "mypurpose": "/my-purpose",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          background: "white",
          border: "2px solid #f0ad4e",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "20px",
          }}
        >
          🔒
        </div>

        <h2
          style={{
            color: "#333",
            marginBottom: "15px",
            fontSize: "1.5rem",
          }}
        >
          Module Locked
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "20px",
            fontSize: "0.95rem",
            lineHeight: "1.6",
          }}
        >
          The <strong>{moduleName}</strong> module is not yet available. To
          proceed, please complete the following module(s) first:
        </p>

        <div
          style={{
            background: "#f9f9f9",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "25px",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {requiredModules.map((module, index) => (
              <li
                key={index}
                style={{
                  padding: "8px 0",
                  borderBottom: index < requiredModules.length - 1 ? "1px solid #eee" : "none",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>✓ {moduleLabels[module] || module}</span>
                <Link
                  to={moduleRoutes[module] || "/dashboard"}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#0c7793",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#0a5a73")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#0c7793")
                  }
                >
                  Go to {moduleLabels[module] || "Module"}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <Link
            to="/dashboard"
            style={{
              padding: "10px 24px",
              backgroundColor: "#0916308",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "0.95rem",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = "0.9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = "1")
            }
          >
            Back to Dashboard
          </Link>

          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: "10px 24px",
                backgroundColor: "#f5f5f5",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.opacity = "0.8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.opacity = "1")
              }
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleGatingBlock;
