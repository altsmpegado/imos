from flask import Flask, Response
from flask_cors import CORS
import cv2
import torch
from PIL import Image
import pathlib
import json

temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)

def detect_objects(frame):
    # Convert the frame to RGB format (OpenCV uses BGR)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Convert the frame to PIL Image format
    pil_image = Image.fromarray(frame_rgb)

    # Predict on the image
    results = model(pil_image)

    # Get bounding box coordinates and labels
    bboxes = results.xyxy[0].cpu().numpy()
    labels = results.names

    # Prepare JSON data for detections
    detections = []
    for bbox in bboxes:
        xmin, ymin, xmax, ymax, confidence, class_idx = bbox
        class_name = labels[int(class_idx)]
        detections.append({
            'class': class_name,
            'confidence': float(confidence),
            'xmin': int(xmin),
            'ymin': int(ymin),
            'xmax': int(xmax),
            'ymax': int(ymax)
        })

        # Draw bounding boxes on the image
        color = (0, 255, 0)  # Green color for bounding boxes
        cv2.rectangle(frame_rgb, (int(xmin), int(ymin)), (int(xmax), int(ymax)), color, 2)
        cv2.putText(frame_rgb, f'{class_name}: {confidence:.2f}', (int(xmin), int(ymin - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # Convert the frame back to BGR format (OpenCV uses BGR)
    frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

    return frame_bgr, detections

def predict_video_feed():
    try:
        # Open the video capture
        cap = cv2.VideoCapture('http://localhost:5000/video_feed')
        #cap = cv2.VideoCapture(0)
        while cap.isOpened():
            # Read a frame from the video feed
            success, frame = cap.read()

            if not success:
                break

            frame_detected, detections = detect_objects(frame)

            _, buffer = cv2.imencode('.jpg', frame_detected)
            frame_bytes = buffer.tobytes()

            print(detections)
            
            yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')
            
            if detections:
                json_data = json.dumps(detections)
                yield (b'--json\r\n'
                       b'Content-Type: application/json\r\n\r\n' + json_data.encode() + b'\r\n\r\n')

    except Exception as e:
        print(f"Error processing video feed: {e}")

@app.route('/processed_video_feed')
def processed_video_feed():
    return Response(predict_video_feed(), content_type='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5001', debug=False)
