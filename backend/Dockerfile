FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2, pymssql, scipy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev freetds-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injects PORT automatically; default 8000 for local docker run
ENV PORT=8000
EXPOSE $PORT

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
