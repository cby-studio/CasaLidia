# Casa Lidia Disponibilitate Camere

A small static web app for managing availability across 8 bed and breakfast rooms.

## Features

- Monthly and weekly availability calendars
- Romanian-only interface
- Passcode access screen for casual privacy
- Mobile-friendly layout with a minimizable reservation panel
- Eight fixed rooms, including `Casuta`
- Single-day and multi-day bookings
- Tourist details: name, phone number, number of people, and notes
- Red unavailable cells for occupied room dates
- Click an available date to create a booking
- Click an occupied date or upcoming booking to edit it
- Browser local storage persistence
- Small Node backend that stores bookings in `data/bookings.json`
- Export/import backup tools

## Run

Run the backend server:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

No external dependencies are required.

The access screen is intended for casual privacy. For stronger public-site protection, put the app behind platform-level authentication or add server-managed login sessions.

The backend saves reservations in `data/bookings.json`. That file is ignored by git so commits and deploys do not overwrite live reservation data.

By default, the server binds to `127.0.0.1`. Set `HOST=0.0.0.0` only when you intentionally want to expose it beyond your machine.

## Deploy

This repo includes a GitHub Actions workflow that deploys to Cloudflare Workers on every push to `main`.

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_KV_NAMESPACE_ID`

Then every push to `main` will run `npm run check` and deploy with Wrangler.

The `.assetsignore` file keeps `node_modules`, backend files, and data files out of Cloudflare's static asset upload.

The Cloudflare deployment uses a Worker API at `/api/bookings` and stores reservations in the KV namespace bound as `BOOKINGS_KV`.

## Files

- `index.html` - app markup
- `styles.css` - layout and visual design
- `script.js` - booking, calendar, and local storage logic
- `server.js` - small Node backend and static file server
- `src/worker.js` - Cloudflare Worker API for deployed bookings
- `wrangler.jsonc` - Cloudflare Workers deploy configuration
