#!/bin/bash

echo "Creating Lambda Layer for SMS Services..."

# Current directory
CURRENT_DIR=$(pwd)

# Function to create a Lambda layer
create_lambda_layer() {
    local LAYER_NAME=$1
    local DEPENDENCIES=$2
    local OUTPUT_ZIP="${LAYER_NAME}.zip"
    local LAYER_DIR="nodejs"

    echo "Building Lambda layer: ${LAYER_NAME}"

    # Create directory structure for layer
    mkdir -p ${LAYER_DIR}

    # Create package.json with dependencies
    echo '{
  "dependencies": {
    '"$DEPENDENCIES"'
  }
}' > ${LAYER_DIR}/package.json

    # Install dependencies
    cd ${LAYER_DIR}
    echo "Installing dependencies for layer..."
    npm install --production

    # Remove package-lock.json as it's not needed
    rm -f package-lock.json

    # Go back to original directory
    cd ..

    # Create zip file for the layer
    echo "Creating layer zip file: ${OUTPUT_ZIP}"
    zip -r ${OUTPUT_ZIP} nodejs

    # Clean up
    rm -rf ${LAYER_DIR}

    echo "Lambda layer ${OUTPUT_ZIP} created successfully!"
}

# Move to the smsStack directory
cd /Users/work/Documents/development/cloud-saas-api/smsStack

# Create layer for SMS Failure Detection
create_lambda_layer "sms-common-layer" '"mongodb": "^6.15.0", "aws4": "^1.13.0"'

echo "Layer creation completed!"
