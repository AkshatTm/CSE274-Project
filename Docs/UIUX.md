# UI/UX Design & Interaction Document

**Product Name:** BioSync: Human Performance & Recovery Engine
**Target Audience:** Frontend Implementation Team / Claude Sonnet 4.6

---

## 1. Design Philosophy & Visual Language

BioSync will utilize a **"Kinetic Glassmorphism"** aesthetic. The interface must feel less like a traditional clinical dashboard and more like a high-end, living intelligence engine.

| Pillar | Directive |
|---|---|
| **Core Layout** | Bento Box Grid — modular rounded-rectangle cards of varying sizes snapping together in a masonry-style grid |
| **Texture** | Frosted Glass — `backdrop-filter: blur()` with semi-transparent white/grey backgrounds layered over an animated mesh gradient |
| **Priority** | Motion-First — every data fetch, chart render, and hover state must be accompanied by fluid, physics-based animations |

---

## 2. Typography System

The typography pairs an elegant editorial serif with a highly legible modern geometric sans-serif to create a sophisticated tension.

| Role | Typeface | Usage |
|---|---|---|
| **Primary Headings & Large Numbers** | Instrument Serif | Main dashboard title, large Readiness Score number, overarching section headers — adds a bespoke, premium feel to raw data |
| **Body Text, Labels & UI Elements** | Outfit | Chart axes, input labels, metric names (e.g., "Active Calories", "Heart Rate Variability"), and validation metrics — geometric nature makes it ideal for aligning numbers in tables and grids |

---

## 3. Color Palette — White/Greyish Glass

The palette is hyper-minimalist to let the data visualization pop.

| Element | Color | Value |
|---|---|---|
| Base Background | Animated mesh gradient | Off-White `#F8F9FA` · Cool Light Grey `#E9ECEF` · Icy Blue `#E0F2FE` |
| Bento Card Background | Glassy White | `rgba(255, 255, 255, 0.65)` + `backdrop-blur-xl` |
| Card Borders | Translucent White | `1px solid rgba(255, 255, 255, 0.4)` |
| Primary Text | Deep Charcoal | `#1F2937` |

### Semantic Accent Colors (ML Classifications)

| State | Label | Color |
|---|---|---|
| ✅ | Optimal / Safe | Soft Emerald `#34D399` |
| ⚠️ | Moderate / Strain | Warm Amber `#FBBF24` |
| 🔴 | Burnout Risk | Muted Rose `#FB7185` |

---

## 4. Interactive & Kinetic Requirements — *The "Alive" Factor*

Animations are a **strict requirement**. Claude Sonnet 4.6 must utilize **Framer Motion** in the Next.js components to execute the following:

### Staggered Bento Entrance
> On page load, the bento boxes must not just appear. They should **slide up and fade in one by one** with a slight spring physics effect.

### Card Micro-interactions
> Hovering over any bento card should trigger a subtle **3D tilt effect** (tracking the mouse cursor) and slightly increase the opacity of the white glass to make it "glow."

### Number Ticking
> When the ML API returns the predicted calories or readiness score, numbers must **rapidly count up from 0 to the final value** (e.g., `0... 450... 1200... 2450 kcal`).

### Kinetic Chart Rendering
> Recharts elements (lines and scatter plots) must **"draw" themselves smoothly** onto the screen when data loads, rather than popping in statically.

---

## 5. Core UI Components — *The Bento Grid Breakdown*

The dashboard is divided into specific widgets mapped directly to the syllabus requirements outlined in the PRD.

---

### Widget 1 — The Telemetry Input *(The Control Center)*

| Property | Detail |
|---|---|
| **Visuals** | Sleek sidebar or top-row bento box |
| **UX** | Stylized sliders with Outfit typography for inputting previous day's metrics: Steps, HRV, Sleep Hours — dragging must feel smooth and responsive |
| **Action** | Prominent glowing glass button labeled **"Synthesize Vitals"** — triggers a localized pulsing skeleton loader in the other widgets while the Python API processes data |

---

### Widget 2 — The Readiness Oracle *(Classification Output — CO3)*

| Property | Detail |
|---|---|
| **Visuals** | The hero bento box |
| **Content** | Massive Instrument Serif number (0–100) + text label (e.g., *"Optimal Readiness"*) — text color shifts per semantic accent palette |
| **Academic Transparency** | Small sleek tooltip or pill badge displaying model accuracy (e.g., `ROC-AUC: 0.88`) |

---

### Widget 3 — Energy Forecasting *(Regression Output — CO4 & CO5)*

| Property | Detail |
|---|---|
| **Visuals** | Medium bento box featuring a Recharts area chart |
| **Content** | Displays predicted "Active Calories Burned" — chart plots historical baseline leading up to the new predicted data point |
| **Academic Transparency** | Subtle readout of regression error metric (e.g., `RMSE: 42.5 kcal`) |

---

### Widget 4 — Biometric Archetype *(Clustering Output — CO6)*

| Property | Detail |
|---|---|
| **Visuals** | Square bento box featuring a minimal scatter plot or radar chart |
| **Content** | Maps current vitals into a visual cluster alongside historical data, assigning an archetype (e.g., *"Cluster: High Strain"*) |
| **Academic Transparency** | Silhouette Score validation metric displayed at the bottom |

---

## 6. User Flow — End-to-End

```
State 0 — Empty / Baseline
  └─ User loads the app
  └─ Mesh background moves slowly
  └─ Bento grid populates with placeholder baseline data

State 1 — Interaction
  └─ User adjusts telemetry sliders

State 2 — Loading
  └─ User clicks "Synthesize Vitals"
  └─ Data widgets blur slightly and pulse
  └─ Awaiting FastAPI response

State 3 — Resolution
  └─ Python backend returns JSON payload
  └─ Charts draw themselves onto the screen
  └─ Instrument Serif numbers tick up to predicted values
  └─ Card borders briefly flash semantic color:
       ├─ Emerald  → Optimal Readiness
       ├─ Amber    → Moderate Strain
       └─ Rose     → Burnout Risk
```
