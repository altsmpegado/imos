import cv2
from PIL import Image
import os
import time
import io
from flask import Flask, jsonify
from flask_cors import CORS
from inference_sdk import InferenceHTTPClient, InferenceConfiguration

app = Flask(__name__)
CORS(app)

CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="mph3NGMoaTt6ShrlOTo9"
)
custom_configuration = InferenceConfiguration(confidence_threshold=0.8)

detector_port = os.getenv('MODEL_DETECTOR_PORT', '5001:5001').split(':')[1]
webcam_ip = os.getenv('WEBCAM_IP', '10.22.127.62:5000')

last_detect_update = time.time()
detectionHistory = []
class_counts = {'Boots': 0, 'Glass': 0, 'Glove': 0, 'Helmet': 0, 'Mask': 0, 'Person': 0, 'Vest': 0}

def detect_objects(frame):
    # Convert the frame to JPEG format
    _, buffer = cv2.imencode('.jpg', frame)
    frame_jpg = buffer.tobytes()

    pil_image = Image.open(io.BytesIO(frame_jpg))

    with CLIENT.use_configuration(custom_configuration):
        results = CLIENT.infer(pil_image, model_id="ppe-dataset-for-workplace-safety/1")
    
    return results

def process_video_feed():
    global webcam_ip
    detection_results = []
    try:
        # Open the video capture
        cap = cv2.VideoCapture(f'http://{webcam_ip}/video_feed')

        while cap.isOpened():
            # Read a frame from the video feed
            success, frame = cap.read()

            if not success:
                break

            # Detect objects in the frame
            result = detect_objects(frame)
            detection_results.append(result)

    except Exception as e:
        print(f"Error processing video feed: {e}")
    
    return detection_results

@app.route('/results')
def get_results():
    results = process_video_feed()
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=detector_port, debug=False)
