import cv2 # type: ignore
import torch # type: ignore
from PIL import Image # type: ignore
import os
#import pathlib
import time
import base64
from flask import Flask, Response, jsonify # type: ignore
from flask_cors import CORS # type: ignore

# Windows
#temp = pathlib.PosixPath
#pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

detector_port = os.getenv('MODEL_DETECTOR_PORT', '5001').split(':')[1]
webcam_ip = os.getenv('WEBCAM_IP', 'INVALID_PORT')

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)

last_detect_update = time.time()
detectionHistory = []
detection = []
class_counts = {'plastic': 0, 'paper': 0, 'undf': 0, 'metal': 0, 'critical': 0, 'glass': 0, 'cardboard': 0}

def detect_objects(frame):
    # Convert the frame to PIL Image format
    pil_image = Image.fromarray(frame)

    # Predict on the image
    results = model(pil_image)
    
    # Get bounding box coordinates and labels
    bboxes = results.xyxy[0].cpu().numpy()
    labels = results.names

    # Prepare JSON data for detections
    global detectionHistory, detection, class_counts, last_detect_update
    detection = []
    classes = []
    timestamp = time.time()

    for bbox in bboxes:
        xmin, ymin, xmax, ymax, confidence, class_idx = bbox
        class_name = labels[int(class_idx)]

        classes.append(class_name)

        # Draw bounding boxes on the frame
        cv2.rectangle(frame, (int(xmin), int(ymin)), (int(xmax), int(ymax)), (0, 255, 0), 2)
        cv2.putText(frame, f'{class_name}: {confidence:.2f}', (int(xmin), int(ymin - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Convert the frame with bounding boxes to base64
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        frame_base64 = base64.b64encode(frame_bytes).decode('utf-8')

        detection.append({
            'class': class_name,
            'confidence': float(confidence),
            'xmin': int(xmin),
            'ymin': int(ymin),
            'xmax': int(xmax),
            'ymax': int(ymax),
            'timestamp': timestamp,
            'frame': frame_base64
        })

    if time.time() - last_detect_update >= 3:
        if (not len(detection) == 0):
            for name in classes:
                if name in class_counts:
                    class_counts[name] += 1
            detectionHistory.append(detection)
        last_detect_update = time.time()

    return frame

def generate_frames():
    global webcam_ip
    try:
        # Open the video capture
        cap = cv2.VideoCapture(f'http://{webcam_ip}/video_feed')

        while cap.isOpened():
            # Read a frame from the video feed
            success, frame = cap.read()

            if not success:
                break

            # Detect objects in the frame
            frame_with_detections = detect_objects(frame)

            # Encode the processed frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame_with_detections)
            frame_bytes = buffer.tobytes()

            # Yield the processed frame and detections
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')

    except Exception as e:
        print(f"Error processing video feed: {e}")

@app.route('/processed_video_feed')
def processed_video_feed():
    return Response(generate_frames(), content_type='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_detection_history')
def get_detection_history():
    global detectionHistory
    return jsonify(detectionHistory)

@app.route('/get_detection')
def get_detection():
    global detection
    return jsonify(detection)

@app.route('/get_detected_classes')
def get_detected_classes():
    global class_counts
    return jsonify(class_counts)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=detector_port, debug=False)
