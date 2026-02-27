# Manual Setup Checklist — Things YOU Must Do

**Product Name:** BioSync: Human Performance & Recovery Engine  
**Purpose:** This document lists **every action that requires your manual intervention** before, during, and between the automated implementation phases. Follow this sequentially alongside the Master Implementation Plan so the code agent never hits a blocking error.

---

## Before You Start — Prerequisites to Install on Your Machine

These tools must be installed and accessible from your terminal **before** handing anything to the implementation agent.

### Required Software

| Tool | Minimum Version | Why It's Needed | How to Verify |
|---|---|---|---|
| **Node.js** | 20.x or later | Runs the Next.js frontend | `node --version` |
| **npm** | 10.x (ships with Node) | Installs frontend packages | `npm --version` |
| **Python** | 3.13+ | Runs the ML backend | `python --version` |
| **pip** | Latest | Installs Python packages | `pip --version` |
| **Git** | Any | Version control | `git --version` |
| **Docker** *(optional)* | 24.x+ | Containerise the backend | `docker --version` |

### Installation Links (if you don't have them)

| Tool | Download |
|---|---|
| Node.js | https://nodejs.org/en/download (pick the LTS or Current 22.x+) |
| Python 3.13 | https://www.python.org/downloads/ — **IMPORTANT:** During the Windows installer, check the box that says **"Add Python to PATH"** |
| Docker Desktop | https://www.docker.com/products/docker-desktop/ |
| Git | https://git-scm.com/downloads |

### Quick Verification Command (Run This in PowerShell)

```powershell
node --version; npm --version; python --version; pip --version; git --version
```

If any command says "not recognized", that tool is not installed or not on your PATH. Fix it before proceeding.

---

## Phase 1 — Environment Setup: Your Manual Steps

### 1A — Open Your Terminal in the Right Folder

Every command in the implementation plan assumes you're starting from the project root:

```
c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects
```

Open PowerShell, then run:

```powershell
cd "c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects"
```

Stay here unless a step explicitly tells you to `cd` somewhere.

---

### 1B — Create the Backend Directory Structure

The implementation agent will write files, but the **folders** need to exist first. Run this yourself:

```powershell
# Create all backend folders in one shot
New-Item -ItemType Directory -Force -Path backend\app\routes
New-Item -ItemType Directory -Force -Path backend\app\models
New-Item -ItemType Directory -Force -Path backend\app\core
New-Item -ItemType Directory -Force -Path backend\ml\data
New-Item -ItemType Directory -Force -Path backend\ml\artifacts
```

---

### 1C — Scaffold the Next.js Frontend (YOU Run This, Not the Agent)

The `create-next-app` CLI is interactive — it asks questions. The agent cannot run it for you.

