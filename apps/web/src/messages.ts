import type { CartPriceControllerPriceResponse } from "./generated/api";

type MovieKind = CartPriceControllerPriceResponse["lines"][number]["kind"];

export const messages = {
  document: {
    title: "Boutique DVD Retour vers le futur : calcul du panier",
    description:
      "Calculez le prix d'un panier de DVD avec la promotion Retour vers le futur.",
  },
  app: {
    title: "Boutique DVD Retour vers le futur",
  },
  skipLink: "Aller au contenu principal",
  cartPricing: {
    basketLabel: "Panier",
    basketDescription: "Un titre de film par ligne.",
    calculate: "Calculer",
    totalLabel: "Total",
    examples: {
      label: "Exemples du sujet",
      load: (exampleNumber: number) => `Exemple ${exampleNumber}`,
    },
    breakdown: {
      caption: "Détail du prix",
      title: "Titre",
      kind: "Type",
      quantity: "Quantité",
      unitPrice: "Prix unitaire",
      kinds: {
        "saga-episode": "Épisode de la saga",
        "regular-movie": "Film hors saga",
      } satisfies Record<MovieKind, string>,
      sagaSubtotal: "Sous-total saga",
      distinctSagaEpisodeCount: "Épisodes différents",
      discount: (rate: string) => `Remise de ${rate} sur la saga`,
      noDiscount: "Aucune remise",
      regularSubtotal: "Sous-total hors saga",
      total: "Total",
    },
  },
} as const;
