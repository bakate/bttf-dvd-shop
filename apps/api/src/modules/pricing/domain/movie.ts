import type { EuroCents } from "./euro-cents";
import type { MovieTitle } from "./movie-title";

export const MOVIE_KINDS = {
  sagaEpisode: "saga-episode",
  regularMovie: "regular-movie",
} as const;

export type SagaEpisode = {
  readonly kind: typeof MOVIE_KINDS.sagaEpisode;
  readonly title: MovieTitle;
  readonly episodeNumber: number;
  readonly unitPrice: EuroCents;
};

export type RegularMovie = {
  readonly kind: typeof MOVIE_KINDS.regularMovie;
  readonly title: MovieTitle;
  readonly unitPrice: EuroCents;
};

export type Movie = SagaEpisode | RegularMovie;
