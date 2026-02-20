# Data Dictionary Generator

AI-enhanced data dictionary platform that connects to enterprise databases, extracts schema metadata, analyzes data quality, and produces business-friendly documentation with an interactive chat interface.

## Architecture

```
datadictionary/
├── backend/          # Python FastAPI server
│   ├── main.py       # Entry point
│   ├── config.py     # Settings / env vars
│   ├── routers/      # API route handlers
│   └── services/     # Business logic
└── frontend/         # React + Vite (JavaScript)
    ├── src/
    │   ├── api/      # Backend API client
    │   ├── pages/    # Page components
    │   └── App.jsx   # Root component + routing
    └── vite.config.js
```

## Features

- **Multi-database support** – PostgreSQL, SQL Server, Snowflake, SQLite
- **Schema metadata extraction** – tables, columns, types, PKs, FKs, indexes
- **Data quality analysis** – completeness, uniqueness, null counts, statistical summaries (mean, stddev, CV)
- **AI-generated summaries** – business-friendly table & column descriptions via OpenAI
- **Interactive chat** – natural language Q&A about your data

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit with your keys
python main.py
```

The API will be available at `http://localhost:8000`. Swagger docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` to the backend.

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI summaries & chat |
| `HOST` | Backend host (default `0.0.0.0`) |
| `PORT` | Backend port (default `8000`) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/connections` | Create a database connection |
| `GET` | `/api/connections` | List connections |
| `DELETE` | `/api/connections/:id` | Remove a connection |
| `GET` | `/api/metadata/:id/schemas` | List schemas |
| `GET` | `/api/metadata/:id/tables` | List tables & views |
| `GET` | `/api/metadata/:id/tables/:table` | Full table metadata |
| `GET` | `/api/quality/:id/tables/:table` | Data quality report |
| `GET` | `/api/ai/:id/tables/:table/summary` | AI-generated summary |
| `POST` | `/api/chat` | Multi-turn AI chat |
