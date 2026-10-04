# CalcX – Modern Smart Calculator

A responsive calculator built with plain HTML, CSS and JavaScript. No frameworks, no build step, no network requests.

## Run
Unzip and open `index.html` in any modern browser. (Or serve the folder: `python -m http.server 8080`.)

## Features
- Basic arithmetic, %, ±, delete, live result preview, thousands formatting
- Scientific mode: sin cos tan log ln √ x² xʸ π e ( ) with DEG/RAD toggle
- History (last 50, saved in localStorage): click to reuse, delete one, clear all
- Light/dark theme (follows system, remembers choice)
- Full keyboard support: 0–9 . + - * / ^ % ( ) Enter/= Esc Backspace
- Safe expression parser (no `eval`), handles divide-by-zero, invalid input, huge numbers
- Accessible: semantic HTML, aria labels, live region, focus rings, reduced-motion support
- Responsive from 320px to 1920px; history is a side panel on desktop and a drawer on mobile

## Structure
```
index.html
css/style.css
js/theme.js       theme applied before paint
js/calculator.js  parser + number formatting
js/history.js     localStorage history store
js/app.js         input rules, rendering, events
```
## Deploy
Upload the folder to any static host (Netlify, Vercel, GitHub Pages).
