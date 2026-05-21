# Engineered Air — Marketing Website

Static marketing site for Engineered Air, built with Vite + Tailwind CSS.

## Quick start

```bash
cd website
npm install
npm run dev      # http://localhost:5174
npm run build    # output to website/dist
npm run preview  # serve the production build
```

## Structure

- `index.html`, `services.html`, `commercial.html`, `about.html`, `contact.html` — pages
- `src/css/main.css` — Tailwind entry + component styles
- `src/js/main.js` — nav toggle, scroll reveal, counters, form handling
- `public/` — favicon, robots, sitemap (served at root)
- `tailwind.config.js`, `vite.config.js`, `postcss.config.js` — build config

## Before going live — things to change

1. **Phone number** — `0191 000 0000` is a placeholder. Find/replace across all `.html` files.
2. **Email** — `info@engineeredair.co.uk` is a placeholder.
3. **Address** — `Unit XX, Newcastle Business Park` is a placeholder.
4. **Company number / F-Gas reg** — in the footer.
5. **Quote form endpoint** — `src/js/main.js` currently just logs to console. Point it at Formspree, Netlify Forms, or your own backend.
6. **Map** — placeholder div on `contact.html`. Replace with a Google Maps embed iframe.
7. **Open Graph image** — add an OG image and reference it in each `<head>`.
8. **Reviews** — testimonials are illustrative; swap for real Google/Trustpilot reviews.

## Deploy

The `dist/` output is a static site — deploys cleanly to Netlify, Vercel, Cloudflare Pages, S3+CloudFront, or any static host. No server required.
