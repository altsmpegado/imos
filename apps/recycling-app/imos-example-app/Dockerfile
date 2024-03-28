FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# define metadata variables
LABEL "required-configs"="PORT, WEBCAM_IP"

EXPOSE 3000

CMD ["node", "app.js"]
