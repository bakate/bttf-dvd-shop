import { useMutation } from "@tanstack/react-query";

import { cartPriceControllerPrice } from "../../generated/api";

export function usePriceCart() {
  return useMutation({
    mutationFn: async (basket: string) => {
      const { data } = await cartPriceControllerPrice({
        body: { basket },
        throwOnError: true,
      });

      return data;
    },
  });
}
