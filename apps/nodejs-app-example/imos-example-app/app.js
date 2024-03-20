const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
const webcamIP = process.env.WEBCAM_IP || 'Hello, World!';
const ip = `http://${webcamIP}/video_feed`;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>IMOS Example App</title>
      </head>
      <body>
        <h1>IMOS Example App</h1>
        <img src="${ip}" alt="Camera Feed">
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
