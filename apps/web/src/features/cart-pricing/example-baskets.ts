const EXAMPLE_CARTS = [
  ["Back to the Future 1", "Back to the Future 2", "Back to the Future 3"],
  ["Back to the Future 1", "Back to the Future 3"],
  ["Back to the Future 1"],
  [
    "Back to the Future 1",
    "Back to the Future 2",
    "Back to the Future 3",
    "Back to the Future 2",
  ],
  [
    "Back to the Future 1",
    "Back to the Future 2",
    "Back to the Future 3",
    "La chèvre",
  ],
] as const;

export const EXAMPLE_BASKETS: readonly string[] = EXAMPLE_CARTS.map((titles) =>
  titles.join("\n"),
);
