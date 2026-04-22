# CLAUDE.md — Le Jeune Guide Michelin

Guide de développement pour ce projet. À lire avant tout ajout de code.

---

## Vue d'ensemble

Application web **Guide Michelin** — PWA mobile-first en React/Vite avec une API Express et une base PostgreSQL. Les données (restaurants et hôtels) sont importées depuis des fichiers JSONL massifs.

```
prj/
├── back/            # API Express (Node.js)
├── front/           # SPA React + Vite
├── bdd/             # Fichiers source de données (.jsonl)
├── docker/          # Dockerfiles + schéma SQL + script d'import
├── env/             # Variables d'environnement
├── docker-compose.yml
└── deploy.sh        # Script de déploiement complet
```

---

## Ajouter un nouveau type de données (BDD)

Toute nouvelle entité suit obligatoirement cette séquence complète :

### 1. Fichier source — `bdd/`

Ajouter le fichier `.jsonl` (une entrée JSON par ligne) dans `bdd/`.  
Nommage : `all_<entités>.jsonl` (ex. `all_spas.jsonl`).

### 2. Schéma SQL — `docker/init.sql`

Ajouter un bloc `CREATE TABLE IF NOT EXISTS` en suivant le style existant :
- Clé primaire `SERIAL PRIMARY KEY` + identifiant `UNIQUE NOT NULL`
- Types JSONB pour les champs imbriqués (city, country, images, etc.)
- Index sur les champs fréquemment filtrés (distinction_score, codes pays, coordonnées)

```sql
CREATE TABLE IF NOT EXISTS spas (
  id              SERIAL PRIMARY KEY,
  spa_id          TEXT UNIQUE NOT NULL,
  name            TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  city            JSONB,
  country         JSONB,
  distinction_score INT,
  ...
);
CREATE INDEX ON spas (distinction_score);
CREATE INDEX ON spas ((country->>'code'));
```

### 3. Script d'import — `docker/import_data.js`

Ajouter un bloc de mapping dans le script existant, en suivant le pattern des restaurants/hôtels :
- Parse ligne par ligne (`readline`)
- Batch de 300 lignes (`BATCH_SIZE`)
- Upsert sur conflit (`ON CONFLICT (spa_id) DO NOTHING`)
- Transformer les champs JSONB avec `JSON.stringify()`

### 4. Route API — `back/routes/`

Créer `back/routes/spas.js` en suivant le modèle de `restaurants.js` :
- `GET /` — liste avec pagination (`page`, `limit`), recherche (`search`), filtres
- `GET /:id` — détail d'un enregistrement
- Fonction `format<Entité>()` pour normaliser les données sortantes

Enregistrer la route dans `back/index.js` :
```js
import spasRouter from './routes/spas.js'
app.use('/api/spas', spasRouter)
```

### 5. Client API — `front/src/api/client.js`

Ajouter les fonctions fetch correspondantes en suivant le pattern `getRestaurants` / `getHotel`.

### 6. Composants front — voir section Frontend ci-dessous

---

## Frontend — Architecture des composants

### Structure des dossiers

```
front/src/
├── api/            # Clients fetch (un fichier par domaine)
├── components/
│   ├── cards/      # Cartes affichant une entité (RestaurantCard, HotelCard…)
│   ├── common/     # Éléments réutilisables sans état métier (MichelinIcon…)
│   ├── feedback/   # Toast, InstallBanner
│   ├── filters/    # SearchBar, DistinctionFilter, CuisineGrid
│   ├── layout/     # Hero, Section, HScroll, Footer, DestinationBanner
│   └── navigation/ # Nav, BottomNav, Drawer
├── data/           # Données statiques/éditoriales (pas de logique métier)
├── hooks/          # Hooks React personnalisés (useToast, useInstallPrompt…)
├── pages/          # Vues complètes (HomePage, RestaurantDetailPage, HotelDetailPage)
└── styles/         # tokens.css uniquement — voir section Design tokens
```

### Conventions de composants

- Un composant = un fichier `.jsx` + un fichier `.module.css` côte à côte
- Nommage PascalCase pour les fichiers et les composants
- Les pages agrègent les composants ; les composants ne connaissent pas les pages
- Pas de state global (pas de Redux/Context) — `useState` + props suffisent
- Les hooks métier (fetch, debounce, etc.) vont dans `hooks/`

### Ajouter un composant

```jsx
// components/cards/SpaCard.jsx
import styles from './SpaCard.module.css'

export default function SpaCard({ spa, onClick }) {
  return (
    <article className={styles.card} onClick={() => onClick(spa)}>
      {/* ... */}
    </article>
  )
}
```

