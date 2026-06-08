# Loop dashboard

Static React SPA for creators. Decoupled from the backend — talks to the Go API over REST,
typed against `../contract/openapi.yaml`.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

`.env.local` ships with `VITE_USE_MOCK=true`, so dev works without the backend (MSW serves the API).

Simulate states by URL: `/dashboard?mock=pending` (reconnect banner), `/dashboard?mock=loggedOut` (redirects to login).

### Against the live backend

Set `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:8080` in `.env.local`, then `npm run dev`.

## Regenerate the API client

The contract is the source of truth. After it changes:

```bash
npm run gen:api      # writes src/api/schema.d.ts
```

## Env

| var | meaning |
| --- | --- |
| `VITE_API_URL` | backend base URL |
| `VITE_USE_MOCK` | `true` to serve the API from MSW mocks |
