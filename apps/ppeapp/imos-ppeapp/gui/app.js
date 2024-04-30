const express = require('express');
const app = express();
const axios = require('axios');

const port = process.env.GUI_PORT.split(":")[1] || 3000;
const detector_port = process.env.MODEL_DETECTOR_PORT.split(":")[1] || 5001;
const ip = `http://localhost:${detector_port}/processed_video_feed`;
const detectionsUrl = `http://host.docker.internal:${detector_port}/get_detection_history`;
const classCountsUrl = `http://host.docker.internal:${detector_port}/get_detected_classes`;

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
    //console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching class counts:', error);
    return {};
  }
}

// Function to generate HTML for the detections table
function generateDetectionsTable(detectionObject) {
  //console.log(detectionObject);
  const detectionsArray = detectionObject.slice(-20);

  let tableHtml = '<table>';
  tableHtml += '<tr><th>Timestamp</th><th>Class</th><th>Confidence</th><th>Xmin</th><th>Ymin</th><th>Xmax</th><th>Ymax</th></tr>';
  
  detectionsArray.forEach((detections, index) => {
    detections.forEach(detection => {

      tableHtml += `<tr onclick="displayFrame('${detection.frame}')">
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
    
    const backgroundColors = [
      'rgba(255, 99, 132, 0.5)', // Red
      'rgba(54, 162, 235, 0.5)', // Blue
      'rgba(255, 206, 86, 0.5)', // Yellow
      'rgba(75, 192, 192, 0.5)', // Green
      'rgba(153, 102, 255, 0.5)', // Purple
      'rgba(255, 159, 64, 0.5)', // Orange
      'rgba(201, 203, 207, 0.5)' // Gray
    ];

    const borderColor = 'rgba(0, 0, 0, 0.5)';

    const datasets = labels.map((label, index) => {
      return {
        label: label,
        data: [counts[index]],
        backgroundColor: backgroundColors[index],
        borderColor: borderColor,
        borderWidth: 1
      };
    });

    const chartConfig = {
      type: 'bar',
      data: {
        labels: [''], // Empty label as we're not displaying labels in the legend
        datasets: datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            },
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

    const chartCanvas = `<canvas id="barChart" width="640" height="610"></canvas>`;
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          
          .title-container {
            text-align: center;
          }
          
          .main-container {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 25px;
          }
          
          .left-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items:center;
          }
          
          .right-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items:center;
          }

          .camera-feed,
          .bar-plot,
          .detections-table {
            background-color: #fff;
            border-radius: 8px;
            padding: 35px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }

          .camera-feed {
            flex: 1;
            margin-right: 20px;
          }

          .bar-plot {
            margin-right: 20px;
            height: 665px;
          }
          
          .detections-table {
            flex: 1;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }
          
          .modal-image {
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          }
          
          .material-symbols-outlined {
            font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 0,
            'opsz' 48;
            margin-left: 10px;
            color: #44bd3b;
            font-size: xx-large;
          }
          
          h1 {
            font-size: 40px;
          }

          h2 {
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
        <div class="title-container">
          <h1 class="title">PPE Safety Detection in Industry<span class="material-symbols-outlined">factory</span></h1>
          <h2>by imos</h2>
        </div>
        <div class="main-container">
          <div class="left-column">
            <div class="camera-feed">
              <h2>Camera Feed</h2>
              <img src="${ip}" alt="Camera Feed">
            </div>
            <div class="bar-plot">
              <h2>Class Counts</h2>
              ${barPlot}
            </div>
          </div>
          <div class="right-column">
            <div class="detections-table">
              <h2>Detections</h2>
              ${detectionsTable}
            </div>
          </div>
        </div>
        <script>
          function displayFrame(frameBase64) {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';

            const img = document.createElement('img');
            img.src = \`data:image/jpeg;base64,\${frameBase64}\`;
            img.className = 'modal-image';

            modalOverlay.appendChild(img);

            document.body.appendChild(modalOverlay);

            modalOverlay.addEventListener('click', () => {
              modalOverlay.remove();
            });
          }
        </script>
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
