FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# define metadata variables
LABEL com.required.configs="PORT, WEBCAM_IP" \
      com.user.display="True"

#EXPOSE 3000

CMD ["node", "app.js"]
