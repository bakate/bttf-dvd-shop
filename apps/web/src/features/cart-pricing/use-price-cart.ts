import { useMutation } from "@tanstack/react-query";

import { cartPriceControllerPrice } from "../../generated/api";

export function usePriceCart() {
  return useMutation({
    mutationFn: async (basket: string) => {
      const { data } = await cartPriceControllerPrice({
        // Node's fetch, used by the screen tests, rejects relative URLs.
        baseUrl: window.location.origin,
        body: { basket },
        throwOnError: true,
      });

      return data;
    },
  });
}
