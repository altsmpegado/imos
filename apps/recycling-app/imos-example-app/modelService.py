from flask import Flask, Response
from flask_cors import CORS
import cv2
import torch
from PIL import Image
from io import BytesIO
import base64
import pathlib

temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt', force_reload=True)
#model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

def predict_video_feed():
    try:
        # Open the video capture
        cap = cv2.VideoCapture('http://192.168.1.72:5000/video_feed')

        while cap.isOpened():
            # Read a frame from the video feed
            success, frame = cap.read()

            if not success:
                break

            # Convert the frame to RGB format
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Convert the frame to PIL Image format
            image = Image.fromarray(rgb_frame)

            # Predict on the image
            results = model(image)

            # Get bounding box coordinates and labels
            bboxes = results.xyxy[0].cpu().numpy()
            labels = results.names

            # Draw bounding boxes on the image
            for bbox in bboxes:
                xmin, ymin, xmax, ymax, confidence, class_idx = bbox
                class_name = labels[int(class_idx)]
                color = (0, 255, 0)  # Green color for bounding boxes
                cv2.rectangle(frame, (int(xmin), int(ymin)), (int(xmax), int(ymax)), color, 2)
                cv2.putText(frame, f'{class_name}: {confidence:.2f}', (int(xmin), int(ymin - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
            # Convert the processed image to OpenCV format (BGR)
            processed_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

            # Encode the processed frame as JPEG
            _, buffer = cv2.imencode('.jpg', processed_frame)

            # Convert image to base64 string
            frame = buffer.tobytes()

            # Yield the processed frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
    except Exception as e:
        print(f"Error processing video feed: {e}")

@app.route('/processed_video_feed')
def processed_video_feed():
    return Response(predict_video_feed(), content_type='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5001', debug=False)
