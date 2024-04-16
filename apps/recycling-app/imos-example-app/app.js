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
  tableHtml += '<tr><th>Timestamp</th><th>Class</th><th>Confidence</th><th>Xmin</th><th>Ymin</th><th>Xmax</th><th>Ymax</th></tr>';
  
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
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Industrial Station for Waste Separation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          
          .container {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px;
          }
          
          .camera-feed,
          .detections-table {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .camera-feed {
            flex: 1;
            margin-right: 20px;
          }
          
          .detections-table {
            flex: 1;
          }
          
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          td, th {
            padding: 10px;
            text-align: left;
          }
          
          th {
            background-color: #f0f0f0;
            border-bottom: 2px solid #ddd;
          }
          
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          tr:hover {
            background-color: #f0f0f0;
          }
          
          tr:first-child th:first-child {
            border-top-left-radius: 8px; /* Rounded top-left corner for the first cell in the first row */
          }
          
          tr:first-child th:last-child {
            border-top-right-radius: 8px; /* Rounded top-right corner for the last cell in the first row */
          }
          
          tr:last-child td:first-child {
            border-bottom-left-radius: 8px; /* Rounded bottom-left corner for the first cell in the last row */
          }
          
          tr:last-child td:last-child {
            border-bottom-right-radius: 8px; /* Rounded bottom-right corner for the last cell in the last row */
          }

        </style>
      </head>
      <body>
        <div class="container">
          <div class="camera-feed">
            <h1>Camera Feed</h1>
            <img src="${ip}" alt="Camera Feed">
          </div>
          <div class="detections-table">
            <h1>Detections</h1>
            ${generateDetectionsTable(detections)}
          </div>
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
