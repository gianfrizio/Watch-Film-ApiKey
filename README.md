# Watch Film — ApiKey

Piccolo sito statico che usa l'API di TheMovieDB per mostrare film, con paginazione, filtro per genere e ricerca per titolo.

Struttura del progetto

- `index.html` — entry HTML che carica `src/main.js` come modulo.
- `src/` — codice suddiviso in moduli: `api.js`, `dom.js`, `ui.js`, `events.js`, `main.js`.
- `CSS/` — foglio di stile `styles.css`.

Config

Questo progetto richiede un file `config.js` alla radice che esporti la tua API key TMDB.

- `config.js` (root) — modulo ES con `export const TMDB_API_KEY = '...';`.

Nota di sicurezza: per facilitare lo sviluppo locale il progetto può includere `config.js` nel repository, ma NON è sicuro committare chiavi sensibili in un repository pubblico. Per deploy in produzione sposta le chiamate API su un backend che nasconda la chiave o utilizza meccanismi di secret management (es. variabili d'ambiente nei workflow CI/CD, servizi di secret manager).

Setup rapido

1. Per creare `config.js` alla radice rapidamente:

```bash
cd /home/gianfrizio/WatchFilmApiKey/Watch-Film-ApiKey
echo "export const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE';" > config.js
```

2. Avvia un server statico (Python è il più semplice):

```bash
cd /home/gianfrizio/WatchFilmApiKey/Watch-Film-ApiKey
python3 -m http.server 8080
# poi apri http://localhost:8080 nel browser
```

Note importanti

- `config.js` è un modulo ES (export). `python3 -m http.server` serve correttamente i moduli per test locali.
- L'API key viene mantenuta nel browser (non sicuro per produzione). Per un deploy pubblico, sposta le chiamate TMDB su un backend che nasconda la chiave.
- L'interfaccia è limitata a 50 pagine per motivi di usabilità; TMDB può però arrivare fino a 500 pagine tecniche per endpoint.

Contribuire

Se vuoi contribuire:

- Apri un issue per idee o bug.
- Fai fork, crea un branch e una pull request.

Licenza

Questo progetto è a scopo didattico
