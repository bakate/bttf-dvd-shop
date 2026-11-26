import type { CatalogRepository } from "#src/modules/pricing/application/catalog-repository";
import { euroCents } from "#src/modules/pricing/domain/euro-cents";
import { MOVIE_KINDS, type Movie } from "#src/modules/pricing/domain/movie";
import {
  type MovieTitle,
  titleMatchingKey,
} from "#src/modules/pricing/domain/movie-title";

const SAGA_EPISODE_PRICE = euroCents(1500);
const REGULAR_MOVIE_PRICE = euroCents(2000);

const SAGA_EPISODE_TITLES = [
  {
    episodeNumber: 1,
    titles: [
      "Back to the Future 1",
      "Back to the Future",
      "Retour vers le futur 1",
      "Retour vers le futur",
    ],
  },
  {
    episodeNumber: 2,
    titles: [
      "Back to the Future 2",
      "Back to the Future Part II",
      "Retour vers le futur 2",
      "Retour vers le futur II",
    ],
  },
  {
    episodeNumber: 3,
    titles: [
      "Back to the Future 3",
      "Back to the Future Part III",
      "Retour vers le futur 3",
      "Retour vers le futur III",
    ],
  },
] as const;

const episodeNumberByTitleKey = new Map<string, number>(
  SAGA_EPISODE_TITLES.flatMap(({ episodeNumber, titles }) =>
    titles.map((title) => [titleMatchingKey(title), episodeNumber] as const),
  ),
);

export class InMemoryCatalogRepository implements CatalogRepository {
  findMovie(title: MovieTitle): Movie {
    const episodeNumber = episodeNumberByTitleKey.get(title.matchingKey);

    if (episodeNumber === undefined) {
      return {
        kind: MOVIE_KINDS.regularMovie,
        title,
        unitPrice: REGULAR_MOVIE_PRICE,
      };
    }

    return {
      kind: MOVIE_KINDS.sagaEpisode,
      title,
      episodeNumber,
      unitPrice: SAGA_EPISODE_PRICE,
    };
  }
}
