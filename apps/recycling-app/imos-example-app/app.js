const express = require('express');
const app = express();
const axios = require('axios');

const port = process.env.PORT || 3000;
const ip = `http://localhost:5001/processed_video_feed`;
const detectionsUrl = `http://127.0.0.1:5001/get_detection_history`;

async function fetchDetections() {
  try {
    const response = await axios.get(detectionsUrl);
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching detections:', error);
    return [];
  }
}

// Function to generate HTML for the detections table
function generateDetectionsTable(detectionObject) {
  const detectionsArray = detectionObject.slice(-10);

  let tableHtml = '<table>';
  tableHtml += '<tr><th>Class</th><th>Confidence</th><th>X-min</th><th>Y-min</th><th>X-max</th><th>Y-max</th><th>Timestamp</th></tr>';
  
  detectionsArray.forEach((detections, index) => {
    detections.forEach(detection => {
      tableHtml += `<tr>
                      <td>${new Date(detection.timestamp * 1000).toLocaleString()}</td>
                      <td>${detection.class}</td>
                      <td>${detection.confidence.toFixed(2)}</td>
                      <td>${detection.xmin}</td>
                      <td>${detection.ymin}</td>
                      <td>${detection.xmax}</td>
                      <td>${detection.ymax}</td>
                    </tr>`;
    });

    // Add a blank row between each array of detections
    if (index < detectionsArray.length - 1) {
      tableHtml += '<tr><td colspan="7">&nbsp;</td></tr>';
    }
  });
  
  tableHtml += '</table>';
  return tableHtml;
}


// Route for serving the homepage
app.get('/', async (req, res) => {
  try {
    // Fetch detections from the server
    const detections = await fetchDetections();
    //console.log(detections);
    // Generate HTML for the detections table
    const detectionsTable = generateDetectionsTable(detections);

    // Serve the HTML with the camera feed and detections table
    const html = `
      <html>
        <head>
          <title>Industrial Station for Waste Separation</title>
        </head>
        <body>
          <h1>Industrial Station for Waste Separation</h1>
          <div>
            <h2>Camera Feed</h2>
            <img src="${ip}" alt="Camera Feed">
          </div>
          <div>
            <h2>Detections</h2>
            ${detectionsTable}
          </div>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching detections');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
