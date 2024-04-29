docker build -t my-nodered-app .

docker run -p 1880:1880 --name my-nodered-container my-nodered-app
