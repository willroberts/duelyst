#!/usr/bin/env bash

# Install bcrypt dependencies.
# TODO: Isolate bcrypt dependencies to API images only.
apt-get update && apt-get install -y python3 make gcc g++

# Install dependencies.
yarn workspaces focus -A --production && yarn cache clean

# Use exec to take over the PID from the shell, enabling signal handling.
exec yarn $1
