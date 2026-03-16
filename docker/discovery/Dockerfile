FROM python:3.11-alpine

# Install system dependencies for zeroconf
RUN apk add --no-cache gcc musl-dev linux-headers

WORKDIR /app

# Install python dependencies
RUN pip install --no-cache-dir zeroconf

COPY discovery_agent.py .

# Use host network mode to allow mDNS broadcasting across the local subnet
# This is configured in docker-compose.yml
CMD ["python", "discovery_agent.py"]
