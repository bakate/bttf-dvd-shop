import type {
  CartPriceControllerPriceError,
  CartPriceControllerPriceResponse,
} from "./generated/api";

type MovieKind = CartPriceControllerPriceResponse["lines"][number]["kind"];

// The screen always sends a well-formed body, so `request/invalid` falls back to the generic message.
type CartProblemType = Exclude<
  CartPriceControllerPriceError["type"],
  "request/invalid"
>;

export const messages = {
  document: {
    title: "Retour en 2000 : boutique DVD et calcul du panier",
    description:
      "Calculez le prix d'un panier de DVD, promotion Back to the Future comprise.",
  },
  app: {
    title: "Retour en 2000",
    tagline: "Tous vos DVD, et des remises sur la saga Back to the Future.",
  },
  skipLink: "Aller au contenu principal",
  errors: {
    unexpected: {
      title: "Erreur inattendue",
      message:
        "Le service a rencontré un problème. Réessayez dans quelques instants.",
    },
    fallbackScreen: {
      title: "L'application a rencontré un problème",
      message:
        "Cet écran n'a pas pu s'afficher. Relancez le calcul : si le problème persiste, rechargez la page.",
      reset: "Revenir au calcul",
    },
  },
  cartPricing: {
    basketLabel: "Panier",
    basketDescription: "Un titre de film par ligne.",
    calculate: "Calculer",
    totalLabel: "Total",
    errors: {
      title: "Calcul impossible",
      byProblemType: {
        "cart/empty":
          "Le panier est vide. Saisissez au moins un titre de film.",
        "cart/too-many-lines":
          "Le panier contient trop de lignes. Retirez des titres, puis recalculez.",
        "cart/line-too-long":
          "Une ligne du panier est trop longue. Vérifiez qu'elle ne contient qu'un titre.",
        "request/too-large":
          "Le panier est trop volumineux. Retirez des titres, puis recalculez.",
      } satisfies Record<CartProblemType, string>,
      fallback: "Le prix du panier n'a pas pu être calculé. Réessayez.",
      serviceNotResponding: {
        title: "Le service ne répond pas",
        message:
          "Le service met du temps à répondre : il est peut-être en train de démarrer. Patientez quelques secondes, puis réessayez.",
        retry: "Réessayer",
      },
    },
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
