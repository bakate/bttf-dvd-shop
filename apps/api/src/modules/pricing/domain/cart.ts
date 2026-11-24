import { failure, type Result, success } from "../../../shared/result";
import { type EuroCents, sumEuroCents } from "./euro-cents";
import type { Movie, RegularMovie, SagaEpisode } from "./movie";

export const EMPTY_CART_ERROR_CODE = "cart/empty";

export type EmptyCartError = {
  readonly code: typeof EMPTY_CART_ERROR_CODE;
  readonly message: string;
};

function isSagaEpisode(movie: Movie): movie is SagaEpisode {
  return movie.kind === "saga-episode";
}

function isRegularMovie(movie: Movie): movie is RegularMovie {
  return movie.kind === "regular-movie";
}

function subtotalOf(movies: readonly Movie[]): EuroCents {
  return sumEuroCents(movies.map((movie) => movie.unitPrice));
}

export class Cart {
  private readonly sagaEpisodes: readonly SagaEpisode[];
  private readonly regularMovies: readonly RegularMovie[];

  private constructor(movies: readonly Movie[]) {
    this.sagaEpisodes = movies.filter(isSagaEpisode);
    this.regularMovies = movies.filter(isRegularMovie);
  }

  static create(movies: readonly Movie[]): Result<Cart, EmptyCartError> {
    if (movies.length === 0) {
      return failure({
        error: {
          code: EMPTY_CART_ERROR_CODE,
          message: "The cart has no movie.",
        },
      });
    }

    return success({ value: new Cart(movies) });
  }

  distinctSagaEpisodeCount(): number {
    return new Set(this.sagaEpisodes.map((episode) => episode.episodeNumber))
      .size;
  }

  sagaSubtotal(): EuroCents {
    return subtotalOf(this.sagaEpisodes);
  }

  regularSubtotal(): EuroCents {
    return subtotalOf(this.regularMovies);
  }
}
