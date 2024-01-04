# https://trigodev.com/blog/develop-electron-in-docker
# https://medium.com/geekculture/run-a-gui-software-inside-a-docker-container-dce61771f9
# https://dev.to/darksmile92/run-gui-app-in-linux-docker-container-on-windows-host-4kde

FROM node:20.10.0

# Install electron dependencies, xvfb, xauth, and dbus
RUN apt-get update && apt-get install -y \
    git libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 libxshmfence1 libdrm2 libgbm1 xvfb xauth dbus \
    --no-install-suggests --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set up display and D-Bus
ENV DISPLAY=:0
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=/host/run/dbus/session_bus_socket

# Create dummy D-Bus sockets
RUN mkdir -p /host/run/dbus/ && \
    touch /host/run/dbus/system_bus_socket && \
    touch /host/run/dbus/session_bus_socket

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Disable GPU acceleration and set additional options
ENV ELECTRON_DISABLE_GPU=true
CMD ["npm", "start", "--", "--disable-gpu"]