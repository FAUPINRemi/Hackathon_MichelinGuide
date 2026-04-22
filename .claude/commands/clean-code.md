Analyse et nettoie le code Node.js et React du projet. Applique ces règles sans exception :

## Ce que tu dois supprimer

**Commentaires inutiles (bruit IA)**
- Tout `// commentaire` qui décrit ce que le code fait déjà clairement (`// fetch data`, `// return result`, `// import React`, etc.)
- Les blocs de commentaires multi-lignes qui expliquent l'évident
- Les `/* ... */` de section (`/* Component */`, `/* Helper functions */`, etc.) quand le nommage suffit
- Les commentaires TODOs/FIXMEs déjà résolus ou abandonnés
- Les `console.log` de debug laissés par accident

**À conserver** : les commentaires qui expliquent un *pourquoi* non-évident — contrainte technique, workaround, invariant subtil. Un commentaire qui survit au test "est-ce que le supprimer confondrait un futur lecteur ?" mérite de rester.

## Ce que tu dois corriger

- Variables ou fonctions dont le nom ne reflète pas ce qu'elles font
- Imports inutilisés
- Code mort (branches unreachable, variables jamais lues)
- Valeurs magiques qui devraient être des constantes nommées
- Logique dupliquée évidente dans le même fichier

## Périmètre

Parcours les fichiers modifiés récemment (git status) ou les fichiers ciblés si l'utilisateur en précise.
Pour chaque fichier, montre clairement ce qui est supprimé/modifié et pourquoi.

Ne refactore pas la logique métier, ne change pas les API, ne réorganise pas les dossiers — uniquement le nettoyage.
