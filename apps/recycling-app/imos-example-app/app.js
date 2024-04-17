const express = require('express');
const app = express();
const axios = require('axios');

const port = process.env.PORT || 3000;
const ip = `http://localhost:5001/processed_video_feed`;
const detectionsUrl = `http://127.0.0.1:5001/get_detection_history`;
const classCountsUrl = `http://127.0.0.1:5001/get_detected_classes`;

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

async function fetchClassCounts() {
  try {
    const response = await axios.get(classCountsUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching class counts:', error);
    return {};
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

// Function to generate bar plot of class counts
async function generateBarPlot() {
  try {
    const classCounts = await fetchClassCounts();
    const labels = Object.keys(classCounts);
    const counts = Object.values(classCounts);
    
    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Detection Counts',
          data: counts,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Counts'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Classes'
            }
          }
        }
      }
    };

    const chartCanvas = `<canvas id="barChart" width="400" height="400"></canvas>`;
    const script = `<script>const ctx = document.getElementById('barChart').getContext('2d'); new Chart(ctx, ${JSON.stringify(chartConfig)});</script>`;
    
    return chartCanvas + script;
  } catch (error) {
    console.error('Error generating bar plot:', error);
    return '';
  }
}

// Route for serving the homepage
app.get('/', async (req, res) => {
  try {
    // Fetch detections from the server
    const detections = await fetchDetections();
    //console.log(detections);
    // Generate HTML for the detections table
    const detectionsTable = generateDetectionsTable(detections);

    const barPlot = await generateBarPlot();

    // Serve the HTML with the camera feed and detections table
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Industrial Station for Waste Separation</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
          
          .left-column {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          
          .right-column {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .camera-feed,
          .bar-plot {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          
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

          .bar-plot {
            flex: 1;
            margin-right: 20px;
            margin-left: 20px;
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
            border-top-left-radius: 8px;
          }
          
          tr:first-child th:last-child {
            border-top-right-radius: 8px;
          }
          
          tr:last-child td:first-child {
            border-bottom-left-radius: 8px;
          }
          
          tr:last-child td:last-child {
            border-bottom-right-radius: 8px;
          }

        </style>
      </head>
      <body>
        <div class="container">
          <div class="left-column">
            <div class="camera-feed">
              <h1>Camera Feed</h1>
              <img src="${ip}" alt="Camera Feed">
            </div>
            <div class="bar-plot">
              <h1>Class Counts</h1>
              ${barPlot}
            </div>
          </div>
          <div class="right-column">
            <div class="detections-table">
              <h1>Detections</h1>
              ${detectionsTable}
            </div>
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
