# Glossary

The domain vocabulary of the pricing module. Code, tests and docs use these
terms, with no synonyms. The French column is the wording of the UI and the
README.

| Term               | French                   | Meaning                                                                                                                                                                      |
| :----------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Basket**         | Panier (saisie)          | The raw text a clerk sends, one movie title per line. Only the input adapter (`readBasketLines`) reads it.                                                                   |
| **Cart**           | Panier                   | The movies to price, once the basket is read. An immutable value object: it answers its subtotals and distinct episode count.                                                |
| **MovieTitle**     | Titre de film            | A non-blank title, with its whitespace collapsed. Two titles match when they are equal ignoring case.                                                                        |
| **Movie**          | Film                     | A **SagaEpisode** or a **RegularMovie**, as the catalogue resolves a title.                                                                                                  |
| **CartLine**       | Ligne du panier          | A movie and its quantity: the copies of matching titles in the cart, under the title first typed.                                                                            |
| **SagaEpisode**    | Épisode de la saga       | _Back to the Future_ 1, 2 or 3. Costs €15 and is the only movie a discount applies to.                                                                                       |
| **RegularMovie**   | Film hors saga           | Any other title, including _Back to the Future 4_. Costs €20, never discounted.                                                                                              |
| **Catalogue**      | Catalogue                | Resolves a title to a movie and its unit price, behind the `CatalogRepository` port.                                                                                         |
| **DiscountTier**   | Palier de remise         | A minimum number of distinct saga episodes and the **DiscountRate** it unlocks.                                                                                              |
| **DiscountRate**   | Taux de remise           | The fraction taken off the saga subtotal: `0.1` is 10 %.                                                                                                                     |
| **CartPricing**    | Calcul du prix du panier | The pure domain service (`priceCart`, in `cart-pricing.ts`) that prices a cart against the discount tiers and returns a **PriceBreakdown**.                                  |
| **PriceBreakdown** | Détail du prix           | How a priced cart adds up: its cart lines, the saga subtotal, the distinct episode count, the discount rate applied (if any) and amount, the regular subtotal and the total. |
| **EuroCents**      | Centimes d'euro          | An integer amount of euro cents. Every amount in the domain and the API is one, in the single currency `EUR`.                                                                |
