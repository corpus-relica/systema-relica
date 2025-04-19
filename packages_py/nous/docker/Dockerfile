FROM python:3.11-slim
LABEL maintainer="Marc <xtof@relica.io>"

WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Python package
COPY ../ /usr/src/app/packages_py/nous

# Set the working directory to the nous package
WORKDIR /usr/src/app/packages_py/nous

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONPATH=/usr/src/app
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 2204

# Command to run the application
CMD ["python", "main.py"]