import type { Movie } from "#src/modules/pricing/domain/movie";
import type { MovieTitle } from "#src/modules/pricing/domain/movie-title";

export type CatalogRepository = {
  /** Every title resolves: a title that is not a saga episode is a regular movie. */
  findMovie(title: MovieTitle): Movie;
};
