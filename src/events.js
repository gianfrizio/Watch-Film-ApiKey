// Gestione degli eventi UI: selezione genere, input di ricerca e select dei filtri.
import { els } from './dom.js';

/**
 * attachEvents
 * - onGenreChange(genreId)
 * - onSearch(query)
 * - onFilterChange(filterValue)
 *
 * Applica i listener agli elementi presenti nella pagina e invoca i callback
 * passati dal codice di inizializzazione (`src/main.js`).
 */
export function attachEvents(onGenreChange, onSearch, onFilterChange){
  // Cambio del genere: invoca il callback con l'id del genere selezionato
  els.genreSelect().addEventListener('change', ()=>{
    onGenreChange(els.genreSelect().value);
  });

  // Debounce per la ricerca: aspettiamo 450ms dall'ultimo input prima di eseguire la ricerca
  let searchTimer = 0;
  els.searchInput().addEventListener('input', ()=>{
    clearTimeout(searchTimer);
    searchTimer = setTimeout(()=>{
      onSearch(els.searchInput().value.trim());
    }, 450);
  });

  // Cambio del filtro (popolari/novità/top_rated/upcoming)
  const filter = els.filterSelect();
  if (filter){
    filter.addEventListener('change', ()=>{
      onFilterChange(filter.value);
    });
  }
}
