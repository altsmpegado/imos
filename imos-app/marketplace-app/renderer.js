const { ipcRenderer } = require('electron');
const fs = require('fs');

function clickApp(){
  const appcard = document.querySelectorAll(".appcard");
  appcard.forEach((item)=>{
    const data = item.dataset.app;
    item.addEventListener('click', ()=>{
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
      const appListDiv = document.getElementById('appList');
      
      // Create download button for each app
      apps.forEach((app) => {
        console.log(app);
        const cardHtml = `
        <div class="col-xl-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s" style="visibility: visible; animation-delay: 0.3s; animation-name: fadeInUp;">
            <div class="themes-box">
                <div class="thumb">
                    <img src="assets/images/unique-theme/unique-2.png" alt="">
                    <div class="button-box">
                        <a href="#0" class="appcard link link-1" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}"><i class="far fa-eye"></i></a>
                        <!--a href="#0" class="link link-2"><i class="fas fa-cart-plus"></i></a-->
                        <!--a href="#0" class="link link-3"><i class="fas fa-heart"></i></a-->
                    </div>
                </div>
                <div class="main-content">
                    <h5><a class="appcard" href="#0" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}">${app.name}</a></h5>
                    <div class="last-part">
                        <div class="right">
                            <p class="text">
                                by <a href="#0" class="link">${app.company}</a> in <a href="#0" class="link">Agency</a>
                            </p>
                            <div class="review">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                                <i class="far fa-star"></i>
                            </div>
                        </div>
                        <div class="left-content">
                            <h3 class="subtitle">59€</h3>
                            <span>1247 Downloads</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
        appListDiv.innerHTML += cardHtml;
        clickApp();
      });
    })
    .catch((error) => {
      console.error('Error fetching app information:', error);
    });

  if (type == 'developer'){
    const moreFuncDiv = document.getElementById('moreFunc');
    const devButton = document.createElement('button');
    devButton.textContent = 'Submit App';
    devButton.classList.add('main-btn'); 
    devButton.addEventListener('click', () => {
      ipcRenderer.send('openDevForm');
    });
    moreFuncDiv.appendChild(devButton);
    
    const subStateButton = document.createElement('button');
    subStateButton.textContent = 'Submissions';
    subStateButton.classList.add('main-btn'); 
    subStateButton.addEventListener('click', () => {
      ipcRenderer.send('openSubmissions');
    });
    
    moreFuncDiv.appendChild(subStateButton);
  }
  
});