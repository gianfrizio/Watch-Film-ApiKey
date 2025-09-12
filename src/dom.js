// Oggetto che espone funzioni per accedere agli elementi DOM rilevanti.
// Utilizziamo funzioni che leggono gli elementi al momento dell'uso, così
// gli elementi possono essere creati dinamicamente in HTML senza problemi di timing.
export const els = {
  // Contenitore principale dei film (griglia)
  movies: () => document.getElementById('movies'),
  // Contenitore della paginazione
  pagination: () => document.getElementById('pagination'),
  // (precedentemente) sezione teaser popolari - mantenuta come getter ma può essere null
  popular: () => document.getElementById('popular'),
  // Wrapper della sezione popolare
  popularSection: () => document.getElementById('popular-section'),
  // Select per scegliere il genere
  genreSelect: () => document.getElementById('genreSelect'),
  // Input di ricerca
  searchInput: () => document.getElementById('searchInput'),
  // Select per scegliere il filtro (popolari, novità, top rated, upcoming)
  filterSelect: () => document.getElementById('filterSelect'),
  // Template HTML per una card film
  template: () => document.getElementById('movieTemplate'),
};

/**
 * clearChildren
 * Rimuove tutti i figli di un nodo DOM. Utile per svuotare contenitori prima di
 * renderizzare nuovi elementi.
 */
export function clearChildren(node){
  while(node && node.firstChild) node.removeChild(node.firstChild);
}
