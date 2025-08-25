FROM python:3.11-slim

# Install system dependencies for audio processing and ML
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsox-fmt-all \
    sox \
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create cache directory for models
RUN mkdir -p /app/.cache

# Set environment variables
ENV PYTHONPATH=/app
ENV TORCH_HOME=/app/.cache
ENV HF_HOME=/app/.cache
ENV WHISPER_CACHE=/app/.cache

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]
