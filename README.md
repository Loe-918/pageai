# 🧠 PageAI — Smart AI Assistant for Every Webpage

> Chrome Extension + FastAPI Backend + Landing Page
> Built to sell: Free + $10/mo Pro plan

## Project Structure

```
pageai/
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/             # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── content/           # Injected page scripts
│   │   ├── content.js
│   │   └── overlay.css
│   ├── background/        # Service worker
│   │   └── service-worker.js
│   └── icons/             # Extension icons (add PNGs)
│
├── backend/               # Python FastAPI Backend
│   ├── main.py           # API server + Claude integration
│   ├── requirements.txt
│   └── .env.example
│
├── landing/               # Product Landing Page
│   ├── index.html
│   └── style.css
│
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY from console.anthropic.com
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### 2. Chrome Extension

```
1. Open chrome://extensions
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Pin the extension to your toolbar
```

### 3. Landing Page

```bash
# Just open in browser or deploy to any static host:
cd landing
python -m http.server 3000
# → http://localhost:3000
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3, Vanilla JS |
| Backend | FastAPI (Python), Claude API |
| AI Model | Claude Haiku (fast, cheap) |
| Landing | Static HTML/CSS |

## Monetization

| Tier | Price | Limit |
|------|-------|-------|
| Free | $0 | 10 uses/day |
| Pro | $10/mo | Unlimited |
| Team | $30/mo | Up to 5 members |

## Deploy to Production

### Backend → Railway.app (free tier)
1. Go to railway.app → New Project → Deploy from GitHub
2. Set root directory to `backend/`
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Get your deployed URL → update `API_BASE` in `extension/popup/popup.js`

### Extension → Chrome Web Store
1. Zip the `extension/` folder
2. Go to Chrome Developer Dashboard
3. Pay $5 one-time registration fee
4. Upload and publish

### Landing → Vercel / Netlify (free)
1. Drag `landing/` folder to netlify.com
2. Done — live in 30 seconds

## Revenue Math

```
100 Free users × 5% conversion = 5 Pro users = $50/mo
500 Free users × 5% conversion = 25 Pro users = $250/mo
2000 Free users × 5% conversion = 100 Pro users = $1000/mo
```

## Next Features (Roadmap)
- [ ] User auth & payment (Stripe)
- [ ] Usage dashboard
- [ ] Firefox support
- [ ] Custom prompt templates
- [ ] PDF export for summaries
- [ ] Slack/Discord integration

---

Built by Liam | [GitHub](https://github.com/Loe-918)
