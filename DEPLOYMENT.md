# Deployment Guide - Claude AI Integration

## Problem: CORS (Cross-Origin Resource Sharing)

The Anthropic Claude API **cannot be called directly from the browser** due to CORS restrictions. This is a security feature to prevent API keys from being exposed in client-side code.

## Solution: Backend Proxy

You need a backend server to proxy requests to the Claude API. Here are your options:

---

## Option 1: Deploy to Netlify (Recommended - Easy & Free)

### Steps:

1. **Create a Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with your GitHub account

2. **Deploy Your Repository**
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository: `Chess-Engine`
   - Select branch: `claude/chess-game-simulator-011CUo3PXQp85Y6cbYJaZ4o3`
   - Netlify will auto-detect the `netlify.toml` configuration
   - Click "Deploy site"

3. **Your Site Will Be Live**
   - You'll get a URL like: `https://chess-engine-xyz.netlify.app`
   - The serverless function will automatically handle API calls
   - **No CORS issues!** ✅

### How It Works:
- Your frontend calls `/api/claude-proxy` (same domain)
- Netlify serverless function forwards to Claude API
- API key stays secure on the server

---

## Option 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy (Vercel will handle everything)

---

## Option 3: Local Development Server

For testing locally with a simple Node.js proxy:

```bash
# Create a simple Express proxy server
npm install express cors node-fetch
```

Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/claude', async (req, res) => {
  const { apiKey, prompt } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log('Proxy running on :3001'));
```

Then update the API URL in the code to `http://localhost:3001/api/claude`.

---

## Current Status

- ✅ Frontend code is ready
- ✅ Serverless function is created (`netlify/functions/claude-proxy.ts`)
- ✅ Configuration is set up (`netlify.toml`)
- ⏳ **Needs deployment to Netlify/Vercel to work**

---

## Why This Happens

Browser security prevents:
```
Browser (https://andgly95.github.io) → Claude API (https://api.anthropic.com) ❌
```

Backend proxy allows:
```
Browser → Your Backend → Claude API ✅
```

---

## Quick Start (Recommended)

**Deploy to Netlify in 2 minutes:**
1. Push this code to GitHub
2. Go to Netlify → New Site → Import from Git
3. Select your repo and deploy
4. Done! Your chess coach will work perfectly.

Your API key is sent securely through your backend and never exposed in the browser.
