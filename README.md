# EURAS Product Search

A small Next.js, TypeScript, and Tailwind CSS application for searching products from the EURAS EED API.

## Features

- Real-time search with debounce
- Responsive product cards with image, name, code, and price
- Lazy loading — more results load as you scroll
- Product detail modal
- Loading, empty, and error states

## Requirements

- Node.js 22.13.0 or newer
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your EURAS EED credentials in `.env.local`.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

The UI calls a single local Next.js API route which fetches from EURAS server-side and returns normalized product data:

```
GET /api/products?q=HDMI&page=1&perPage=10
```

## Scripts

```bash
npm run dev    # start development server
npm run build  # production build
npm run lint   # lint
```

## Deploying to Vercel

Import this repository into Vercel, then add the same environment variables from `.env.example` in the Vercel project settings before deploying.
