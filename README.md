# GreenNode — Carbon-Aware AI Training Optimizer

GreenNode measures, schedules, and reduces the carbon footprint of AI systems. Built as a portfolio project by a Mechanical Engineering student at HAN Applied Sciences, combining a FastAPI backend, React dashboard, live Dutch grid data, and an Arduino UNO R4 hardware layer.

## The Problem

Building AI has an environmental cost that is rarely measured or optimized. Every training run emits CO₂, every inference call consumes energy, and most developers have no visibility into any of it. GreenNode changes that.

## The Solution

Four tools in one unified dashboard:

### 1. Green AI Tracker

Wraps CodeCarbon around real model training jobs to measure exact CO₂ emissions, energy consumption, and hardware power draw per run. All results stored in Supabase for historical tracking and budget analysis.

### 2. Training Time Optimiser

Pulls live carbon intensity data from the Dutch electricity grid via ENTSO-E and identifies the lowest-carbon window in the next 24 hours. Typical saving: 30–60% CO₂ reduction by shifting jobs to off-peak hours when renewables dominate.

### 3. Prompt Cleaner

Uses an LLM (via OpenRouter) to compress verbose AI prompts into minimal direct instructions, verified with sentence-transformer embeddings to ensure intent is preserved. Reduces token count and inference emissions with every query.

### 4. Emissions Intelligence

Closes the measure → optimise → act loop. Auto-calculates a monthly carbon budget from your run history, projects monthly emissions, sets a target 10% below your baseline, and tightens every month. What-if analysis shows how much CO₂ you would have saved by training at the optimal grid window.

## Hardware Layer (Arduino UNO R4)

The STM32 MCU handles real-time power sensing via CT sensor while the Qualcomm MPU running Linux manages connectivity and ML inference. A physical LED gives a glanceable carbon signal — green for clean grid, red for high emissions. Communicates with the dashboard via REST API.

## Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| Backend            | FastAPI, Python 3.11                     |
| Emissions tracking | CodeCarbon                               |
| Grid data          | ENTSO-E Transparency Platform (live NL)  |
| Prompt compression | OpenRouter API (Gemma 3 12B)             |
| Embeddings         | sentence-transformers (all-MiniLM-L6-v2) |
| Database           | Supabase (PostgreSQL)                    |
| Frontend           | React, Vite, Recharts                    |
| Hardware           | Arduino UNO R4, CT sensor                |

## Project Structure

greennode/
├── .env.example
├── README.md
├── backend/
│ ├── main.py
│ ├── database.py
│ ├── requirements.txt
│ ├── tracker/
│ ├── scheduler/
│ ├── cleaner/
│ └── intelligence/
└── frontend/
└── src/
├── api/
└── components/

## Setup

### Prerequisites

- Python 3.11
- Node.js 18+
- Supabase account
- ENTSO-E API key (free at transparency.entsoe.eu)
- OpenRouter API key (free at openrouter.ai)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:
SUPABASE_URL=
SUPABASE_KEY=
ENTSOE_API_KEY=
OPENROUTER_API_KEY=
ELECTRICITY_MAPS_API_KEY=

## Roadmap

- [ ] Auto-defer scheduler — queue jobs and launch at optimal grid window automatically
- [ ] AI agent layer — smolagents monitoring run history, surfacing insights, triggering defers
- [ ] Project-based run organisation — track emissions per project/folder
- [ ] Arduino hardware layer — CT sensor, LED carbon signal, Bridge RPC
- [ ] Pagination on run history
- [ ] ENTSO-E 24-hour forecast (currently mock pattern + live anchor)

## Context

The narrative: building the previous two projects (F1 race prediction system, industrial anomaly detection) gave me a guilty conscience about AI's environmental cost — so I built something to address it.
