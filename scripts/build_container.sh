#!/usr/bin/env bash

# Helper function for error handling.
quit () {
	echo $1
	exit 1
}

# Parse arguments.
SERVICE=$1
if [ -z $SERVICE ]; then quit "Usage: build_container.sh <service> <version>"; fi
VERSION=$2
if [ -z $VERSION ]; then VERSION=testing; fi

if [ $SERVICE == "api" ]; then
	# Rebuild the bcrypt image if needed.
	echo "Building image for duelyst-bcrypt:$VERSION."
	docker build \
		-f docker/bcrypt.Dockerfile \
		-t duelyst-bcrypt:$VERSION \
		. || quit "Failed to build bcrypt image!"
else
	# Rebuild the base Node.js image if needed.
	echo "Building image for duelyst-nodejs:$VERSION."
	docker build \
		-f docker/nodejs.Dockerfile \
		-t duelyst-nodejs:$VERSION \
		. || quit "Failed to build Node.js image!"
fi

# Build the service image.
docker build \
	-f docker/$SERVICE.Dockerfile \
	-t duelyst-$SERVICE:$VERSION \
	--build-arg NODEJS_IMAGE_VERSION=$VERSION \
	. || quit "Failed to build service image!"

echo "Successfully built image duelyst-${SERVICE}:${VERSION}"
