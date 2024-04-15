import cv2
import torch
from PIL import Image
import pathlib
from flask import Flask, Response
from flask_cors import CORS

temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)

def detect_objects(frame):
    # Convert the frame to PIL Image format
    pil_image = Image.fromarray(frame)

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

        # Draw bounding boxes on the frame
        cv2.rectangle(frame, (int(xmin), int(ymin)), (int(xmax), int(ymax)), (0, 255, 0), 2)
        cv2.putText(frame, f'{class_name}: {confidence:.2f}', (int(xmin), int(ymin - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    return frame, detections

def generate_frames():
    try:
        # Open the video capture
        cap = cv2.VideoCapture('http://localhost:5000/video_feed')

        while cap.isOpened():
            # Read a frame from the video feed
            success, frame = cap.read()

            if not success:
                break

            # Detect objects in the frame
            frame_with_detections, _ = detect_objects(frame)

            # Encode the processed frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame_with_detections)
            frame_bytes = buffer.tobytes()

            # Yield the processed frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')

    except Exception as e:
        print(f"Error processing video feed: {e}")

@app.route('/processed_video_feed')
def processed_video_feed():
    return Response(generate_frames(), content_type='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5001', debug=False)
