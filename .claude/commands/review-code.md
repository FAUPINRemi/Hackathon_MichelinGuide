Effectue une relecture critique du code ciblé (fichier, dossier, ou diff git récent). Donne un avis direct, sans complaisance.

## Ce que tu cherches

**Redondances**
- Logique dupliquée entre deux composants ou deux routes
- Fetch identique déclenché à plusieurs endroits sans mise en cache
- CSS identique dans plusieurs `.module.css` qui mériterait un token ou un composant partagé

**Problèmes de qualité**
- Props passées en cascade sur 3+ niveaux (prop drilling) — suggérer une alternative
- `useEffect` avec des dépendances incorrectes ou un fetch qui ne nettoie pas
- État local qui devrait être dérivé (calcul dans le render plutôt que dans un `useState`)
- Composants qui font trop de choses à la fois (fetch + transformation + rendu)

**Cohérence avec les conventions du projet (CLAUDE.md)**
- Couleur hardcodée au lieu d'un token `var(--nom)`
- `font-family` redéfini dans un composant au lieu d'hériter
- Fichier dans le mauvais dossier selon la structure définie
- Commentaire de bruit (description de ce que le code fait déjà)

**Risques**
- Appels API sans gestion d'erreur
- Race conditions dans les fetch (résultats d'une requête précédente qui écrase la suivante)
- Variables d'environnement consommées côté client alors qu'elles ne devraient pas l'être

## Format de sortie

Pour chaque problème trouvé :
```
[SÉVÉRITÉ] Fichier:ligne — Description du problème
→ Suggestion concrète de correction
```

Sévérité : `CRITIQUE` / `IMPORTANT` / `MINEUR` / `STYLE`

Termine par un résumé en 3 lignes : ce qui est bien fait, ce qui est prioritaire à corriger, ce qui peut attendre.
