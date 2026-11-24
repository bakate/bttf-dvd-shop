import { messages } from "./messages";

export function applyDocumentMetadata(document: Document): void {
  document.title = messages.document.title;

  const description =
    document.querySelector('meta[name="description"]') ??
    document.head.appendChild(document.createElement("meta"));
  description.setAttribute("name", "description");
  description.setAttribute("content", messages.document.description);
}
