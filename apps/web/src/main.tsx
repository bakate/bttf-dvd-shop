import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { applyDocumentMetadata } from "./document-metadata";

const rootElement = document.getElementById("app");

if (rootElement === null) {
  throw new Error("Application root element #app not found.");
}

applyDocumentMetadata(document);

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
