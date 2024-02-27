const { ipcRenderer } = require('electron');

document.getElementById("loadAppsPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\apps_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\index.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadSubmitPage").addEventListener("click", function() {
    ipcRenderer.send('openDevForm');
});