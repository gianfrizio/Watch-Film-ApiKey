// Import della chiave TMDB dal file di configurazione locale.
// Nota: in un'app di produzione la chiave non dovrebbe essere esposta nel front-end.
import { TMDB_API_KEY as API_KEY } from '../config.js';

// URL base per le chiamate all'API di TheMovieDB.
const BASE = 'https://api.themoviedb.org/3';

// Base URL per le immagini (poster). La dimensione 'w500' è un buon compromesso qualità/size.
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * tmdbFetch
 * Helper per effettuare richieste verso l'API TMDB.
 * - path: percorso relativo (es. '/discover/movie')
 * - params: oggetto con parametri query (vengono aggiunti api_key e language automaticamente)
 * Lancia un errore se la chiave non è presente o se la risposta non è OK.
 */
async function tmdbFetch(path, params = {}){
  if (!API_KEY) throw new Error('Missing API key');
  const url = new URL(BASE + path);
  // Impostiamo lingua italiana per le risposte
  url.search = new URLSearchParams({api_key: API_KEY, language: 'it-IT', ...params});
  let res;
  try{
    res = await fetch(url);
  }catch(err){
    // Errore di rete (DNS, offline, ecc.)
    console.error('Network error fetching', url.href, err);
    throw err;
  }
  if (!res.ok){
    // Leggiamo il body (se possibile) per loggare errori utili al debug
    let bodyText = '';
    try{ bodyText = await res.text(); }catch(e){}
    console.error('TMDB returned non-OK', res.status, url.href, bodyText);
    throw new Error(`TMDB error ${res.status}`);
  }
  // Restituiamo il JSON parsato
  return res.json();
}

/**
 * fetchGenres
 * Recupera la lista dei generi disponibili (id e nome).
 */
export async function fetchGenres(){
  return tmdbFetch('/genre/movie/list');
}

/**
 * discoverMovies
 * Wrapper per l'endpoint /discover/movie che accetta vari filtri
 * (es. sort_by, with_genres, primary_release_date.gte, ecc.).
 */
export async function discoverMovies(params = {}){
  return tmdbFetch('/discover/movie', params);
}

/**
 * searchMovies
 * Cerca film per titolo usando l'endpoint /search/movie.
 * query: stringa di ricerca
 */
export async function searchMovies(query, params = {}){
  return tmdbFetch('/search/movie', {query, ...params});
}

/**
 * fetchMovieVideos
 * Recupera i video (trailer, clip) per un film dato il suo id.
 * Restituisce l'oggetto JSON dell'endpoint /movie/{movie_id}/videos
 */
export async function fetchMovieVideos(movieId){
  if (!movieId) throw new Error('Missing movie id');
  return tmdbFetch(`/movie/${movieId}/videos`);
}
