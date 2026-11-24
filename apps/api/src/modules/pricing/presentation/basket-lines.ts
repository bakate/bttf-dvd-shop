const LINE_BREAK = /\r\n|\r|\n/;

export function splitBasketLines(basket: string): readonly string[] {
  return basket.split(LINE_BREAK);
}
