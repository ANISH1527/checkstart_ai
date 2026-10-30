FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "import torch, psycopg2, sentence_transformers, faiss, sqlalchemy; print('Torch:', torch.__version__); print('CUDA:', torch.version.cuda); print('PostgreSQL driver:', psycopg2.__version__); print('All production imports successful')"

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
