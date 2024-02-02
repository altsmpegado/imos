const { ipcRenderer } = require('electron');
var request = require('request');
const fs = require('fs');

document.getElementById('submissionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const appname = document.getElementById('name').value;
    const company = document.getElementById('company').value;
    const version = document.getElementById('ver').value;
    const about = document.getElementById('about').value;
    const update = document.getElementById('update').value;
    const info = document.getElementById('info').value;
    const fileInput = document.getElementById('exeFile');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileStream = fs.createReadStream(file.path);

        var options = {
            'method': 'POST',
            'url': 'http://localhost:8000/submit',
            formData: {
                'appname': appname,
                'company': company,
                'version': version,
                'about': about,
                'update': update,
                'info': info,
                'file': {
                    value: fileStream,
                    options: {
                        filename: file.name,
                        contentType: null,
                    },
                },
                'state': 'false'
            }
        };
        
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            if(response.body.includes("submited")){
                ipcRenderer.send('submited');
            }
        });
    }
});

