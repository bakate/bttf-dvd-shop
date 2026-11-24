import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.querySelector("#app");

if (rootElement === null) {
  throw new Error("Application root element #app not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider />
  </StrictMode>,
);
