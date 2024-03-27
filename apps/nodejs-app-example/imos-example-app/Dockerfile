FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# define metadata variables
ENV PORT=default_value
ENV WEBCAM_IP=default_ip_address
LABEL "com.example.required-configs"="PORT, CAMERA_IP"

EXPOSE 3000

CMD ["node", "app.js"]
