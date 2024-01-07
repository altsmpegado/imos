// renderer.js

/*
const video = document.getElementById('camera');

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error('Error accessing camera:', error.message);
  });

navigator.mediaDevices.enumerateDevices()
    .then(devices => {
    console.log('Available devices:', devices);
    })
    .catch(error => {
    console.error('Error enumerating devices:', error.message);
});
*/

// Acces to web ip camera
document.addEventListener('DOMContentLoaded', () => {
  const img = document.createElement('img');
  img.src = 'https://192.168.1.75:5000/video_feed';

  document.body.appendChild(img);
});