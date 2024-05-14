const { ipcRenderer } = require('electron');
var request = require('request');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('configForm');
    
    const docButton = document.createElement('button');
    docButton.setAttribute('class', 'button-component');
    docButton.setAttribute('id', 'docButton');
    docButton.addEventListener('click', () => {
        window.open('https://github.com/altsmpegado/imos', '_blank');
    });
    docButton.innerText = 'Documentation';
    form.appendChild(docButton);

    var div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    var labelElement = document.createElement('label');
    labelElement.innerText = 'Application name';
    var inputElement = document.createElement('input');
    inputElement.setAttribute('id', 'appname');
    inputElement.setAttribute('type', 'text');
    inputElement.setAttribute('placeholder', 'Insert app name here');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);
    
    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'Company/Developer name';
    inputElement = document.createElement('input');
    inputElement.setAttribute('id', 'company');
    inputElement.setAttribute('type', 'text');
    inputElement.setAttribute('placeholder', 'Insert company name here');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'Version';
    inputElement = document.createElement('input');
    inputElement.setAttribute('id', 'version');
    inputElement.setAttribute('type', 'text');
    inputElement.setAttribute('placeholder', 'Insert app version info');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'About';
    inputElement = document.createElement('textarea');
    inputElement.setAttribute('id', 'about');
    inputElement.setAttribute('rows', '5');
    inputElement.setAttribute('placeholder', 'Insert app about info and description');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'Update info';
    inputElement = document.createElement('textarea');
    inputElement.setAttribute('id', 'update');
    inputElement.setAttribute('rows', '5');
    inputElement.setAttribute('placeholder', 'Insert update info');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'Extra info';
    inputElement = document.createElement('textarea');
    inputElement.setAttribute('id', 'info');
    inputElement.setAttribute('rows', '5');
    inputElement.setAttribute('placeholder', 'Insert extra info or notes for our devs');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('class', 'nice-form-group');
    labelElement = document.createElement('label');
    labelElement.innerText = 'File upload';
    inputElement = document.createElement('input');
    inputElement.setAttribute('id', 'exeFile');
    inputElement.setAttribute('rows', '5');
    inputElement.setAttribute('type', 'file');
    div.appendChild(labelElement);
    div.appendChild(inputElement);
    div.appendChild(document.createElement('br'));
    form.appendChild(div);

    div = document.createElement('div');
    div.setAttribute('id', 'statusMessage');
    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.setAttribute('class', 'button-component');
    submitButton.innerText = 'Submit';
    div.append(submitButton);
    form.appendChild(div);
});


document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const appname = document.getElementById('appname').value;
    const company = document.getElementById('company').value;
    const version = document.getElementById('version').value;
    const about = document.getElementById('about').value;
    const update = document.getElementById('update').value;
    const info = document.getElementById('info').value;
    const fileInput = document.getElementById('exeFile');
    const statusMessage = document.getElementById('statusMessage');

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
                //console.log(responseBody.objectid);
                const checkMark = document.createElement('span');
                checkMark.innerHTML = '&#10004;';
                checkMark.style.color = '#5fb15f';
                checkMark.style.marginLeft = '10px';
                statusMessage.appendChild(checkMark);
                ipcRenderer.send('submited', username, responseBody.objectid);
            }
        });
    }
});
