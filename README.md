# TapLove

> Wear it. Feel it. Keep it.

An NFC bracelet connected to a private love note portal.

## Repo Structure

```
taplove/
├── frontend/        # Vercel — landing page + bracelet portal UI
├── backend/         # Render — API server
└── README.md
```

## Frontend (Vercel)

The frontend is a static site with vanilla HTML/CSS/JS — no build step required.

### Deploy to Vercel
1. Push this repo to GitHub under the `taploveapp` account
2. Go to vercel.com → New Project → Import `taploveapp/taplove`
3. Set **Root Directory** to `frontend`
4. Add environment variables (see below)
5. Deploy

### Environment Variables (Vercel)
```
VITE_SUPABASE_URL=https://aynzaekgpdyzhfbmmxfx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-render-app.onrender.com
```

## Backend (Render)

Node.js + Express API server.

### Deploy to Render
1. Go to render.com → New Web Service → Connect `taploveapp/taplove`
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `node index.js`
5. Add environment variables (see below)

### Environment Variables (Render)
```
SUPABASE_URL=https://aynzaekgpdyzhfbmmxfx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PORT=3001
```

## Demo
- Landing page: `https://your-app.vercel.app`
- Demo bracelet: `https://your-app.vercel.app/bracelet.html?slug=demo`
- Demo portal: `https://your-app.vercel.app/portal.html` (login: `demo` / `taplove2026`)
