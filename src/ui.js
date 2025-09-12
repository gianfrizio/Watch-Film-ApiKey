// Funzioni per il rendering dell'interfaccia (card film, lista e paginazione).
import { els, clearChildren } from './dom.js';
import { IMAGE_BASE, fetchMovieVideos } from './api.js';

/**
 * formatDate
 * Ritorna la data in formato leggibile italiano (es. 12/9/2025) o stringa vuota.
 */
export function formatDate(d){
  return d? new Date(d).toLocaleDateString('it-IT') : '';
}

/**
 * createMovieCard
 * Crea una singola card film a partire dall'oggetto film restituito da TMDB.
 * Utilizziamo un template HTML (`<template id="movieTemplate">`) per evitare di
 * scrivere manualmente tutto il markup ogni volta.
 */
export function createMovieCard(m){
  const tpl = els.template().content.cloneNode(true);
  const img = tpl.querySelector('.poster');
  const trailerWrapper = tpl.querySelector('.trailer-wrapper');
  // se presente, usiamo il poster; altrimenti src vuoto
  if (m.poster_path) {
    img.src = IMAGE_BASE + m.poster_path;
    // Aggiungiamo un fallback se l'immagine non si carica
    img.onerror = function() {
      this.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
      this.style.display = 'flex';
      this.style.alignItems = 'center';
      this.style.justifyContent = 'center';
      this.style.color = '#64748b';
      this.style.fontSize = '12px';
      this.style.textAlign = 'center';
      this.innerHTML = 'Immagine<br>non disponibile';
    };
  } else {
    // Nessun poster disponibile
    img.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.style.color = '#64748b';
    img.style.fontSize = '12px';
    img.style.textAlign = 'center';
    img.innerHTML = 'Nessuna<br>immagine';
  }
  img.alt = m.title + ' poster';
  tpl.querySelector('.title').textContent = m.title;
  tpl.querySelector('.date').textContent = formatDate(m.release_date);
  tpl.querySelector('.overview').textContent = m.overview || '';

  // Hover: carica e avvia il trailer (lazy)
  let trailerLoaded = false;
  let iframeEl = null;
  async function loadTrailer(){
    if (trailerLoaded) return;
    trailerLoaded = true;
    try{
      const data = await fetchMovieVideos(m.id);
      const vids = (data.results || []);
      // Preferiamo trailer YouTube
      const yt = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vids.find(v => v.site === 'YouTube');
      if (!yt) return;
      // Creiamo un iframe YouTube con autoplay e muted per riprodurre al passaggio casuale
      const src = `https://www.youtube.com/embed/${yt.key}?autoplay=1&mute=1&rel=0&controls=1&modestbranding=1`;
      iframeEl = document.createElement('iframe');
      iframeEl.src = src;
      iframeEl.width = '320';
      iframeEl.height = '180';
      iframeEl.setAttribute('frameborder','0');
      iframeEl.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
      iframeEl.setAttribute('allowfullscreen','');
      iframeEl.title = `${m.title} - Trailer`;
      iframeEl.className = 'trailer-iframe';
      trailerWrapper.appendChild(iframeEl);
      trailerWrapper.setAttribute('aria-hidden','false');
      // click sul wrapper: proviamo a entrare in fullscreen, altrimenti apriamo YouTube
      const youtubeUrl = `https://www.youtube.com/watch?v=${yt.key}`;
      function onClickWrapper(e){
        e.stopPropagation();
        // preferiamo richiedere il fullscreen sull'iframe
        const el = iframeEl;
        if (el.requestFullscreen){
          el.requestFullscreen().catch(()=>{
            window.open(youtubeUrl, '_blank');
          });
        } else if (el.webkitRequestFullscreen){
          el.webkitRequestFullscreen();
        } else {
          // fallback: apri YouTube
          window.open(youtubeUrl, '_blank');
        }
      }
      trailerWrapper.addEventListener('click', onClickWrapper);
      // rimuoviamo il listener quando scarichiamo il trailer
      const origUnload = unloadTrailer;
      unloadTrailer = function(){
        try{ trailerWrapper.removeEventListener('click', onClickWrapper); }catch(e){}
        if (iframeEl && iframeEl.parentNode) iframeEl.parentNode.removeChild(iframeEl);
        iframeEl = null;
        trailerLoaded = false;
        trailerWrapper.setAttribute('aria-hidden','true');
      };
    }catch(err){
      console.warn('Failed loading trailer for', m.id, err);
    }
  }

  function unloadTrailer(){
    if (iframeEl && iframeEl.parentNode) iframeEl.parentNode.removeChild(iframeEl);
    iframeEl = null;
    trailerLoaded = false; // consentiamo di ricaricare al successivo hover se si vuole
    trailerWrapper.setAttribute('aria-hidden','true');
  }

  // Add hover listeners on the outer article element
  const article = tpl.querySelector('.movie');
  // Ritardo prima di avviare il trailer (ms)
  const TRAILER_DELAY = 750;
  let trailerTimer = null;
  article.addEventListener('mouseenter', ()=>{
    // Impostiamo un ritardo prima di avviare il trailer per evitare riproduzioni accidentali
    trailerTimer = setTimeout(()=>{
      loadTrailer();
      trailerTimer = null;
    }, TRAILER_DELAY);
  });
  article.addEventListener('mouseleave', ()=>{
    // Se l'utente lascia la card prima che il timer scada, cancelliamo l'avvio
    if (trailerTimer){
      clearTimeout(trailerTimer);
      trailerTimer = null;
    }
    // fermiamo/rimuoviamo il trailer se era stato caricato
    unloadTrailer();
  });
  return tpl;
}

