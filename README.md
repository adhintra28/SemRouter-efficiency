
# Semantic Router

Welcome to the Semantic Router repository. This document serves as the primary understanding and architectural overview.

---

## 📖 Project Overview

Semantic Router is an interactive, application engineered to simulate, compare, and optimize LLM query routing. It provides a multi-model playground for concurrent LLM benchmarking alongside an advanced semantic routing engine. By parsing queries into separate logical segments, identifying their complexity tiers (nano, flash, pro, ultra), and dynamically load-balancing them to different model endpoints based on user weight preferences, the application demonstrates significant cost reductions and latency speedups.

---

## ✨ Core Features

*   **Multi-Model Playground:** Benchmark response text, speed, costs, and token counts concurrently across active LLMs in a single interface.
*   **Semantic Routing Engine:** Intelligently segments compound prompts, evaluates complexity tiers, and routes segments in parallel to the most cost-effective and appropriate model capability.
*   **Weighted Routing Optimization:** Custom weight sliders let users prioritize either latency/speed or price/budget (0-100%) to dynamically determine the optimal choice.
*   **API Proxies for Live Endpoints:** Standard Next.js API route handlers to proxy query execution and classification directly to OpenAI, Anthropic, Gemini, and Groq endpoints.
*   **Real-time Performance Sparklines & Analytics:** Render inline custom SVGs for latency variation (ms) and cost variations ($) tracking performance trends over run histories.


---

## 🔄 The Process: Architectural Flow

1.  **Preferences Configuration:** Users toggle active playground models and adjust optimization priority weights (Latency vs. Price) in the collapsible sidebar.
2.  **Input Submission:** The user submits a prompt via the Playground interface.
3.  **Parsing & Segmentation:** 
    *   *Standard Mode:* Prompts are routed directly to all enabled models concurrently.
    *   *Semantic Router Mode:* Queries are split into sentences or conjunction-bound segments, classified for complexity, and matched with optimal models.
4.  **Execution & Parallel Simulation:** Run results are computed using preset query similarities or actual live endpoint fetch queries. Parallel segments run concurrently, bounding overall execution time by the slowest segment.
5.  **Telemetry Hydration:** The UI updates cost savings statistics, prints parallel segment answers, and maps the results on the real-time performance trend graphs.

---

## 🪝 Routing & State (History & Hooks)

To manage configurations and active views across the playground:

*   **View Tabs Switcher:** Toggles between standard `Model Playground` and `Model Comparison` tables, altering the rendered sub-dashboards.
*   **State Hook Synced settings:** Interactive weights and model selection states are loaded and persistent in browser `localStorage`, ensuring configuration states survive reloads.
*   **Optimized Rendering:** Uses React `useCallback` to prevent unnecessary re-renders of heavy custom SVG chart canvases during query run animations.

---

## 📊 Coordination & Measurements

*   **Balanced Rank Calculation:** Identifies the "Balanced Choice" by computing: `Score = (CostRank * CostWeight) + (LatencyRank * LatencyWeight)`.
*   **Telemetry Trends:** Keeps track of the last 7 execution runs to plot real-time latency (ms) and cost ($) charts.
*   **Catalog Syncing:** Seeded mock histories dynamically represent model specifications (average latency curves, parameter tiers) in the catalog dashboard.

---

## 🧠 What I Learned

*   **Efficient Concurrency Models:** Implementing parallelized query segment routing highlighted how compound latency is bounded by the slowest segment, validating the speedups of semantic segment routing.
*   **Jaccard Distance Classifiers:** Designing lightweight, client-side Jaccard similarity algorithms on words offers a fast, zero-latency query complexity heuristic before calling model classification.
*   **Vanilla CSS Glassmorphism:** Creating responsive dashboard dashboards with dark-mode compliance using raw CSS tokens instead of library utilities maximizes control and rendering performance.

---

## 📁 File Structure

```text
semantic-router/
├── src/
│   ├── app/                  # Next.js App Router pages & stylesheets
│   │   ├── api/
│   │   │   ├── classify/     # Endpoint to classify query complexity
│   │   │   └── route-llm/    # Endpoint to proxy LLM completions
│   │   ├── favicon.ico
│   │   ├── globals.css       # Core tokens & global design system
│   │   ├── layout.tsx
│   │   ├── page.module.css
│   │   └── page.tsx          # Main entry rendering RouterDashboard
│   ├── components/           # Reusable Dashboard components
│   │   ├── RouterDashboard.tsx          # Main shell & metric summary layout
│   │   ├── QueryTester.tsx              # Interactive playground & results segmenter
│   │   ├── StatsCharts.tsx              # Cost and Latency comparative bar charts
│   │   ├── HistoryLineCharts.tsx        # Multi-run cost & latency SVG line charts
│   │   ├── SettingsPanel.tsx            # Model toggler & weight adjustments sidebar
│   │   └── ModelComparisonDashboard.tsx # Complete static models comparison grid
│   └── utils/
│       └── routerEngine.ts   # Core routing logic, presets, and token calculation
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Onboarding & Local Setup

### Prerequisites
*   Node.js 20+
*   npm or yarn

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory to store your API keys for live endpoint testing:
```env
# Optional API Keys for Live Playground Testing
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

### 3. Running the App
Run the local Next.js development server:
```bash
npm run dev
```
Access the application at `http://localhost:3000`.
