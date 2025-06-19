FROM python:3.11-slim
WORKDIR /app
COPY services/ml-sidecar/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ml-sidecar ./
EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
