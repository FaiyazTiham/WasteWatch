# Deploying WasteWatch to Vercel (vercel.app)

This repository is pre-configured for **zero-friction deployment** to [Vercel](https://vercel.com).

---

## 🚀 Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment compatibility"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`WasteWatch`).
   - Leave the **Root Directory** as `./` (the root).
   - Vercel will automatically read `vercel.json` and configure:
     - **Build Command**: `cd client && npm install && npm run build`
     - **Output Directory**: `client/dist`

3. **Configure Environment Variables in Vercel**:
   Under **Settings > Environment Variables**, add:
   - `JWT_SECRET`: A strong secret string (e.g. `wastewatch_jwt_secret_key_2026_super_secure`).
   - *(Optional)* Remote MySQL credentials if using a cloud database (Railway, Aiven, PlanetScale, TiDB):
     - `DB_HOST`: Your cloud database host
     - `DB_USER`: Database user
     - `DB_PASSWORD`: Database password
     - `DB_NAME`: Database name
     - `DB_PORT`: Database port (e.g. `3306`)
   *(If no MySQL database is provided, the backend automatically uses its built-in persistent storage engine loaded from `data_store.json`.)*

4. **Click Deploy**:
   - Vercel will build the frontend assets into `client/dist` and deploy the backend as a Serverless Function at `/api/*`.
   - Your site will be live at `https://your-project.vercel.app`!

---

## ⚡ Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy directly from project root**:
   ```bash
   vercel
   ```
   Follow the CLI prompts (accept defaults).

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🛠️ How It Works Behind the Scenes

- **Unified Routing (`vercel.json`)**:
  - All requests starting with `/api/` are routed to the serverless function in `api/index.js`.
  - Static upload requests to `/uploads/` are served by the backend static handler.
  - All page requests (e.g. `/reports`, `/dashboard`, `/login`) are routed to `index.html`, preserving React Router single-page application navigation.
- **Serverless File System Adaptation**:
  - Vercel's serverless environment has a read-only filesystem except `/tmp`. The backend dynamically switches `data_store.json` and upload buffers to `/tmp` when running on Vercel (`process.env.VERCEL`), eliminating `EROFS` errors.
- **Client Auto-Detection**:
  - `client/src/api/client.js` automatically uses relative `/api` on production (`*.vercel.app`) with SSL, and uses `http://localhost:5000/api` during local development.
