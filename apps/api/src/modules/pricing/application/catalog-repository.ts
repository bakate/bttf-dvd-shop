import type { Movie } from "../domain/movie";
import type { MovieTitle } from "../domain/movie-title";

export type CatalogRepository = {
  /** Every title resolves: a title that is not a saga episode is a regular movie. */
  findMovie(title: MovieTitle): Movie;
};
