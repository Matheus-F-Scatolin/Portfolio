# Matheus Ferracciú Scatolin | Portfolio

Personal site of an AI engineer and researcher. Live at [matheus-scatolin.vercel.app](https://matheus-scatolin.vercel.app).

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS 3 and framer-motion 12. Native scrolling only; no smooth-scroll library.

## Design

- A white page with dark "stage" panels, one accent color (`--signal`), Schibsted Grotesk for text and IBM Plex Mono for metadata.
- Motion is restrained: a short white intro curtain (once per session), masked line reveals in the hero, heading wipes, and one scroll set piece.
- **Graph of Work** (`components/graph/`): a pinned section that runs a small Graph-RAG pipeline on the site's own profile. Real lines from `public/llms.txt` appear, entities are highlighted, the highlights become nodes of a knowledge graph, and a question is answered by walking it, with citations to llms.txt line numbers. Phones and reduced-motion users get the same chapters as static figures.
- Everything respects `prefers-reduced-motion`.

## Content

`public/llms.txt` is the Master Profile and the single source of truth for facts. `lib/profile.ts` mirrors the facts the homepage renders. Update llms.txt first, then `lib/profile.ts`. Never invent metrics.

## Structure

```
app/
  layout.tsx            fonts, metadata, intro curtain script
  page.tsx              homepage composition
  projects/*/page.tsx   case studies (STELLAR, KernelNet, Brain MRI Pipeline)
components/
  Nav.tsx               floating nav, flips to dark over data-surface="dark"
  IntroCurtain.tsx      white intro curtain (CSS only)
  home/                 Hero, Proof, SelectedWork, Experience, Research, SiteFooter
  graph/                Graph of Work (data, SVG figure, scroll choreography)
  ui/                   Reveal, SectionHeading
  CaseStudy.tsx         case study building blocks
lib/
  profile.ts            facts rendered on the homepage
  motion.ts             shared easing curves and durations
public/
  llms.txt              agent-readable Master Profile
  portrait.jpg, gallery/, previews/
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build && npm start`.
