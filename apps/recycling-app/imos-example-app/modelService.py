import cv2
import torch
from PIL import Image
import pathlib
import time
import base64
from flask import Flask, Response, jsonify
from flask_cors import CORS

temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)

last_detect_update = time.time()
detectionHistory = []
detection = []
last_count_update = time.time()
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
    global detectionHistory, detection, class_counts, last_detect_update, last_count_update
    detection = []
    timestamp = time.time()

    for bbox in bboxes:
        xmin, ymin, xmax, ymax, confidence, class_idx = bbox
        class_name = labels[int(class_idx)]

        if time.time() - last_count_update >= 3:
            if class_name in class_counts:
                class_counts[class_name] += 1
            last_count_update = time.time()

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
            detectionHistory.append(detection)
        last_detect_update = time.time()

    return frame

def generate_frames():
    try:
        # Open the video capture
        #const webcamIP = process.env.WEBCAM_IP || 'Hello, World!'

        cap = cv2.VideoCapture('http://localhost:5000/video_feed')

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
    app.run(host='0.0.0.0', port='5001', debug=False)
