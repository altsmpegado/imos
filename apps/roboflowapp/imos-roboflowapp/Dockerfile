FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up a working directory
WORKDIR /app

# Copy the application code into the container
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# define metadata variables
LABEL com.available.configs="PORT, ROBOFLOW_API_URL, ROBOFLOW_API_KEY, \
                             ROBOFLOW_PROJECT_ID, MODEL_VERSION, CONFIDENCE" \
      com.required.configs="PORT, ROBOFLOW_API_URL, ROBOFLOW_API_KEY, \
                            ROBOFLOW_PROJECT_ID, MODEL_VERSION" \
      com.user.display="False"

# Command to run the application
CMD ["python", "app.py"]