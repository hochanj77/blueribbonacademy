import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

const renderStartupError = (error: unknown) => {
  console.error("App bootstrap failed:", error);

  root.render(
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <h1 className="text-xl font-semibold text-foreground">Unable to load app</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The app failed to initialize. Please refresh to try again.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </div>
  );
};

import("./App")
  .then(({ default: App }) => {
    root.render(<App />);
  })
  .catch((error) => {
    console.warn("Primary bootstrap failed, attempting minimal render:", error);
    // Try rendering without the dynamic import wrapper
    try {
      const App = require("./App").default;
      root.render(<App />);
    } catch {
      renderStartupError(error);
    }
  });
