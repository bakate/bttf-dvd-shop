import { type CSSVariablesResolver, createTheme } from "@mantine/core";

export const theme = createTheme({
  colors: {
    flux: [
      "#fff3e8",
      "#ffe3cc",
      "#ffc799",
      "#ffa862",
      "#ff8c36",
      "#fb7a1a",
      "#e86a0c",
      "#c45608",
      "#9c4407",
      "#713105",
    ],
    caution: [
      "#fff8e6",
      "#ffefbf",
      "#ffe494",
      "#ffd866",
      "#ffcd3f",
      "#f5b800",
      "#d99d00",
      "#ad7900",
      "#805800",
      "#543900",
    ],
    danger: [
      "#fff1f0",
      "#ffe0dd",
      "#ffc0ba",
      "#ff9d94",
      "#f9786d",
      "#e95b50",
      "#d9483e",
      "#b8322b",
      "#982f28",
      "#74231e",
    ],
    informative: [
      "#edf5ff",
      "#dce8f8",
      "#b8d0ef",
      "#91b6e6",
      "#6fa0de",
      "#578fd9",
      "#4986d7",
      "#3974bf",
      "#2d66ac",
      "#1c5798",
    ],
  },
  primaryColor: "flux",
  // flux.8 reaches 6.5:1 against white, so white button labels and the focus ring meet WCAG AA.
  primaryShade: 8,
  focusRing: "auto",
  respectReducedMotion: true,
  cursorType: "pointer",
  defaultRadius: "md",
  fontFamily: '"Inter Variable", system-ui, sans-serif',
  headings: {
    fontFamily: '"Space Grotesk Variable", "Inter Variable", sans-serif',
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.2" },
    },
  },
});

// Tabler icons take their size as a prop, outside Mantine's spacing scale.
export const iconSizes = { sm: "0.875rem", md: "1.125rem" } as const;

const applicationVariables = {
  // WCAG 1.4.10 (reflow): the layout must hold at a 320 CSS px wide viewport.
  "--mantine-body-min-width": "20rem",
  "--mantine-skip-link-z-index": "1000",
} as const;

// WCAG AA needs 4.5:1 for text: Mantine's dimmed and placeholder grays reach only 3.3:1 and 2.1:1 on white.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: applicationVariables,
  light: {
    "--mantine-color-dimmed": "#646b75",
    "--mantine-color-placeholder": "#6b7280",
  },
  dark: {},
});
