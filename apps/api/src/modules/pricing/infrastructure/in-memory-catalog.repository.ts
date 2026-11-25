import type { CatalogRepository } from "../application/catalog-repository";
import { euroCents } from "../domain/euro-cents";
import { MOVIE_KINDS, type Movie } from "../domain/movie";
import { type MovieTitle, titleMatchingKey } from "../domain/movie-title";

const SAGA_EPISODE_PRICE = euroCents(1500);
const REGULAR_MOVIE_PRICE = euroCents(2000);

const SAGA_EPISODE_NUMBERS = [1, 2, 3] as const;

const episodeNumberByTitleKey = new Map<string, number>(
  SAGA_EPISODE_NUMBERS.map((episodeNumber) => [
    titleMatchingKey(`Back to the Future ${episodeNumber}`),
    episodeNumber,
  ]),
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
