# Slim images are based on Debian, but with a smaller size footprint.
FROM node:24-bookworm-slim

# Include Node.js dependencies in the image.
WORKDIR /duelyst
COPY package.json /duelyst/
COPY yarn.lock /duelyst/
COPY packages /duelyst/packages
RUN corepack enable
RUN yarn set version berry
RUN yarn workspaces focus -A --production && yarn cache clean

# Include the code in the image.
COPY version.json /duelyst/
COPY app/*.coffee /duelyst/app/
COPY app/common /duelyst/app/common
COPY app/data /duelyst/app/data
COPY app/localization /duelyst/app/localization
COPY app/sdk /duelyst/app/sdk
COPY bin /duelyst/bin
COPY config /duelyst/config
COPY server /duelyst/server
COPY worker /duelyst/worker
