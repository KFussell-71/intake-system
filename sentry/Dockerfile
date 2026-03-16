FROM python:3.11-alpine

WORKDIR /app

RUN mkdir -p /app/logs/masked

COPY phi_sentry.py .

# PHI Sentry runs as a background auditor
CMD ["python", "phi_sentry.py"]
