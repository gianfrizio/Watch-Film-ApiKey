import { fetchGenres, discoverMovies, searchMovies } from './api.js';
import { renderMovies, renderPagination, renderPopular } from './ui.js';
import { attachEvents } from './events.js';
import { els, clearChildren } from './dom.js';

// Stato globale dell'applicazione
// - page e total_pages: paginazione
// - genre: id del genere selezionato (stringa vuota se nessun genere)
// - query: testo di ricerca attivo
// - mode: tipo di filtro attivo (popular, discover, top_rated, upcoming, search)
const state = { page: 1, total_pages: 1, genre: '', query: '', mode: 'popular' };

// Numero di giorni usati per il filtro 'novità' (default 30 giorni)
const RELEASE_WINDOW_DAYS = 30;

/**
 * gotoPage
 * Imposta la pagina corrente (con limite tra 1 e total_pages) e ricarica i film.
 */
function gotoPage(p){
  p = Math.max(1, Math.min(state.total_pages, p));
  state.page = p;
  loadMovies();
}

/**
 * loadGenres
 * Recupera la lista dei generi dall'API e popola la select dei generi.
 */
async function loadGenres(){
  try{
    const data = await fetchGenres();
    const genres = data.genres || [];
    for(const g of genres){
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      els.genreSelect().appendChild(opt);
    }
  }catch(err){
    console.error('Failed loading genres', err);
  }
}

/**
 * loadMovies
 * Funzione centrale che carica i film nella griglia principale in base allo
 * stato corrente (mode, genre, query, page). Gestisce anche la paginazione.
 */
async function loadMovies(){
  // puliamo contenitori prima di renderizzare
  // Evitiamo innerHTML per motivi di sicurezza; usiamo clearChildren
  clearChildren(els.movies());
  clearChildren(els.pagination());
  // (compat) alcuni getter per la sezione 'popular' potrebbero essere null
  const popularContainer = els.popular();
  const popularSection = els.popularSection();
  if (state.mode !== 'popular'){
    if (popularContainer) clearChildren(popularContainer);
    if (popularSection) popularSection.style.display = 'none';
  }
  const q = state.query && state.query.trim();
  try{
    let data;
    if (q){
      // ricerca per titolo
      data = await searchMovies(q, {page: state.page, include_adult: false});
    } else {
      // comportamento diverso a seconda del filtro selezionato
      if (state.mode === 'popular'){
        const params = { page: state.page, sort_by: 'popularity.desc', 'vote_count.gte': 50 };
        if (state.genre) params.with_genres = state.genre;
        data = await discoverMovies(params);
      } else if (state.mode === 'top_rated'){
        const params = { page: state.page, sort_by: 'vote_average.desc', 'vote_count.gte': 50 };
        if (state.genre) params.with_genres = state.genre;
        data = await discoverMovies(params);
      } else if (state.mode === 'upcoming'){
        // mostriamo solo le uscite future (>= oggi) ordinate per data crescente
        const to = new Date();
        const params = {
          page: state.page,
          sort_by: 'primary_release_date.asc',
          'primary_release_date.gte': to.toISOString().slice(0,10),
        };
        if (state.genre) params.with_genres = state.genre;
        data = await discoverMovies(params);
      } else {
        // default: novità nell'ultimo periodo
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - RELEASE_WINDOW_DAYS);
        const params = {
          page: state.page,
          sort_by: 'primary_release_date.desc',
          'primary_release_date.gte': from.toISOString().slice(0,10),
          'primary_release_date.lte': to.toISOString().slice(0,10),
        };
        if (state.genre) params.with_genres = state.genre;
        data = await discoverMovies(params);
      }
    }
  // limitiamo total_pages a 50 per evitare paginazioni troppo lunghe lato UI
  state.total_pages = Math.min(data.total_pages || 1, 50);
    // render principale
    renderMovies(data.results || []);
    renderPagination(state.page, state.total_pages, gotoPage);
    updateFilterIndicator();
  }catch(err){
    console.error('Load movies failed', err);
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Errore nel caricamento dei film.';
    els.movies().appendChild(empty);
  }
}

/**
 * loadPopular
 * Legacy: funzione che popolava la sezione 'popular' separata. Oggi la logica
 * principale usa `loadMovies()` con `mode === 'popular'`, ma lasciamo la
 * funzione per compatibilità o future modifiche.
 */
async function loadPopular(){
  try{
    const params = {
      page: 1,
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
    };
    if (state.genre) params.with_genres = state.genre;
    const data = await discoverMovies(params);
    renderPopular((data.results || []).slice(0,12));
    updateFilterIndicator();
  }catch(err){
    console.error('Load popular failed', err);
    renderPopular([]);
  }
}

/**
 * updateFilterIndicator
 * Aggiorna il piccolo testo che informa l'utente sul filtro attivo e, se
 * presente, il genere selezionato.
 */
function updateFilterIndicator(){
  const el = document.getElementById('filterIndicator');
  if (!el) return;
  if (state.mode === 'search'){
    el.textContent = state.query ? `Filtro: Ricerca — "${state.query}"` : 'Filtro: Ricerca';
    return;
  }
  const sel = document.querySelector('#genreSelect option:checked');
  const genreText = sel && sel.value ? ` — Genere: ${sel.textContent}` : '';
  if (state.mode === 'popular') el.textContent = `Filtro: Popolari${genreText}`;
  else if (state.mode === 'top_rated') el.textContent = `Filtro: Più votati${genreText}`;
  else if (state.mode === 'upcoming') el.textContent = `Filtro: In arrivo${genreText}`;
  else el.textContent = `Filtro: Novità${genreText}`;
}

/**
 * init
 * Collega gli eventi UI e avvia il caricamento iniziale (generi + film).
 */
function init(){
  attachEvents((genre)=>{
    // preserviamo il filtro corrente (popolari/top_rated/upcoming/...) e applichiamo il genere
    state.genre = genre;
    state.page = 1;
    // se cambio genere, rimuovo eventuale ricerca attiva così il genere filtrerà correttamente
    state.query = '';
    els.searchInput().value = '';
    updateFilterIndicator();
    loadMovies();
  }, (q)=>{
    state.query = q; state.page = 1;
    // quando si cerca entriamo in 'search' mode; se si cancella la ricerca, ripristiniamo il filtro selezionato
    if (q){
      state.mode = 'search';
    } else {
      state.mode = (els.filterSelect && els.filterSelect().value) || 'popular';
    }
    updateFilterIndicator();
    loadMovies();
  }, (filter)=>{
    // valori possibili di filter: popular, discover, top_rated, upcoming
    state.mode = filter || 'popular';
    state.page = 1;
    // se cambio filtro, rimuovo eventuale ricerca attiva per evitare conflitti
    state.query = '';
    els.searchInput().value = '';
    updateFilterIndicator();
    loadMovies();
  });

  loadGenres().then(()=>{
    // Carichiamo subito i film nella griglia principale; il mode predefinito è 'popular'.
    state.page = 1;
    loadMovies();
  });
}

// Avvio dell'applicazione
init();
