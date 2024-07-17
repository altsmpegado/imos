const { ipcRenderer } = require('electron');
var request = require('request');
const fs = require('fs');

/**
 * Event listener when DOM content is fully loaded.
 * Dynamically generates form elements for app configuration.
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('configForm');

    // Add Documentation button
    const docButton = document.createElement('button');
    docButton.setAttribute('class', 'button-component');
    docButton.setAttribute('id', 'docButton');
    docButton.addEventListener('click', () => {
        window.open('https://github.com/altsmpegado/imos', '_blank');
    });
    docButton.innerText = 'Documentation';
    form.appendChild(docButton);

    // Dynamically create form groups for app configuration
    [
        { label: 'Application name', id: 'appname', type: 'text', placeholder: 'Insert app name here' },
        { label: 'Company/Developer name', id: 'company', type: 'text', placeholder: 'Insert company name here' },
        { label: 'Version', id: 'version', type: 'text', placeholder: 'Insert app version info' },
        { label: 'About', id: 'about', type: 'textarea', rows: '5', placeholder: 'Insert app about info and description' },
        { label: 'Labels', id: 'labels', type: 'text', placeholder: 'Insert app labels here' },
        { label: 'Update info', id: 'update', type: 'textarea', rows: '5', placeholder: 'Insert update info' },
        { label: 'Extra info', id: 'info', type: 'textarea', rows: '5', placeholder: 'Insert extra info or notes for our devs' },
        { label: 'File upload', id: 'exeFile', type: 'file' }
    ].forEach(({ label, id, type, placeholder, rows }) => {
        const div = document.createElement('div');
        div.setAttribute('class', 'nice-form-group');
        const labelElement = document.createElement('label');
        labelElement.innerText = label;
        const inputElement = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        inputElement.setAttribute('id', id);
        if (type === 'textarea') {
            inputElement.setAttribute('rows', rows);
        }
        inputElement.setAttribute('type', type);
        inputElement.setAttribute('placeholder', placeholder);
        div.appendChild(labelElement);
        div.appendChild(inputElement);
        div.appendChild(document.createElement('br'));
        form.appendChild(div);
    });

    // Add status message container
    const statusDiv = document.createElement('div');
    statusDiv.setAttribute('id', 'statusMessage');
    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.setAttribute('class', 'button-component');
    submitButton.innerText = 'Submit';
    statusDiv.append(submitButton);
    form.appendChild(statusDiv);
});

/**
 * Function to handle form submission for app configuration.
 * Collects form data, prepares file for upload, and sends a POST request to the server.
 * Displays submission status and triggers IPC message upon successful submission.
 * @param {Event} event - The submit event triggered by the form submission.
 */
document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Collect form data
    const appname = document.getElementById('appname').value;
    const company = document.getElementById('company').value;
    const version = document.getElementById('version').value;
    const about = document.getElementById('about').value;
    const labels = document.getElementById('labels').value;
    const update = document.getElementById('update').value;
    const info = document.getElementById('info').value;
    const fileInput = document.getElementById('exeFile');
    const statusMessage = document.getElementById('statusMessage');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileStream = fs.createReadStream(file.path);

        var options = {
            'method': 'POST',
            'url': `http://${process.env.IMOS_SERVER_CON}/submit`,
            formData: {
                'appname': appname,
                'company': company,
                'version': version,
                'about': about,
                'labels': labels,
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

            if (responseBody.string.includes("submited")) {
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
