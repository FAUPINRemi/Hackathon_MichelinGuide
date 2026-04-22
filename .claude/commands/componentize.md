Analyse les pages React du projet et identifie les blocs de JSX qui devraient être extraits en composants réutilisables.

## Critères d'extraction

Extraire un bloc en composant si au moins un critère est vrai :
- **Répétition** : le même bloc JSX apparaît dans plusieurs pages ou sections (même avec des props différentes)
- **Taille** : le bloc dépasse ~40 lignes de JSX et représente une unité visuelle cohérente
- **Réutilisabilité** : le bloc pourrait être utilisé dans un autre contexte sans modification de logique
- **Responsabilité** : le bloc gère un état ou un comportement distinct du reste de la page

## Ce qu'il ne faut PAS extraire

- Blocs de 5-10 lignes de JSX basique sans logique
- Blocs qui partagent trop d'état avec le parent (prop drilling excessif à venir)
- Fragments `<>...</>` qui ne représentent pas une unité visuelle

## Procédure

1. Lire chaque fichier dans `front/src/pages/`
2. Pour chaque extraction identifiée, proposer :
   - Nom du composant (PascalCase)
   - Dossier cible (`components/cards/`, `components/layout/`, etc. selon CLAUDE.md)
   - Props nécessaires
   - Justification (quel critère déclenche l'extraction)
3. Afficher le tableau récapitulatif et demander confirmation avant de créer quoi que ce soit
4. Après confirmation : créer le fichier `.jsx` + `.module.css` associé, remplacer le bloc dans la page par l'appel au composant

Respecter les conventions du projet : un `.module.css` par composant, `var(--nom)` pour les couleurs, `font-family: var(--font)` via héritage.
