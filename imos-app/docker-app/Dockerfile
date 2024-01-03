# use the version that corresponds to your electron version
FROM node:14.16

# install electron dependencies
RUN apt-get update && apt-get install -y \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm-intel1 \
    libdrm-amdgpu1 \
    libdrm-nouveau2 \
    libdrm-radeon1 \
    libgl1-mesa-dri \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgtk-3-0 \
    libxss1 \
    libxtst6 \
    libnss3 \
    libasound2

# copy the source into /app
WORKDIR /app
COPY . .
RUN chown -R node /app

# install node modules and perform an electron rebuild
USER node
RUN npm install -g electron && npm install && npx electron-rebuild

# Electron needs root for sandboxing
# see https://github.com/electron/electron/issues/17972
USER root
RUN chown root /app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /app/node_modules/electron/dist/chrome-sandbox

# Electron doesn't like to run as root
USER node
CMD bash
