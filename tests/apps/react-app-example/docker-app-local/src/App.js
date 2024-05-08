import React, { useEffect, useState } from 'react';

function App() {
  const [cameraFeedError, setCameraFeedError] = useState(false);

  useEffect(() => {
    const ip = process.env.WEBCAM_IP;
    console.log('APP_WEBCAM_IP:', ip);
    console.log(typeof(ip));
    const img = document.createElement('img');
    img.src = `http://${ip}/video_feed`;
    console.log(`http://${ip}/video_feed`);

    img.onload = () => {
      document.body.appendChild(img);
    };

    img.onerror = (error) => {
      console.error('Error loading camera feed:', error);
      setCameraFeedError(true);
    };
  }, []);

  return (
    <div>
      <h1>Hello from React!</h1>
      {cameraFeedError && <p id="info">Failed to load camera feed.</p>}
    </div>
  );
}

export default App;