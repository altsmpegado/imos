const { ipcRenderer } = require('electron');
const fs = require('fs');

function clickApp(){
  const appcard = document.querySelectorAll(".product");
  appcard.forEach((item)=>{ 
    item.addEventListener('click', (event) =>{
      event.preventDefault();
      const data = item.dataset.app;
      console.log(data);
      ipcRenderer.send('openAppWindow', data)
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const data = fs.readFileSync('userData/session.json', 'utf8');
  var { type } = JSON.parse(data);
  // Fetch app information from the server
  fetch('http://localhost:8000/apps')
    .then((response) => response.json())
    .then((apps) => {
      const appListDiv = document.getElementById('apps-container');
      
      apps.forEach((app) => {
        console.log(app);
        const cardHtml = `
        <div class="product-card">
          <a href="0#" class="product" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}">
            <img class="app-icon" src="C:\\imos\\imos-app\\marketplace-app\\views\\apps.8985.13655054093851568.1c669dab-3716-40f6-9b59-de7483397c3a.png"></img>
            <div class="info-container">
              <p class="title">${app.name}</p>
              <div class="subtitle">
                <div class="rating-element">
                  <span class="label">4.2</span>
                  <span class="label">&#9733;</span>
                </div>
                <div class="text-ellipsis">| ${app.company}</div>
              </div>
            </div>
            <div class="price-container">
              <button class="more-button">More</button>
            </div>
          </a>
        </div>
        `
        appListDiv.innerHTML += cardHtml;
        clickApp();
      });
    })
    .catch((error) => {
      console.error('Error fetching app information:', error);
    });

    if (type == 'developer') {
      const moreFuncDiv = document.getElementById('btn-top');
      const devButton = document.createElement('button');
      devButton.classList.add('sidebtn');
  
      // Create the icon element and add it to the button
      const icon = document.createElement('i');
      icon.classList.add('material-symbols-outlined');
      icon.textContent = 'new_window'; // Set the icon's text content to the desired material icon identifier
  
      devButton.appendChild(icon); // Add the icon to the button
  
      devButton.addEventListener('click', () => {
        ipcRenderer.send('openDevForm');
      });
  
      moreFuncDiv.appendChild(devButton);
    /*
    const subStateButton = document.createElement('button');
    subStateButton.textContent = 'Submissions';
    subStateButton.classList.add('btn-bot'); 
    subStateButton.addEventListener('click', () => {
      ipcRenderer.send('openSubmissions');
    });
    
    moreFuncDiv.appendChild(subStateButton);
    */
  }

  
});