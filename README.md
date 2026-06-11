# EURAS Product Search

A small Next.js, TypeScript, and Tailwind CSS application for searching products from a EURAS data source.

## Features

- Fetches product data from EURAS
- Responsive product cards with image, name, code, and price
- API-based search with pagination
- Product detail pages
- Loading, empty, and error states

## Requirements

- Node.js 22.13.0 or newer is recommended for the current Next.js toolchain
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

The provided EURAS URL is documentation. The app follows it and uses the documented `eed.php` JSON endpoint. Use your EURAS EED ID locally or in your deployment environment.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

The UI calls local Next.js API routes:

```bash
/api/products?q=HDMI&page=1&perPage=10
/api/products/[id]
```

Those routes call EURAS server-side and return normalized product data to the UI.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Deploying to Vercel

Import this repository into Vercel, then add the same environment variables in the Vercel project settings before deploying.