```css
/* components/cards/SpaCard.module.css */
.card { /* utiliser uniquement var(--nom) pour les couleurs */ }
```

---

## Design tokens — `front/src/styles/tokens.css`

**Source unique de vérité** pour toutes les valeurs graphiques.  
Toute couleur, taille ou constante visuelle doit être définie ici et utilisée via `var(--nom)`.

Ne jamais écrire de valeur hexadécimale ou rgba directement dans un `.module.css`.  
Exception tolérée : opacités de blanc sur fond noir (`rgba(255,255,255,0.x)`) spécifiques à un composant.

### Tokens disponibles

| Token | Valeur | Usage |
|---|---|---|
| `--red` | `#c41230` | Rouge Michelin principal |
| `--red-dark` | `#9e0e27` | Rouge hover/actif |
| `--red-tint` | `rgba(196,18,48,0.06)` | Fond léger sélectionné |
| `--black` | `#1a1a1a` | Texte principal |
| `--black-deep` | `#0d0d0d` | Fonds très sombres |
| `--white` | `#ffffff` | Fond/texte inversé |
| `--footer-bg` | `#111111` | Fond du footer |
| `--bg` | `#f2f2f2` | Fond page |
| `--grey-light` | `#f7f7f7` | Fond secondaire |
| `--grey-mid` | `#e5e5e5` | Bordures légères |
| `--grey-text` | `#767676` | Texte secondaire |
| `--grey-dark` | `#444444` | Texte tertiaire |
| `--border` | `#e0e0e0` | Bordures |
| `--green` | `#2d6a2d` | Étoile verte / éco |
| `--green-bg` | `#e8f5e8` | Fond badge éco |
| `--green-bg-alt` | `#e8f0e8` | Fond placeholder carte |
| `--overlay-light` | `rgba(0,0,0,0.35)` | Overlay bouton sur image |
| `--overlay-mid` | `rgba(0,0,0,0.45)` | Overlay héro image |
| `--overlay-heavy` | `rgba(0,0,0,0.50)` | Overlay fond drawer |
| `--font` | `'Helvetica Neue', Arial, sans-serif` | Police principale |
| `--font-serif` | `'Georgia', serif` | Police éditoriale |
| `--radius-card` | `8px` | Arrondi des cartes |
| `--shadow-card` | — | Ombre légère carte |
| `--shadow-md` | — | Ombre hover |
| `--t` | `0.18s ease` | Transition standard |

---

## Typographie — Helvetica Neue

La **police de référence** du projet est **Helvetica Neue**.

- `--font` est défini comme `'Helvetica Neue', Arial, sans-serif`
- Le `body` applique `font-family: var(--font)` — tous les éléments héritent via `inherit`
- Ne jamais redéfinir `font-family` dans un composant sauf pour utiliser `var(--font-serif)` (contexte éditorial)
- `--font-serif` (Georgia) est réservé aux titres éditoriaux (Hero, Section, DestinationBanner, EditorialCard)

### Activer la fonte locale

Si les fichiers `.woff2` Helvetica Neue sont disponibles localement :

1. Placer les fichiers dans `front/public/fonts/` :
   - `HelveticaNeue-Regular.woff2` (weight 400)
   - `HelveticaNeue-Medium.woff2` (weight 500)
   - `HelveticaNeue-Bold.woff2` (weight 700)

2. Décommenter les blocs `@font-face` dans [front/src/index.css](front/src/index.css)

---

## Workflow de développement

### Lancer en local (Docker)

```bash
cp env/.env.example env/.env   # configurer si nécessaire
./deploy.sh                    # build + start + import si BDD vide
```

Services disponibles :
- UI : `http://localhost:5173`
- API : `http://localhost:3000`
- Adminer : `http://localhost:8080`

### Sans Docker (dev rapide)

```bash
# Terminal 1 — API
cd back && npm install && npm run dev

# Terminal 2 — Front
cd front && npm install && npm run dev
```

L'API proxy Vite redirige `/api` → `http://localhost:3000` automatiquement.

---

## Conventions générales

- **Pas de commentaires** sauf si le *pourquoi* est non-évident
- **Pas de `var(--accent)` ou variables fantômes** — uniquement les tokens définis dans `tokens.css`
- **Pas de `App.css`** — ce fichier est du boilerplate Vite non utilisé, ne pas y toucher
- **CSS Modules** pour tout style de composant — jamais de style global dans un `.module.css`
- **Pagination** : limite API plafonnée à 100, offset-based
- **Recherche** : debounce 350ms avant appel API (voir `hooks/`)
- **Responsive** : breakpoint unique à `768px`, mobile-first
