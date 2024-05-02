docker run -p 5002:5002 -v C:\IMOS\Apps:/tmp imos-roboflowapp

port = os.getenv('PORT', '5002:5002').split(':')[1]
api_url = os.getenv('ROBOFLOW_API_URL', 'https://detect.roboflow.com')
api_key = os.getenv('ROBOFLOW_API_KEY', '4BRQaWP7CIwFCAqFJkHW')
project_id = os.getenv('ROBOFLOW_PROJECT_ID', 'ppe-dataset-for-workplace-safety')
model_version = os.getenv('MODEL_VERSION', '1')
confidence_threshold = os.getenv('CONFIDENCE', '0.5')