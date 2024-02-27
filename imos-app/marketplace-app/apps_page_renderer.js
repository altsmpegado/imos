const { ipcRenderer } = require('electron');

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\index.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadLibPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\lib_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadSubmitPage").addEventListener("click", function() {
    ipcRenderer.send('openDevForm');
});