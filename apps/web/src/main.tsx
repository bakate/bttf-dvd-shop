import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { applyDocumentMetadata } from "./document-metadata";
import { reportError } from "./report-error";

const rootElement = document.getElementById("app");

if (rootElement === null) {
  throw new Error("Application root element #app not found.");
}

applyDocumentMetadata(document);

window.addEventListener("error", (event) => reportError(event.error));
window.addEventListener("unhandledrejection", (event) =>
  reportError(event.reason),
);

createRoot(rootElement, {
  onCaughtError: reportError,
  onUncaughtError: reportError,
  onRecoverableError: reportError,
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
