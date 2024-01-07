from flask import Flask, render_template, Response
from flask_cors import CORS
import cv2
import ssl

app = Flask(__name__)
CORS(app)

cap = cv2.VideoCapture(0)
##cap.set(3, 640)  # set width
##cap.set(4, 480)  # set height

def generate_frames():
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), content_type='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)
    #app.run(host='0.0.0.0', debug=False, ssl_context=('cert.pem', 'key.pem'))