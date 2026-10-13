# Hritamm Sarkar - Portfolio

A responsive personal portfolio built with React, TypeScript, Vinext/Vite, Three.js and Recharts. It includes Home, About, Work, Skills, Certificates, Resume and Contact pages, plus a private content studio.

## Features

- Editorial typography, an ivory/charcoal/vermilion palette, individual-letter hover effects and a skippable welcome animation.
- An About page with a personal portrait, education, biography and interests.
- Project detail dialogs and a desktop scroll sequence using real reference photographs; mobile visitors see individual project cards.
- A skills browser with radar and grouped-bar charts showing project disciplines and listed tools.
- A scroll-controlled MacBook showcase that opens and closes to reveal the RetinaScan AI architecture.
- A draggable Earth with animated travel to a detailed West Bengal map and a link to view the map at full size.
- A resume viewer/download, credentials and contact links.
- Responsive layouts and reduced-motion support.

## Run locally

Use Node.js **22.13 or later**.

1. Install dependencies and build the Worker configuration:

   ```sh
   npm ci
   npm run build
   ```

2. Apply the database schema to the local D1 database:

   ```sh
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_redundant_inhumans.sql
   ```

3. Generate credentials for the local studio:

   ```sh
   node scripts/setup-local-studio.mjs
   ```

   A fresh clone needs this step because local credentials are excluded from Git. The password is stored in ignored `.sites-runtime/local-studio-password`, and access instructions are written to ignored `work/private-studio-access.txt`. The script reuses an existing valid password. To regenerate it, remove `.sites-runtime/local-studio-password` and run the script again.

4. Start development:

   ```sh
   npm run dev
   ```

   Open the address printed by the development server. Visit `/admin` and use the generated password to edit content.

If Windows reports a file watcher lock, set `CHOKIDAR_USEPOLLING=true` in the terminal before starting development.

## Content studio and security

The studio edits profile details, biography, education, interests, contact links, skills, projects, credentials and resume files. Content is stored in D1; uploaded PDF, PNG and JPEG files are stored in R2.

Hosted studio access uses Sites platform authentication and a server-side owner check. Local development uses a loopback-only password login with rate limiting and an HttpOnly session cookie. The local login endpoint is available only in development.

The backend validates content, enforces same-origin writes, checks upload sizes and file signatures, and uses revision checks to prevent overwriting concurrent edits. Local passwords, environment files, database state and generated output are excluded from the GitHub backup.

## Validation

Run these checks before publishing changes. The client secret check requires the production build:

```sh
npx tsc --noEmit
npm run test:security
npm run build
npm run check:client-secrets
```

The security tests cover request limits, rate limits, content validation, upload checks and local studio authentication. The client check scans generated browser assets for known credentials and recognizable secret formats without printing secret values.

## Hosting

The current backend targets Cloudflare Workers through Sites, with **D1** bound as `DB`, **R2** bound as `BUCKET`, and trusted platform authentication. Configuration is in `.openai/hosting.json`, `vite.config.ts` and `build/`.

Saving this source to GitHub provides a backup and version history; it does not automatically deploy the website. Deploying the full application on Hostinger requires adapting the Worker runtime, database, file storage and studio authentication to the purchased hosting plan. Uploading static files alone will not provide the protected studio backend.

## Source guide

- `app/portfolio.tsx`, `app/[section]/page.tsx` and `app/navigation.ts`: page layout, routing and navigation.
- `app/about-page.tsx`, `app/resume-page.tsx`, `app/welcome-intro.tsx` and `app/portfolio-sections.tsx`: portfolio pages and interactions.
- `app/project-image.tsx`, `app/macbook.tsx`, `app/scene.tsx` and `app/region-map.tsx`: project photos, laptop showcase, globe and map.
- `app/content.ts`, `app/content-schema.ts`, `app/admin/` and `app/api/`: default content, validation, editing and backend endpoints.
- `build/local-studio-plugin.ts` and `scripts/`: local authentication, framework helpers and validation tools.
- `app/*.css`: visual styling.

## Asset credits

Project images are reference photographs, not screenshots of deployed projects. Creator, source and license links are included in the website's **Image & map credits** and in `app/site-credits.tsx`, `app/project-image.tsx` and `public/map-attribution.txt`. The portrait and resume were supplied by Hritamm Sarkar. The Earth texture comes from the Three.js example assets.

