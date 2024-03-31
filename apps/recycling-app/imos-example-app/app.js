const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const { createCanvas, loadImage } = require('canvas');

const app = express();

const port = process.env.PORT || 3000;
const webcamIP = process.env.WEBCAM_IP || 'Hello, World!';
const ip = `http://${webcamIP}/video_feed`;

async function loadCustomModel(modelPath) {
  return await tf.loadGraphModel(`file://${modelPath}`);
}

const modelPath = 'best-fp16.tflite';
let model;

loadCustomModel(modelPath)
  .then(loadedModel => {
    model = loadedModel;
  })
  .catch(error => {
    console.error('Error loading custom model:', error);
  });

// Function to perform object detection using your custom model and draw bounding boxes
async function detectObjectsAndDrawBoxes(imageUrl) {
  const image = await loadImage(imageUrl);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Perform inference with your custom model
  const inputTensor = tf.browser.fromPixels(canvas).expandDims();
  const predictions = await model.predict(inputTensor);
  console.log(predictions);
  // Draw bounding boxes based on model predictions
  // predictions.forEach(prediction => {
  //   const [ymin, xmin, ymax, xmax] = prediction;
  //   ctx.beginPath();
  //   ctx.lineWidth = '2';
  //   ctx.strokeStyle = 'red';
  //   ctx.rect(xmin * image.width, ymin * image.height, (xmax - xmin) * image.width, (ymax - ymin) * image.height);
  //   ctx.stroke();
  // });

  return canvas.toDataURL();
}

app.get('/', async (req, res) => {
  try {
    const annotatedImage = await detectObjectsAndDrawBoxes(ip);
    res.send(`
      <html>
        <head>
          <title>IMOS Example App</title>
        </head>
        <body>
          <h1>IMOS Example App</h1>
          <img src="${annotatedImage}" alt="Annotated Camera Feed">
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
