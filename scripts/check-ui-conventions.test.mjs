import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  check,
  GLOBAL_STYLESHEET,
  MESSAGES_FILE,
  rules,
  SOURCE_DIRECTORY,
  THEME_FILE,
} from "./check-ui-conventions.mjs";

const component = `${SOURCE_DIRECTORY}/component.tsx`;

function at(rule, ...lines) {
  return lines.map((line) => `${rule}:${line}`);
}

function assertRules({ file, text, expected }) {
  const found = check([{ file, text }]).map(
    (violation) => `${violation.rule}:${violation.line}`,
  );
  assert.deepEqual(found, expected);
}

describe("check:ui-conventions", () => {
  it("Given a stylesheet other than the global one, when checked, then it is unauthorised", () =>
    assertRules({
      file: `${SOURCE_DIRECTORY}/card.css`,
      text: ".card {}",
      expected: at(rules.unauthorisedStylesheet, 1),
    }));

  it("Given the global stylesheet with Mantine variables and unitless values, when checked, then nothing is reported", () =>
    assertRules({
      file: GLOBAL_STYLESHEET,
      text: "/* top: 1px; */\nh1 > #main {\n  margin: var(--mantine-spacing-md);\n  transform: translateY(-200%)\n}",
      expected: [],
    }));

  it("Given the global stylesheet with raw values and a foreign variable, when checked, then each is reported", () =>
    assertRules({
      file: GLOBAL_STYLESHEET,
      text: "body {\n  min-width: 20rem;\n  color: var(--app-text);\n  margin: var(--mantine-spacing-md, 10px);\n  height: 200px\n}",
      expected: at(rules.rawStyleValue, 2, 3, 4, 5),
    }));

  it("Given a media query in the global stylesheet, when checked, then it is reported", () =>
    assertRules({
      file: GLOBAL_STYLESHEET,
      text: "body {}\n@media (min-width: 40em) {}\n@MEDIA print {}",
      expected: at(rules.mediaQuery, 2, 3),
    }));

  it("Given raw style values in the theme file, when checked, then nothing is reported", () =>
    assertRules({
      file: THEME_FILE,
      text: 'const a = "#ff6a00";',
      expected: [],
    }));

  it("Given raw style values outside the theme, when checked, then each is reported", () =>
    assertRules({
      file: `${SOURCE_DIRECTORY}/layout.ts`,
      text: '"1.5rem";\n"#ff6a00";\n"rgb(0 0 0)";\n"150ms";',
      expected: at(rules.rawStyleValue, 1, 2, 3, 4),
    }));

  it("Given a raw value in a component prop, when checked, then it is reported", () =>
    assertRules({
      file: component,
      text: '<Box\n  w="200px" />',
      expected: at(rules.rawStyleValue, 2),
    }));

  it("Given raw values only as percentages, unitless numbers, comments or anchors, when checked, then nothing is reported", () =>
    assertRules({
      file: component,
      text: '// 320px wide\n<Box w="100%" opacity={0.5} />\n<a href="#cafe" />',
      expected: [],
    }));

  it("Given a message mentioning an order number like #123, when checked, then nothing is reported", () =>
    assertRules({
      file: MESSAGES_FILE,
      text: 'const messages = { order: "Commande #123" };',
      expected: [],
    }));

  it("Given styling through Mantine props, when checked, then no inline style is reported", () =>
    assertRules({
      file: component,
      text: '<Box p="md" className="card" />',
      expected: [],
    }));

  it("Given an inline style prop, when checked, then it is reported", () =>
    assertRules({
      file: component,
      text: "<Box\n  style={{}} />\n<Box style ={{}} />",
      expected: at(rules.inlineStyle, 2, 3),
    }));

  it("Given JSX text that is whitespace or references messages, when checked, then nothing is reported", () =>
    assertRules({
      file: component,
      text: '<p>\n  {messages.total} {total}{" "}\n  {ok ? messages.yes : messages.no}\n  {a === "x" && b}\n  {status === "ready"}\n</p>',
      expected: [],
    }));

  it("Given literal JSX text, when checked, then it is reported", () =>
    assertRules({
      file: component,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the snippet is JSX source under test.
      text: '<p>\n  Taille 12px\n  {"Prix"}\n  {`Remise ${x}`}\n  {ok ? "Oui" : x}\n  {"Total " + x}\n  {ok && "Vide"}\n  {name ?? "Anonyme"}\n  {name || "Anonyme"}\n</p>',
      expected: at(rules.literalJsxText, 2, 3, 4, 5, 6, 7, 8, 9),
    }));

  it("Given text props that reference messages, when checked, then nothing is reported", () =>
    assertRules({
      file: component,
      text: "<TextInput label={messages.label} title={total} />",
      expected: [],
    }));

  it("Given literal text props, when checked, then each is reported", () =>
    assertRules({
      file: component,
      text: '<Input\n  label="Panier"\n  placeholder={"Titre"}\n  aria-label={`Panier`}\n  title={ok ? "a" : "b"}\n/>',
      expected: at(rules.literalTextProp, 2, 3, 4, 5),
    }));

  it("Given generated API client code that breaks the conventions, when checked, then it is skipped", () =>
    assertRules({
      file: `${SOURCE_DIRECTORY}/generated/client.tsx`,
      text: "<p style={{}}>Total</p>",
      expected: [],
    }));

  it("Given a test file that breaks the conventions, when checked, then it is skipped", () =>
    assertRules({
      file: `${SOURCE_DIRECTORY}/app.test.tsx`,
      text: "<p style={{}}>Total</p>",
      expected: [],
    }));
});