```powershell
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

**If it asks you questions interactively, answer them as follows:**

| Question | Answer |
|---|---|
| Would you like to use TypeScript? | **Yes** |
| Would you like to use ESLint? | **Yes** |
| Would you like to use Tailwind CSS? | **Yes** |
| Would you like your code inside a `src/` directory? | **No** |
| Would you like to use App Router? | **Yes** |
| Would you like to use Turbopack? | **Yes** |
| What import alias would you like? | `@/*` |

After it finishes, verify the `frontend/` folder exists with a `package.json` inside it.

---

### 1D — Install Frontend Dependencies (YOU Run This)

```powershell
cd frontend
npm install framer-motion recharts
```

Then go back to root:

```powershell
cd ..
```

---

### 1E — Create the Python Virtual Environment (YOU Run This)

```powershell
cd backend
python -m venv .venv
```

**Activate it (Windows PowerShell):**

```powershell
.\.venv\Scripts\Activate.ps1
```

> **Common Error:** If you get a red error about "execution policy", run this first and try again:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**Verify activation** — your prompt should now show `(.venv)` at the beginning:

```
(.venv) PS C:\Users\Lenovo\...\backend>
```

---

### 1F — Install Python Dependencies (YOU Run This)

With the venv activated:

```powershell
pip install fastapi "uvicorn[standard]" scikit-learn xgboost pandas numpy imbalanced-learn joblib pydantic
```

**Verify the critical packages installed correctly:**

```powershell
python -c "import sklearn; print(sklearn.__version__)"
python -c "import xgboost; print(xgboost.__version__)"
python -c "import fastapi; print(fastapi.__version__)"
```

All three should print a version number without errors.

Go back to root:

```powershell
cd ..
```

---

## Phase 2 — Data & ML: Your Manual Steps

### 2A — Generate the Synthetic Dataset (YOU Run This)

After the agent writes `backend/ml/generate_data.py`, you must execute it:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m ml.generate_data
```

**What to check:** The file `backend\ml\data\biometric_data.csv` should now exist. Open it and confirm:
- It has ~1500 rows
- It has columns like `resting_heart_rate`, `hrv_ms`, `sleep_hours`, `steps`, `active_calories`, `readiness_label`
- Some cells are empty (NaN) — this is intentional for CO1 imputation

---

### 2B — Train All ML Models (YOU Run This)

After the agent writes `backend/ml/train.py`, you must execute the full training pipeline:

```powershell
# Make sure you're still in backend/ with venv activated
python -m ml.train
```

**This will take 2–10 minutes** (the GridSearchCV step tries many hyperparameter combinations).

**What to watch for in the console output:**

| Message You Should See | Meaning |
|---|---|
| `[CO1] Class distribution after SMOTE: {...}` | SMOTE worked — classes are balanced |
| `[CO2] PCA components retained: X` | PCA compressed features |
| `[CO3] Best classifier: SVM (ROC-AUC: 0.XX)` | Classification trained & evaluated |
| `[CO4] Regression Results: MAE: XX, RMSE: XX` | Regression trained & evaluated |
| `[CO5] Best XGBoost params: {...}` | GridSearch found optimal hyperparameters |
| `[CO6] Optimal k: X (Silhouette: 0.XX)` | Clustering completed |
| `✅ Training pipeline complete.` | Everything saved |

**What to check after training:**

```powershell
Get-ChildItem backend\ml\artifacts\
```

You must see these 5 files:

```
preprocessing_pipeline.pkl
classifier_model.pkl
regressor_model.pkl
clusterer_model.pkl
training_metrics.json
```

If any file is missing, training failed somewhere — read the error in the console.

---

### 2C — Validate the KPI Targets (YOU Check This)

Open `backend\ml\artifacts\training_metrics.json` and check:

```powershell
Get-Content backend\ml\artifacts\training_metrics.json | ConvertFrom-Json | Format-List
```

Or just open it in VS Code. Verify:

| Metric | Where to Find It | Target |
|---|---|---|
| ROC-AUC | `classification.roc_auc` | Must be **> 0.75** |
| Silhouette Score | `clustering.silhouette_score` | Must be **> 0.5** |
| R² Score | `regression.r2` | Should be **> 0.8** (ideally > 0.9) |

**If ROC-AUC < 0.75:** Tell the agent to adjust the readiness score formula boundaries in `generate_data.py` to make the three classes more separable, then re-run Steps 2A and 2B.

**If Silhouette < 0.5:** Tell the agent to modify the data generation to create more distinct behavioral patterns, then re-run Steps 2A and 2B.

---

## Phase 3 — API: Your Manual Steps

### 3A — Start the Backend Server (YOU Run This)

After the agent writes all API files:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**What to check:**
- Console should print: `✅ All models and metrics loaded successfully.`
- Console should print: `Uvicorn running on http://0.0.0.0:8000`

**Leave this terminal running.** Open a new terminal for the next steps.

---

### 3B — Test the API Works (YOU Run This)

Open a **second PowerShell terminal** and run:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method GET
```

Expected output: `status: healthy, models_loaded: True`

Then test the prediction endpoint:

```powershell
$body = @{
    resting_heart_rate = 62
    hrv_ms = 48
    sleep_hours = 6.5
    deep_sleep_pct = 18.0
    rem_sleep_pct = 22.0
    steps = 9200
    active_minutes = 45
    stress_score = 55
    spo2_pct = 97.0
    body_temp_deviation = 0.1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/predict" -Method POST -Body $body -ContentType "application/json"
```

You should see a response with `readiness_classification_state`, `predicted_expenditure_value`, `assigned_biometric_cluster`, etc.

**If you get a 500 error:** Check the first terminal for the Python traceback and share it with the agent.

---

## Phase 4 — Frontend: Your Manual Steps

### 4A — Create the Environment Variable File (YOU Do This)

Create the file `frontend\.env.local` with this exact content:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

You can do this from PowerShell:

```powershell
Set-Content -Path "frontend\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1"
```

---

### 4B — Check Tailwind v4 Syntax (YOU Verify This)

After the agent modifies `frontend/app/globals.css`, open it and make sure it starts with:

```css
@import "tailwindcss";
```

**NOT** the old v3 syntax:

```css
/* WRONG — this is v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If it still has v3 syntax, tell the agent to fix it.

---

### 4C — Check Font Availability (YOU Verify This)

After the agent writes `frontend/app/layout.tsx`, start the dev server and check the browser console:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000` in Chrome. Press `F12` → Console tab.

- If you see a red error like **"Failed to load font: Instrument_Serif"**, the font isn't available on Google Fonts for `next/font`. Tell the agent to switch to a `<link>` tag approach instead.
- If no font errors appear, you're good.

---

## Phase 5 — Integration: Your Manual Steps

### 5A — Run Both Servers Simultaneously (YOU Do This)

You need **two separate terminals** running at the same time:

**Terminal 1 — Backend:**

```powershell
cd "c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects\backend"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd "c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects\frontend"
npm run dev
```

Both must be running before you open the browser.

---

### 5B — Full End-to-End Test (YOU Do This)

Open `http://localhost:3000` in your browser. Then test these three scenarios:

**Scenario 1 — Healthy Athlete:**

| Slider | Value |
|---|---|
| Resting Heart Rate | 50 |
| HRV | 90 |
| Sleep | 9 hrs |
| Deep Sleep | 28% |
| REM Sleep | 25% |
| Steps | 15000 |
| Active Minutes | 90 |
| Stress | 20 |
| SpO₂ | 99% |
| Temp Deviation | 0 |

Click "Synthesize Vitals" → Should show **"Optimal Readiness"** in **green**.

**Scenario 2 — Average Day:**

| Slider | Value |
|---|---|
| Resting Heart Rate | 70 |
| HRV | 45 |
| Sleep | 6 hrs |
| Deep Sleep | 15% |
| REM Sleep | 18% |
| Steps | 6000 |
| Active Minutes | 30 |
| Stress | 55 |
| SpO₂ | 97% |
| Temp Deviation | 0.2 |

Click → Should show **"Moderate Strain"** in **amber/yellow**.

**Scenario 3 — Burnout Risk:**

| Slider | Value |
|---|---|
| Resting Heart Rate | 95 |
| HRV | 20 |
| Sleep | 3.5 hrs |
| Deep Sleep | 6% |
| REM Sleep | 11% |
| Steps | 1500 |
| Active Minutes | 5 |
| Stress | 92 |
| SpO₂ | 92% |
| Temp Deviation | 1.2 |

Click → Should show **"High Risk of Burnout"** in **rose/pink**.

---

### 5C — Visual Checklist (YOU Verify These in the Browser)

| What to Look For | Where | Pass? |
|---|---|---|
| Animated gradient background slowly moving | Behind all cards | ☐ |
| Bento cards slide up with a spring effect on page load | All 4 widgets | ☐ |
| Cards have frosted glass (blurred, semi-transparent) | All cards | ☐ |
| Hovering a card produces a subtle 3D tilt | Try hovering | ☐ |
| Readiness number counts up from 0 | Readiness Oracle | ☐ |
| Calorie number counts up from 0 | Energy Forecast | ☐ |
| Area chart draws itself in (animated line) | Energy Forecast | ☐ |
| Scatter plot shows colored clusters | Cluster Archetype | ☐ |
| ROC-AUC badge visible on Readiness card | Bottom of card | ☐ |
| RMSE badge visible on Energy card | Top-right of card | ☐ |
| Silhouette badge visible on Cluster card | Bottom of card | ☐ |
| "Synthesize Vitals" button pulses while loading | Input panel | ☐ |
| Card colors flash green/amber/rose on result | Border/text | ☐ |

---

### 5D — Docker Build (Optional but Recommended — YOU Run This)

If you want the Docker containerised backend:

```powershell
cd "c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects\backend"
docker build -t biosync-backend .
docker run -p 8000:8000 biosync-backend
```

Then test:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method GET
```

---

## Common Errors & How to Fix Them

| Error | Cause | Fix |
|---|---|---|
| `python: command not found` | Python not on PATH | Reinstall Python and check "Add to PATH" |
| `ModuleNotFoundError: No module named 'sklearn'` | venv not activated or packages not installed | Run `.\.venv\Scripts\Activate.ps1` then `pip install -r requirements.txt` |
| `CORS error` in browser console | Backend not allowing frontend origin | Check `CORS_ORIGINS` in `backend/app/core/config.py` includes `http://localhost:3000` |
| `fetch failed` / `ERR_CONNECTION_REFUSED` on frontend | Backend server not running | Start it: `uvicorn app.main:app --reload --port 8000` |
| `422 Unprocessable Entity` from API | Input validation failed (e.g., negative sleep) | Check slider min/max values match Pydantic schema ranges |
| `FileNotFoundError: .pkl` on server start | Models not trained yet | Run `python -m ml.generate_data` then `python -m ml.train` |
| `execution policy` error activating venv | PowerShell security policy | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `Port 8000 already in use` | Another process on that port | Kill it: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force` |
| `Port 3000 already in use` | Another Next.js / React app running | Kill it or use `npm run dev -- -p 3001` |
| Tailwind styles not applying | v3 syntax in globals.css | Replace with `@import "tailwindcss";` |
| Fonts not loading | `next/font/google` doesn't have that font | Switch to a `<link>` tag in `<head>` |
| Charts not rendering | Recharts SSR issue in Next.js | Ensure Recharts components are in `'use client'` files |

---

## Execution Order — The Exact Sequence YOU Follow

```
Step  Action                                       Who Does It?
───── ──────────────────────────────────────────── ──────────────
 1    Install Node.js, Python, Docker, Git          YOU
 2    Run create-next-app (Step 1C)                 YOU
 3    Install framer-motion + recharts (Step 1D)    YOU
 4    Create Python venv + install deps (1E, 1F)    YOU
 5    Tell agent to write all backend files          AGENT
 6    Run generate_data.py (Step 2A)                YOU
 7    Run train.py (Step 2B)                        YOU
 8    Check training_metrics.json (Step 2C)         YOU
 9    Tell agent to write all API files              AGENT
10    Start backend server (Step 3A)                YOU
11    Test API with PowerShell (Step 3B)            YOU
12    Create .env.local (Step 4A)                   YOU
13    Tell agent to write all frontend files         AGENT
14    Verify Tailwind v4 syntax (Step 4B)           YOU
15    Start frontend dev server (Step 4C)           YOU
16    Check font loading in browser console          YOU
17    Run all 3 test scenarios (Step 5B)            YOU
18    Walk through visual checklist (Step 5C)       YOU
19    Docker build (optional) (Step 5D)             YOU
```

---

## Quick Reference — Every Command You'll Run, In Order

```powershell
# === PHASE 1: SETUP ===
cd "c:\Users\Lenovo\AKSHAT\PROJECTS\PROMPT BASED\CSE274 Projects"

# Create backend folders
New-Item -ItemType Directory -Force -Path backend\app\routes
New-Item -ItemType Directory -Force -Path backend\app\models
New-Item -ItemType Directory -Force -Path backend\app\core
New-Item -ItemType Directory -Force -Path backend\ml\data
New-Item -ItemType Directory -Force -Path backend\ml\artifacts

# Scaffold frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack

# Install frontend extras
cd frontend
npm install framer-motion recharts
cd ..

# Create Python venv
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi "uvicorn[standard]" scikit-learn xgboost pandas numpy imbalanced-learn joblib pydantic
cd ..

# === PHASE 2: DATA & ML (after agent writes the files) ===
cd backend
.\.venv\Scripts\Activate.ps1
python -m ml.generate_data
python -m ml.train
Get-ChildItem ml\artifacts\
Get-Content ml\artifacts\training_metrics.json
cd ..

# === PHASE 3: API TEST (after agent writes API files) ===
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# (in a NEW terminal):
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method GET

# === PHASE 4: FRONTEND (after agent writes frontend files) ===
Set-Content -Path "frontend\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1"
cd frontend
npm run dev
# Open http://localhost:3000 in browser
```
