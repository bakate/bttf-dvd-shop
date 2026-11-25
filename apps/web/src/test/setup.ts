import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia, which Mantine reads for colour scheme and reduced motion.
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

// jsdom has no FontFaceSet, which Mantine's autosize textarea listens to.
Object.defineProperty(document, "fonts", {
  value: new EventTarget(),
  configurable: true,
});
