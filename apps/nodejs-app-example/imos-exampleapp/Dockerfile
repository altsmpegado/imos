FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# define metadata variables
LABEL com.available.configs="PORT, WEBCAM_IP" \
      com.required.configs="WEBCAM_IP" \
      com.user.display="True"

#EXPOSE 3000

CMD ["node", "app.js"]
