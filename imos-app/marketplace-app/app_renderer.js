const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    let isAppOwned = false;

  ipcRenderer.on('appInfo', (event, appjson, user) => {
    // Check user's ownedApps
    //console.log(user);
    fetch(`http://localhost:8000/apps/${user}`)
    .then((response) => response.json())
    .then(data => {
    // Handle the data received from the server
        //console.log(data.ownedApps);
        isAppOwned = data.ownedApps.includes(appjson.name);
        //console.log(isAppOwned);
        updateButton();
    })
        .catch(error => {
        console.error('Error fetching user owned apps:', error);
    });

    const appInfoDiv = document.getElementById('appInfo');
    appInfoDiv.innerHTML = `
    <div class="row">
        <div class="col-xl-4 col-lg-6">
            <div class="product-information-content  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                <div class="pi-content">
                    <img src="assets/images/pd-icon-1.png" alt="">

                    <h4>${appjson.name}</h4>
                    <a href="author-product.html" class="linko">${appjson.company} Portfolio</a>
                    <div class="icon-box">
                        <a class="sit-preview item" href="assets/images/unique-theme/unique-1.png">
                            <img alt="Linnor - Digital Agency Wordpress Theme" class="envato-preview" data-item-currency="$" src="assets/images/new-item/new-1.png" data-preview-url="assets/images/unique-theme/unique-1.png" data-item-name="Smart CRON Tools" data-item-cost="69" data-item-category="WordPress" data-item-author="DivDojo">
                        </a>
                        <a class="sit-preview item" href="assets/images/unique-theme/unique-2.png">
                            <img alt="Linnor - Digital Agency Wordpress Theme" class="envato-preview" data-item-currency="$" src="assets/images/new-item/new-2.png" data-preview-url="assets/images/unique-theme/unique-2.png" data-item-name="Smart CRON Tools" data-item-cost="69" data-item-category="WordPress" data-item-author="DivDojo">
                        </a>
                        <a class="sit-preview item" href="assets/images/unique-theme/unique-3.png">
                            <img alt="Linnor - Digital Agency Wordpress Theme" class="envato-preview" data-item-currency="$" src="assets/images/new-item/new-3.png" data-preview-url="assets/images/unique-theme/unique-3.png" data-item-name="Smart CRON Tools" data-item-cost="69" data-item-category="WordPress" data-item-author="DivDojo">
                        </a>

                    </div>
                </div>
                <div class="price-rating">
                    <h3 class="priced">$59.00</h3>
                    <div class="rating">
                        <span>
                            02 Review </span>
                        <span class="i-box">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="far fa-star"></i>
                        </span>

                    </div>
                </div>
                <div class="button-boxo">
                    <span class="info">
                        <i class="fas fa-cart-plus"></i> 498 Sale
                    </span>
                    <span class="info">
                        <i class="fas fa-star"></i> 231 Rating
                    </span>
                </div>
                <div class="button-2">
                    <button class="main-btn one">
                        Add To Cart
                    </button>
                    <button id="downloadButton" class="main-btn one hidden">Download</button>
                    <button id="acquireButton" class="main-btn one hidden">Acquire</button>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                <div class="left-box">
                    <p class="text">Last update :</p>
                    <p class="text">Version :</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link"> 28 December 2021 </a>
                    <a href="#0" class="link version"> 2.01 </a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                <div class="left-box">
                    <p class="text">Released :</p>
                    <p class="text">Frame work :</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link"> 28 December 2021 </a>
                    <a href="#0" class="link"> Underscore </a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Support :</p>
                    <p class="text">Documented :</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link"> 12 Hours in a Day </a>
                    <a href="#0" class="link"> Themes &amp; Plugins </a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Compatible Browsers</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link"> Chrome </a>
                    <a href="#0" class="link"> Edge </a>
                    <a href="#0" class="link"> Firefox </a>
                    <a href="#0" class="link"> IE10 </a>
                    <a href="#0" class="link"> IE11 </a>
                    <a href="#0" class="link"> Opera </a>
                    <a href="#0" class="link"> Safari </a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Compatible With</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">bbPress 2.5.x</a>
                    <a href="#0" class="link">BuddyPress 4.1.x Easy</a>
                    <a href="#0" class="link">Digital Downloads</a>
                    <a href="#0" class="link">Events Calendar</a>
                    <a href="#0" class="link">Events Calendar Pro</a>
                    <a href="#0" class="link">Gravity Forms</a>
                    <a href="#0" class="link">WooCommerce 3.6.x</a>
                    <a href="#0" class="link">WPML</a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Software Version</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">WordPress 4.5</a>
                    <a href="#0" class="link">WordPress 4.5.1</a>
                    <a href="#0" class="link">WordPress 4.5.2</a>
                    <a href="#0" class="link">WordPress 4.5.x</a>
                    <a href="#0" class="link">WordPress 4.6</a>
                    <a href="#0" class="link">WordPress 4.6.1</a>
                    <a href="#0" class="link">WordPress 4.7.x</a>
                </div>
            </div>

            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Files Included</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">CSS Files,</a>
                    <a href="#0" class="link">JS Files,</a>
                    <a href="#0" class="link">Layered PSD,</a>
                    <a href="#0" class="link">HTML File,</a>
                    <a href="#0" class="link">PHP Files</a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Columns Layout</p>
                    <p class="text">Layout</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">4+,</a>
                    <a href="#0" class="link">Responsive</a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">License</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">Extended License,</a>
                    <a href="#0" class="link">Regular License,</a>
                </div>
            </div>
            <div class="product-information  wow fadeInUp" style="visibility: visible; animation-name: none;">
                <div class="left-box">
                    <p class="text">Tag :</p>
                </div>
                <div class="right-box">
                    <a href="#0" class="link">business,</a>
                    <a href="#0" class="link">Car,</a>
                    <a href="#0" class="link">Insurance,</a>
                    <a href="#0" class="link">corporate,</a>
                    <a href="#0" class="link">websites,</a>
                    <a href="#0" class="link">finance,</a>
                    <a href="#0" class="link">health,</a>
                    <a href="#0" class="link">insurance,</a>
                    <a href="#0" class="link">insurance,</a>
                    <a href="#0" class="link">insurance,</a>
                    <a href="#0" class="link">insurance agency,</a>
                    <a href="#0" class="link">insurance company,</a>
                    <a href="#0" class="link">insurance theme,</a>
                    <a href="#0" class="link">life insurance</a>
                </div>
            </div>
        </div>
        <div class="col-xl-8">
            <div class="detsils-box">
                <div class="box-one">
                    <div class="thumb open-gallery  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                        <div class="overlay">
                            <div class="content">
                                <div class="icon"><i class="far fa-image"></i></div>
                                <p class="text">Screenshots </p>
                            </div>
                        </div>
                        <img src="assets/images/product-details.png" alt="product-details">
                        <div class="parent-container">
                            <a class="btn-gallery" href="assets/images/feature-item/feature-1.png"></a>
                            <a class="btn-gallery" href="assets/images/feature-item/feature-2.png"></a>
                            <a class="btn-gallery" href="assets/images/feature-item/feature-3.png"></a>
                        </div>
                    </div>
                    <div class="total-link  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                        <div class="links-box-left">
                            <a href="#0" class="link one"> <i class="fas fa-eye"></i> Live Preview</a>
                            <a href="#0" class="link two open-gallery"> <i class="far fa-image"></i>
                                Screenshots</a>
                        </div>
                        <div class="links-box-right">
                            <a href="#0" class="link "><i class="fab fa-facebook-f"></i></a>
                            <a href="#0" class="link two"><i class="fab fa-twitter"></i></a>
                            <a href="#0" class="link"><i class="fab fa-google"></i></a>
                        </div>
                    </div>
                </div>
                <div class="box-two">
                    <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="pills-description-tab" data-bs-toggle="pill" data-bs-target="#pills-description" type="button" role="tab" aria-controls="pills-description" aria-selected="true">Description</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="pills-additional-information-tab" data-bs-toggle="pill" data-bs-target="#pills-additional-information" type="button" role="tab" aria-controls="pills-additional-information" aria-selected="false">Additional Information</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="pills-review-tab" data-bs-toggle="pill" data-bs-target="#pills-review" type="button" role="tab" aria-controls="pills-review" aria-selected="false">Reviews</button>
                        </li>
                    </ul>
                    <div class="tab-content" id="pills-tabContent">
                        <div class="tab-pane fade show active" id="pills-description" role="tabpanel" aria-labelledby="pills-description-tab">
                            <div class="content  wow fadeInUp" style="visibility: visible; animation-name: fadeInUp;">
                                <div class="content-one">
                                    <h3 class="subtitle">${appjson.name}</h3>
                                    <p class="text one">
                                        ${appjson.info} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Haec quo modo
                                        conveniant, non sane intellego. Hanc ergo intuens debet institutum illud
                                        quasi
                                        signum absolvere. Et ille ridens: Video, inquit, quid agas; Duo Reges:
                                        constructio interrete. Ad eos igitur converte te, quaeso. Atque haec ita
                                        iustitiae propria sunt, ut sint virtutum reliquarum communia.
                                    </p>
                                    <p class="text two">
                                        It is a long established fact that a reader will be distracted by the
                                        readable
                                        content of a page when looking at its layout. The point of using Lorem
                                        Ipsum is
                                        that it has a more-or-less normal distribution of letters, as opposed to
                                        using
                                        ‘Content here, content here’, making it look like readable English. Many
                                        desktop
                                        publishing packages and web page editors now use Lorem Ipsum as their
                                        default
                                        model text, and a search for ‘lorem ipsum’ will uncover many web sites
                                        still in
                                        their infancy. Various versions have evolved over the years, sometimes
                                        by
                                        accident, sometimes on purpose.
                                    </p>
                                </div>
                                <div class="product-feature">
                                    <h4 class="lasthead">Theme Feature</h4>
                                    <ul class="list">
                                        <li class="list-item"> Software – WordPress </li>
                                        <li class="list-item">Compatible Browsers – IE9+, Chrome, Safari, Opera,
                                            Firefox
                                        </li>
                                        <li class="list-item">Documentation – Yes </li>
                                        <li class="list-item">License – GPL </li>
                                        <li class="list-item">Version – 1.0.1 </li>
                                        <li class="list-item">Layout – Responsive </li>
                                        <li class="list-item">Columns – 4 </li>
                                        <li class="list-item">Files Included – php, html, JS, css </li>
                                        <li class="list-item">Compatible with – Elementor </li>
                                    </ul>
                                    <p class="text">
                                        The standard chunk of Lorem Ipsum used since the 1500s is reproduced
                                        below for
                                        those interested. Sections 1.10.32 and 1.10.33 from “de Finibus Bonorum
                                        et
                                        Malorum” by Cicero are also reproduced in their exact original form,
                                        accompanied
                                        by English versions from the 1914 translation by H. Rackham
                                    </p>
                                </div>
                                <div class="product-feature source">
                                    <h4 class="lasthead">Sources and Credits:</h4>
                                    <ul class="list">
                                        <li class="list-item"> Bootstrap v4.0.0 </li>
                                        <li class="list-item"> jQuery v3.3.1 </li>
                                        <li class="list-item"> Animate CSS </li>
                                        <li class="list-item"> FontAwesome </li>
                                        <li class="list-item"> Smoothscroll </li>
                                        <li class="list-item"> Parallax</li>
                                        <li class="list-item"> Columns – 4 </li>
                                        <li class="list-item"> Owl carosel </li>
                                        <li class="list-item"> isotop </li>
                                        <li class="list-item"> Waypoints</li>
                                        <li class="list-item"> Countdown </li>
                                        <li class="list-item"> WOW </li>
                                        <li class="list-item"> sPreoader </li>
                                    </ul>
                                    <p class="text dark">
                                        Note: Images are not included with the main files. They are used for
                                        preview
                                        purposes only
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="pills-additional-information" role="tabpanel" aria-labelledby="pills-additional-information-tab">
                            <div class="additional-information-box">
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Gutenberg Optimized </p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">Yes</a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">High Resolution </p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link"> Yes </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Widget Ready</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link"> Yes </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Compatible Browsers </p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link"> Chrome, Edge, Firefox, IE10, IE11, Opera,
                                            Safari </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Compatible With</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link"> bbPress 2.5.x, BuddyPress 4.1.x, Easy Digital
                                            Downloads, Events Calendar, Events Calendar Pro, Gravity Forms,
                                            WooCommerce 3.6.x, WPML </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Software Version</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">
                                            WordPress 4.5, WordPress 4.5.1, WordPress 4.5.2, WordPress 4.5.x,
                                            WordPress 4.6, WordPress 4.6.1, WordPress 4.7.x, WordPress 4.8.x,
                                            WordPress 4.9.x, WordPress 5.0.x, WordPress 5.1.x, WordPress 5.2.x
                                        </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Files Included</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">
                                            CSS Files, JS Files, Layered PSD, PHP Files </a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Columns</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">4</a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Layout</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">
                                            Responsive</a>
                                    </div>
                                </div>
                                <div class="info-box">
                                    <div class="left-box">
                                        <p class="text">Documentation</p>
                                    </div>
                                    <div class="right-box">
                                        <a href="#0" class="link">
                                            Well Documented</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="pills-review" role="tabpanel" aria-labelledby="pills-review-tab">
                            <div class="review-box">
                                <div class="single-item">
                                    <div class="review-man">
                                        <img src="./assets/images/review/review-1.png" alt="review-man">
                                    </div>
                                    <div class="content">
                                        <div class="name-other">
                                            <h6 class="headsix">Ahmad Curtis </h6>
                                            <div class="rating">
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                            </div>
                                            <p class="text">15 minutes ago</p>

                                        </div>
                                        <p class="text">
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ducimus
                                            quas asperiores nesciunt itaque architecto. Velit quam, minus
                                            corporis repellendus ex libero doloremque quod unde est.
                                        </p>
                                    </div>
                                </div>
                                <div class="single-item">
                                    <div class="review-man">
                                        <img src="./assets/images/review/review-3.png" alt="review-man">
                                    </div>
                                    <div class="content">
                                        <div class="name-other">
                                            <h6 class="headsix">Ahmad Curtis </h6>
                                            <div class="rating">
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                            </div>
                                            <p class="text">39 minutes ago</p>

                                        </div>
                                        <p class="text">
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ducimus
                                            quas asperiores nesciunt itaque architecto. Velit quam, minus
                                            corporis repellendus ex libero doloremque quod unde est.
                                        </p>
                                    </div>
                                </div>
                                <div class="single-item">
                                    <div class="review-man">
                                        <img src="./assets/images/review/review-2.png" alt="review-man">
                                    </div>
                                    <div class="content">
                                        <div class="name-other">
                                            <h6 class="headsix">Ahmad Curtis </h6>
                                            <div class="rating">
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                            </div>
                                            <p class="text">11 minutes ago</p>

                                        </div>
                                        <p class="text">
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ducimus
                                            quas asperiores nesciunt itaque architecto. Velit quam, minus
                                            corporis repellendus ex libero doloremque quod unde est.
                                        </p>
                                    </div>
                                </div>
                                <div class="single-item">
                                    <div class="review-man">
                                        <img src="./assets/images/review/review-4.png" alt="review-man">
                                    </div>
                                    <div class="content">
                                        <div class="name-other">
                                            <h6 class="headsix">Ahmad Curtis </h6>
                                            <div class="rating">
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                                <i class="fas fa-star"></i>
                                            </div>
                                            <p class="text">18 minutes ago</p>

                                        </div>
                                        <p class="text">
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ducimus
                                            quas asperiores nesciunt itaque architecto. Velit quam, minus
                                            corporis repellendus ex libero doloremque quod unde est.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    const appTitle = document.getElementById('appTitle');
    appTitle.innerText = appjson.name;
    
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.addEventListener('click', () => {
    ipcRenderer.send('downloadFile', { id: appjson.files.toString() });
    });
    
    const acquireButton = document.getElementById('acquireButton');
    acquireButton.addEventListener('click', () => {
    ipcRenderer.send('acquireApp', user, appjson.name.toString());
    });
    
    function updateButton() {
        if (isAppOwned) {
            downloadButton.style.display = 'block';
            acquireButton.style.display = 'none';
        } else {
            downloadButton.style.display = 'none';
            acquireButton.style.display = 'block';
        }
    }
  });

  ipcRenderer.on('downloadCompleted', (event, filePath) => {
    console.log(`File downloaded successfully to ${filePath}`);
  });

  ipcRenderer.on('appAcquired', (event) => {
    console.log('App Acquired Successfully');
    location.reload();
  });
  
});
