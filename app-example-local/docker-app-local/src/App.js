import React, { useEffect, useState } from 'react';

function App() {
  const [cameraFeedError, setCameraFeedError] = useState(false);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = 'http://192.168.43.132:5000/video_feed';

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
