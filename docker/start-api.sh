#!/usr/bin/env bash

# Install bcrypt dependencies.
apt update && apt install -y python3 make gcc g++

# Install dependencies.
yarn workspaces focus -A --production && yarn cache clean

# Use exec to take over the PID from the shell, enabling signal handling.
exec yarn $1
