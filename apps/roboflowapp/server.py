from flask import Flask, request, jsonify
from inference_sdk import InferenceHTTPClient
from PIL import Image
import supervision as sv
import uuid
import os

app = Flask(__name__)

# Set up the client for inference
client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="4BRQaWP7CIwFCAqFJkHW",
)

# Define the project ID and model version
project_id = "ppe-dataset-for-workplace-safety"
model_version = 1

@app.route('/annotate', methods=['POST'])
def annotate_image():
    # Check if an image file is uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    # Get the uploaded image file
    file = request.files['file']
    
    # Load the image using PIL
    image = Image.open(file)

    # Run inference on the image
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
    app.run(debug=True)
