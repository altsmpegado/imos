const express = require('express');
const app = express();
const tf = require('@tensorflow/tfjs-node');
const { createCanvas, loadImage } = require('canvas');
const { loadTfliteModel, getBoundingBoxes } = require('./customModelUtils');

const port = process.env.PORT || 3000;
const webcamIP = process.env.WEBCAM_IP || 'Hello, World!';
const ip = `http://${webcamIP}/video_feed`;

async function processImage(url, model) {
  const image = await loadImage(url);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const inputTensor = tf.browser.fromPixels(canvas).expandDims();
  const predictions = model.predict(inputTensor);
  const boundingBoxes = getBoundingBoxes(predictions); // Function to extract bounding boxes from model output
  for (const bbox of boundingBoxes) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height);
    ctx.stroke();
  }
  return canvas.toBuffer();
}

app.get('/', async (req, res) => {
  try {
    const model = await await tf.lite.loadModel('best-fp16.tflite'); // Load your custom TensorFlow Lite model
    const imageBuffer = await processImage(ip, model);
    const imageSrc = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    res.send(`
      <html>
        <head>
          <title>IMOS Example App</title>
        </head>
        <body>
          <h1>IMOS Example App</h1>
          <img src="${imageSrc}" alt="Camera Feed">
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
