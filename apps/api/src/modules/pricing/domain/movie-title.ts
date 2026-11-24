const WHITESPACE_RUN = /\s+/g;

function collapseWhitespace(text: string): string {
  return text.trim().replace(WHITESPACE_RUN, " ");
}

export function titleMatchingKey(text: string): string {
  return collapseWhitespace(text).toLowerCase();
}

export class MovieTitle {
  private constructor(
    readonly text: string,
    readonly matchingKey: string,
  ) {}

  static fromLines(lines: readonly string[]): readonly MovieTitle[] {
    return lines
      .map((line) => MovieTitle.fromLine(line))
      .filter((title) => title !== undefined);
  }

  private static fromLine(line: string): MovieTitle | undefined {
    const collapsedText = collapseWhitespace(line);

    if (collapsedText === "") {
      return undefined;
    }

    return new MovieTitle(collapsedText, titleMatchingKey(collapsedText));
  }
}
