const { ipcRenderer } = require('electron');
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

        // Send the registration data and file content to the main process
        ipcRenderer.send('submit', {
            appname,
            company,
            version,
            about,
            update,
            info,
            file: {
                value: fileStream,
                options: {
                    filename: file.name,
                    contentType: null,
                },
            },
        });
    } else {
        // Handle the case when no file is selected
        console.error('No file selected');
    }
});

