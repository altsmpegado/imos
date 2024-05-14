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

            const responseBody = JSON.parse(response.body);
            const data = fs.readFileSync('userData/session.json', 'utf8');
            var { username } = JSON.parse(data);
            //console.log(responseBody);
            if(responseBody.string.includes("submited")){
                console.log(responseBody.objectid);
                ipcRenderer.send('submited', username, responseBody.objectid);
            }
        });
    }
});

document.getElementById('button_doc').addEventListener('click', () => {
    ipcRenderer.send('openSubDoc');
});






document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('configForm');
    
    const div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');

    const labelElement = document.createElement('label');
    labelElement.innerText = 'Application name' + ': ';
    
    const inputElement = document.createElement('input');
    inputElement.setAttribute('type', 'appname');
    inputElement.setAttribute('type', 'text');
    inputElement.setAttribute('placeholder', 'insert app name');

    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);
    

    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.setAttribute('class', 'button-component');
    submitButton.innerText = 'Submit';
    form.appendChild(submitButton);
});


document.getElementById('configForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const configData = {};
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        configData[input.id] = input.value;
    });
    ipcRenderer.send('set', { appName, type, ...configData });
});