/**
 * renderMovies
 * Renderizza una lista di film nella griglia principale. Se la lista è vuota
 * mostra un messaggio di empty state.
 */
export function renderMovies(list){
  const container = els.movies();
  clearChildren(container);
  if (!list || list.length === 0){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Nessun risultato trovato.';
    container.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  for(const m of list){
    frag.appendChild(createMovieCard(m));
  }
  container.appendChild(frag);
}

/**
 * renderPopular
 * (Legacy) renderizza una lista di film in una sezione dedicata "popular".
 * Nota: il progetto può anche mostrare i popolari direttamente nella griglia
 * principale (vedi `loadMovies()`), quindi questa funzione è mantenuta per
 * compatibilità o per mostrare un teaser separato.
 */
export function renderPopular(list){
  const container = els.popular();
  const section = els.popularSection();
  // svuota il contenitore
  clearChildren(container);
  if (!list || list.length === 0){
    // nascondi la sezione se vuota
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  const frag = document.createDocumentFragment();
  for(const m of list){
    // riusiamo il template della card e avvolgiamo in un wrapper per lo styling
    const card = createMovieCard(m);
    const wrapper = document.createElement('div');
    wrapper.className = 'popular-card';
    wrapper.appendChild(card);
    frag.appendChild(wrapper);
  }
  container.appendChild(frag);
}

/**
 * renderPagination
 * Costruisce i bottoni di paginazione e li aggiunge al container.
 * - cur: pagina corrente
 * - total: numero totale di pagine disponibili
 * - gotoPage: callback da chiamare al click su un bottone
 */
export function renderPagination(cur, total, gotoPage){
  const container = els.pagination();
  clearChildren(container);
  function makeBtn(label, page, isActive){
    const b = document.createElement('button');
    b.className = 'page-btn' + (isActive? ' active' : '');
    b.textContent = label;
    b.onclick = ()=> gotoPage(page);
    return b;
  }
  // salto indietro di 10 pagine
  const back10 = Math.max(1, cur-10);
  const forward10 = Math.min(total, cur+10);
  const back10Btn = makeBtn('‹‹', back10, false);
  if (back10 === cur) back10Btn.disabled = true;
  container.appendChild(back10Btn);

  // bottone pagina precedente
  const prevBtn = makeBtn('«', Math.max(1, cur-1), false);
  if (cur === 1) prevBtn.disabled = true;
  container.appendChild(prevBtn);
  const start = Math.max(1, cur-2);
  const end = Math.min(total, cur+2);
  if (start > 1) container.appendChild(makeBtn('1',1,false));
  if (start > 2) container.appendChild(document.createTextNode('...'));
  for(let i=start;i<=end;i++) container.appendChild(makeBtn(i,i,i===cur));
  if (end < total-1) container.appendChild(document.createTextNode('...'));
  if (end < total) container.appendChild(makeBtn(total,total,false));
  // bottone pagina successiva
  const nextBtn = makeBtn('»', Math.min(total, cur+1), false);
  if (cur === total) nextBtn.disabled = true;
  container.appendChild(nextBtn);

  // salto avanti di 10 pagine
  const fwd10Btn = makeBtn('››', forward10, false);
  if (forward10 === cur) fwd10Btn.disabled = true;
  container.appendChild(fwd10Btn);
}
