# MongoVista

MongoVista is a modern full-stack app to explore MongoDB databases with a clean UI.
It provides a fast workflow to save connections, browse databases/collections, and inspect documents in a paginated table.

## Features

- Save, test, connect, and delete MongoDB connections
- Browse databases and collections in a sidebar explorer
- View documents with pagination and dynamic columns
- Built-in JSON rendering for nested values
- Lightweight local persistence (SQLite) for saved connections

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database drivers/storage:** MongoDB Node Driver + better-sqlite3

## Project Structure

```text
mongo-viewer/
  client/   # React + Vite frontend
  server/   # Express API + SQLite + MongoDB integration
```

## Prerequisites

- Node.js 20+
- npm 10+
- Access to a MongoDB instance

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3009
VITE_API_PROXY_TARGET=http://localhost:3009
```

- `PORT`: backend API port
- `VITE_API_PROXY_TARGET`: Vite dev proxy target for `/api` requests

## Installation

Install dependencies for both apps:

```bash
cd client && npm install
cd ../server && npm install
```

## Run in Development

Start backend:

```bash
cd server
npm run dev
```

Start frontend (new terminal):

```bash
cd client
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- API health: `http://localhost:3009/api/health`

## Run on a Different Backend Port

You can override the backend port with flags:

```bash
cd server
npm run dev -- --port 3010
```

Then set/update:

```env
VITE_API_PROXY_TARGET=http://localhost:3010
```

Restart the frontend after changing env values.

## Access from Another Device in the Same Network

Run Vite with host binding:

```bash
cd client
npm run dev -- --host 0.0.0.0 --port 5173
```

Then open `http://<YOUR_LOCAL_IP>:5173` from another device on the same network.

## Scripts

### Client

- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build

### Server

- `npm run dev` - start API in watch mode
- `npm start` - start API normally

## Notes

- Do not commit your real `.env` file (already ignored by `.gitignore`).
- If native module issues happen with SQLite, run:

```bash
cd server
npm rebuild better-sqlite3
```

## License

MIT (or your preferred license).
