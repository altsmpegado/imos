import os
import supervision as sv
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS # type: ignore
from inference_sdk import InferenceHTTPClient, InferenceConfiguration
from PIL import Image

app = Flask(__name__)
CORS(app)

port = os.getenv('PORT', '5002:5002').split(':')[1]
api_url = os.getenv('ROBOFLOW_API_URL', 'https://detect.roboflow.com')
api_key = os.getenv('ROBOFLOW_API_KEY', '4BRQaWP7CIwFCAqFJkHW')
project_id = os.getenv('ROBOFLOW_PROJECT_ID', 'ppe-dataset-for-workplace-safety')
model_version = os.getenv('MODEL_VERSION', '1')
confidence_threshold = os.getenv('CONFIDENCE', '0.5')

# Set up the client for inference
client = InferenceHTTPClient(
    api_url=api_url,
    api_key=api_key,
)
custom_configuration = InferenceConfiguration(confidence_threshold=0.8)

UPLOAD_FOLDER = '/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/annotate', methods=['POST'])
def annotate_image():
    # Check if an image file is uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    # Get the uploaded image file
    file = request.files['file']
    
    filename = str(uuid.uuid4()) + '.jpg'
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Load the image using PIL
    image = Image.open(filepath)

    # Run inference on the image
    with client.use_configuration(custom_configuration):
        results = client.infer(image, model_id=f"{project_id}/{model_version}")
    
    # Get detections from the inference results
    detections = sv.Detections.from_inference(results)

    # Create supervision annotators
    bounding_box_annotator = sv.BoundingBoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    # Annotate the image with bounding boxes and labels
    annotated_image = bounding_box_annotator.annotate(scene=image, detections=detections)
    annotated_image = label_annotator.annotate(scene=annotated_image, detections=detections)
    
    annotated_image_name = str(uuid.uuid4()) + '.jpg'
    annotated_image_path = os.path.join("/tmp", annotated_image_name)

    annotated_image.save(annotated_image_path)

    # Prepare JSON response
    response = {
        'results': results,
        'annotated_image_path': annotated_image_path
    }
    
    return jsonify(response), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False)
