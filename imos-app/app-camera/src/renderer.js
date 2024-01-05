// renderer.js
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
  // Your logic to handle the list of available devices
})
.catch(error => {
  console.error('Error enumerating devices:', error.message);
});
