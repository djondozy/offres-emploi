# Djob

Offres d'emploi au Bénin, rassemblées chaque matin.
Site : https://djondozy.github.io/offres-emploi

Le contenu vient de `data.json`, mis à jour automatiquement.

## Design

Interface en Tailwind CSS (police Inter). Le fichier `styles.css` est déjà compilé :
rien à installer pour publier. Pour modifier le style, éditez `src/input.css` ou les
classes dans `index.html` / `app.js`, puis recompilez :

    npx tailwindcss@3 -c tailwind.config.js -i src/input.css -o styles.css --minify
