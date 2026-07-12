FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (required for some C libraries like FAISS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set Hugging Face cache directory to persist downloaded models inside the container image layer
ENV HF_HOME=/app/hf_cache

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the cache script and trigger the download during image build
COPY cache_models.py .
RUN python cache_models.py

# Copy application files (including local dataset and FAISS index)
COPY . .

# Expose default port
EXPOSE 8080

# Run FastAPI using uvicorn, reading GCP Cloud Run's dynamic $PORT environment variable
CMD exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080}
