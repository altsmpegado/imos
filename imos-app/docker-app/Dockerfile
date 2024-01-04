# use the version that corresponds to your electron version
FROM node:20.10.0

# install electron dependencies, xvfb, and xauth
RUN apt-get update && apt-get install -y \
    git libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 libxshmfence1 libdrm2 libgbm1 xvfb xauth \
    --no-install-suggests --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# copy the source into /app
WORKDIR /app
COPY . .
RUN chown -R node /app

# install node modules and perform an electron rebuild
USER node
RUN npm install
RUN npx electron-rebuild

# Electron needs root for sandboxing
# see https://github.com/electron/electron/issues/17972
USER root
RUN chown root /app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /app/node_modules/electron/dist/chrome-sandbox

# Start D-Bus and Xvfb in the background
CMD service dbus start && Xvfb :1 -screen 0 1024x768x24 & export DISPLAY=:1 && sleep 2 && npm run start
