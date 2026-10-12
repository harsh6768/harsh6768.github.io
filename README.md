# Harsh Chaurasiya — 3D Portfolio

A single-page portfolio with a Three.js background (wireframe core, orbit rings, starfield), scroll-driven camera, mouse parallax, 3D card tilt and reveal animations. No build step.

## Run locally

Because the page loads ES modules, serve it over HTTP:

```bash
cd harsh-3d-portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Edit content

All text, projects, experience and skills live in [data.js](data.js).

## Deploy

Any static host works: GitHub Pages, Netlify, Vercel or Cloudflare Pages. Point it at the repo root.

Motion is disabled automatically for users with "reduce motion" enabled.
