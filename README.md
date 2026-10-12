# Harsh Chaurasiya — Portfolio

A static portfolio site with one primary design at the root and several alternative designs hosted under `styles/`. All designs read the same content from `data.js`, so you edit your details in one place.

No build step is needed. The pages load ES modules and Three.js from a CDN, so serve them over HTTP.

## Project layout

```
index.html        Primary design (root of the site)
styles.css        Primary design styles
main.js           Primary design script
data.js           Shared content: profile, experience, education, projects, skills
styles/
  index.html      Gallery page listing every design at /styles/
  clay/           Clay design
  glass/          Glassmorphism design
  collage/        Collage design
  planets/        3D planets design
  pixel/          Pixel art design
  retro-vhs/      Retro VHS design
  blueprint/      Blueprint design
  glyph-grid/     Glyph grid design
  liquid-glass/   Liquid glass design
scripts/
  set-primary.sh  Copies one style from styles/ to the root (the primary)
```

Each folder under `styles/` holds one complete design: `index.html`, `styles.css` and `main.js`. Those `main.js` files import `../../data.js`, which is the shared content file.

## Run locally

```bash
cd harsh-3d-portfolio
python3 -m http.server 8000
```

Then open:

- http://localhost:8000 for the primary design
- http://localhost:8000/styles/ for the gallery of all designs
- http://localhost:8000/styles/<name>/ for a single design, for example `/styles/glass/`

## Edit your content

Everything you see on the page comes from [data.js](data.js):

- `profile`: name, location, about text, LinkedIn URL
- `experience`: roles, companies, periods, bullet points
- `education`: schools, degrees, periods, details
- `projects`: name, description, language, stars, GitHub URL, optional live URL
- `skills`: the list shown as chips or in the marquee

Every design picks up these changes on the next page load.

## Change the primary style

The primary design is the one served at the site root. To switch it, copy a style from `styles/` to the root:

```bash
scripts/set-primary.sh glass
```

Valid names are `clay`, `glass`, `collage`, `planets`, `pixel`, `retro-vhs`, `blueprint`, `glyph-grid` and `liquid-glass`. The script copies that style's `index.html`, `styles.css` and `main.js` to the root, and it rewrites the data import path from `../../data.js` to `./data.js`.

After switching, review the change and commit it:

```bash
git diff
git add -A
git commit -m "Set glass as primary style"
git push
```

Commit your current state before running the script, so you can get back to it with `git checkout`.

## Edit a style

Edit the files in its folder under `styles/`. If that style is the primary, also run `scripts/set-primary.sh <name>` again to copy the changes to the root.

## Add a new style

1. Create a folder `styles/<name>/` with an `index.html`, `styles.css` and `main.js`.
2. In that `main.js`, import the shared content with `import { ... } from '../../data.js';`.
3. Add a card for it to `styles/index.html`, next to the other designs.
4. Check it in the browser at `/styles/<name>/`.
5. Optionally, make it primary with `scripts/set-primary.sh <name>`.

## Deploy

The site is plain static files, so any static host works: GitHub Pages, Netlify, Vercel or Cloudflare Pages. Point the host at the repo root.

With GitHub Pages and a repo named `harsh6768.github.io`, the primary is served at `https://harsh6768.github.io`, and the gallery is at `https://harsh6768.github.io/styles/`.

## Accessibility

Every design turns off animation when the visitor has "reduce motion" enabled. Some designs also turn off the 3D scene's pointer effects on touch screens.
