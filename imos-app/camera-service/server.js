const express = require('express');
const app = express();
const http = require('http').Server(app);

app.get('/camera-frame', (req, res) => {
  // Respond with an HTML page that captures frames from the user's camera
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Camera Frame</title>
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:">
    </head>
    <body>
      <video id="camera" width="640" height="480" autoplay playsinline></video>
      <script>
        const video = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream;
          })
          .catch((error) => {
            console.error('Error accessing camera:', error);
          });
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
