import type { EuroCents } from "./euro-cents";
import type { MovieTitle } from "./movie-title";

export type SagaEpisode = {
  readonly kind: "saga-episode";
  readonly title: MovieTitle;
  readonly episodeNumber: number;
  readonly unitPrice: EuroCents;
};

export type RegularMovie = {
  readonly kind: "regular-movie";
  readonly title: MovieTitle;
  readonly unitPrice: EuroCents;
};

export type Movie = SagaEpisode | RegularMovie;
