Analyse la structure des dossiers React du projet et propose — puis applique si confirmé — une réorganisation conforme aux conventions du projet.

## Structure cible (définie dans CLAUDE.md)

```
front/src/
├── api/            # Clients fetch, un fichier par domaine
├── components/
│   ├── cards/      # Cartes d'entités (RestaurantCard, HotelCard…)
│   ├── common/     # Éléments réutilisables sans état métier
│   ├── feedback/   # Toast, banners, loaders
│   ├── filters/    # SearchBar, filtres, grilles de sélection
│   ├── layout/     # Hero, Section, HScroll, Footer
│   └── navigation/ # Nav, BottomNav, Drawer
├── data/           # Données statiques / éditoriales (pas de logique)
├── hooks/          # Hooks React custom (useXxx)
├── pages/          # Vues complètes composant des composants
└── styles/         # tokens.css uniquement
```

## Analyse à effectuer

1. Lister tous les fichiers `.jsx` et `.module.css` existants
2. Identifier ceux qui sont mal placés (ex. un composant card dans `pages/`, un hook dans `components/`)
3. Identifier les fichiers orphelins (`.css` sans `.jsx` associé, ou inversement)
4. Identifier les sous-dossiers manquants ou superflus

## Avant d'agir

Présente le plan de déplacement sous forme de tableau `Fichier actuel → Destination` et demande confirmation.  
Après confirmation : déplace les fichiers, met à jour tous les imports impactés, vérifie qu'aucun import n'est cassé.

Ne touche pas à la logique des composants, uniquement la structure de fichiers.
