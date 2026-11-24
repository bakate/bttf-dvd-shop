import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

export const SOURCE_DIRECTORY = "apps/web/src";
export const THEME_FILE = `${SOURCE_DIRECTORY}/theme/theme.ts`;
export const GLOBAL_STYLESHEET = `${SOURCE_DIRECTORY}/global.css`;
export const MESSAGES_FILE = `${SOURCE_DIRECTORY}/messages.ts`;

export const rules = {
  unauthorisedStylesheet: "unauthorised-stylesheet",
  rawStyleValue: "raw-style-value",
  mediaQuery: "media-query",
  inlineStyle: "inline-style",
  literalJsxText: "literal-jsx-text",
  literalTextProp: "literal-text-prop",
};

const RAW_STYLE_VALUE =
  /(?<![\w.])\d*\.?\d+(?:px|rem|em|ms)\b|#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const CSS_DECLARATION = /[\w-]+\s*:\s*([^;{}]+)(?=[;}])/g;
const MEDIA_QUERY = /@media\b/gi;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const MANTINE_VARIABLE = /var\(--mantine-[\w-]+\)/g;
const INLINE_STYLE = /\bstyle\s*=\s*\{/g;
const TEXT_PROPS = new Set(["label", "placeholder", "title", "aria-label"]);
const DISPLAYED_TEXT_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

const remedies = {
  [rules.unauthorisedStylesheet]: "a theme token through Mantine props",
  [rules.rawStyleValue]: "a theme token",
  [rules.mediaQuery]: "Mantine responsive props",
  [rules.inlineStyle]: "a theme token through Mantine props",
  [rules.literalJsxText]: "the messages module",
  [rules.literalTextProp]: "the messages module",
};

function isSkipped(file) {
  return (
    file === THEME_FILE ||
    file.startsWith(`${SOURCE_DIRECTORY}/generated/`) ||
    path.basename(file).includes(".test.")
  );
}

function lineAt(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function matchesOf({ text, pattern, rule, lineOf }) {
  return [...text.matchAll(pattern)].map(({ index }) => ({
    rule,
    line: lineOf(index),
  }));
}

function blankComments(css) {
  return css.replace(CSS_COMMENT, (comment) => comment.replace(/[^\n]/g, " "));
}

function usesForeignVariable(value) {
  return value.replace(MANTINE_VARIABLE, "").includes("var(");
}

function checkStylesheet({ file, text, lineOf }) {
  if (file !== GLOBAL_STYLESHEET) {
    return [{ rule: rules.unauthorisedStylesheet, line: 1 }];
  }

  const code = blankComments(text);
  const rawValues = [...code.matchAll(CSS_DECLARATION)]
    .filter(
      ([, value]) => RAW_STYLE_VALUE.test(value) || usesForeignVariable(value),
    )
    .map(({ index }) => ({ rule: rules.rawStyleValue, line: lineOf(index) }));

  return [
    ...rawValues,
    ...matchesOf({
      text: code,
      pattern: MEDIA_QUERY,
      rule: rules.mediaQuery,
      lineOf,
    }),
  ];
}

function containsLiteralText(node) {
  if (node === undefined) {
    return false;
  }
  if (ts.isJsxExpression(node) || ts.isParenthesizedExpression(node)) {
    return containsLiteralText(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return [node.whenTrue, node.whenFalse].some(containsLiteralText);
  }
  if (ts.isBinaryExpression(node)) {
    return (
      DISPLAYED_TEXT_OPERATORS.has(node.operatorToken.kind) &&
      [node.left, node.right].some(containsLiteralText)
    );
  }
  if (ts.isTemplateExpression(node)) {
    const spans = node.templateSpans.map((span) => span.literal);
    return [node.head, ...spans].some((part) => part.text.trim() !== "");
  }
  return (
    (ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
    node.text.trim() !== ""
  );
}

function checkScript({ file, text, lineOf }) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const propName = (node) =>
    ts.isJsxAttribute(node) ? node.name.getText(source) : undefined;
  const isJsxChild = (node) =>
    ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent);
  const isRawStyleValue = (node) =>
    (ts.isStringLiteral(node) || ts.isTemplateLiteralToken(node)) &&
    file !== MESSAGES_FILE &&
    propName(node.parent) !== "href" &&
    RAW_STYLE_VALUE.test(node.text);
  const violations = [];
  const report = (rule, node) =>
    violations.push({ rule, line: lineOf(node.getStart(source)) });
  const visit = (node) => {
    if (isJsxChild(node) && containsLiteralText(node)) {
      report(rules.literalJsxText, node);
    }
    if (
      TEXT_PROPS.has(propName(node)) &&
      containsLiteralText(node.initializer)
    ) {
      report(rules.literalTextProp, node);
    }
    if (isRawStyleValue(node)) {
      report(rules.rawStyleValue, node);
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);

  return violations;
}

const checksByExtension = {
  ".css": checkStylesheet,
  ".tsx": (source) => [
    ...matchesOf({ ...source, pattern: INLINE_STYLE, rule: rules.inlineStyle }),
    ...checkScript(source),
  ],
  ".ts": checkScript,
};

export function check(files) {
  return files
    .filter(({ file }) => !isSkipped(file))
    .flatMap(({ file, text }) => {
      const checkFile = checksByExtension[path.extname(file)];
      const violations = checkFile
        ? checkFile({ file, text, lineOf: (offset) => lineAt(text, offset) })
        : [];
      return violations.map((violation) => ({ file, ...violation }));
    })
    .toSorted(
      (first, second) =>
        first.file.localeCompare(second.file) || first.line - second.line,
    );
}

function listSourceFiles(requested) {
  const files =
    requested.length > 0
      ? requested.map((file) => path.relative(".", file))
      : readdirSync(SOURCE_DIRECTORY, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => path.join(entry.parentPath, entry.name));

  return files.filter((file) => file.startsWith(`${SOURCE_DIRECTORY}/`));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const files = listSourceFiles(process.argv.slice(2));
  const violations = check(
    files.map((file) => ({ file, text: readFileSync(file, "utf8") })),
  );

  for (const { file, line, rule } of violations) {
    console.error(`${file}:${line}: ${rule} — use ${remedies[rule]}`);
  }

  process.exitCode = violations.length > 0 ? 1 : 0;
}
