FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by some python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

RUN pip install --upgrade pip
# Try to install a CPU wheel of torch first to avoid heavy GPU builds (best-effort)
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu || true
RUN pip install -r /app/requirements.txt

COPY . /app

# Ensure runtime directories exist
RUN mkdir -p /app/uploads /app/outputs /app/model

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
