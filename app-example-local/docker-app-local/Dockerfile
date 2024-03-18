# Use an official Node.js image as the base image
FROM node:14 as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project directory to the working directory
COPY . .

# Build the React app for production
RUN npm run build

ARG WEBCAM_IP

# Use Nginx as the base image for serving static files
FROM nginx:alpine

# Copy the built React app from the previous stage to the Nginx HTML directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

ARG WEBCAM_IP
ENV APP_WEBCAM_IP=$WEBCAM_IP

# Start Nginx server when the container starts
CMD ["nginx", "-g", "daemon off;"]
