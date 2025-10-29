#!/bin/bash

echo "Creating optimized Lambda zip packages..."

# Current directory
CURRENT_DIR=$(pwd)

# Function to create a Lambda package
create_lambda_package() {
    local FUNCTION_DIR=$1
    local OUTPUT_ZIP=$2
    local TEMP_DIR="temp_packaging"

    echo "Packaging $FUNCTION_DIR to $OUTPUT_ZIP..."

    # Create temp directory
    mkdir -p $TEMP_DIR

    # Copy required files (excluding node_modules, tests, etc.)
    rsync -av --exclude="node_modules" --exclude="__tests__" --exclude="__mocks__" \
          --exclude="features" --exclude="cucumber*" --exclude=".git*" \
          --exclude="*.zip" --exclude="temp_packaging" \
          $FUNCTION_DIR/* $TEMP_DIR/

    # Install production dependencies only, excluding AWS SDK packages
    cd $TEMP_DIR
    echo "Installing production dependencies (excluding AWS SDK)..."

    # Copy package.json first
    cp ../package.json ./package.json



    # Create zip file
    echo "Creating zip file..."
    zip -r ../$OUTPUT_ZIP * -x "*.git*" "*.DS_Store" "node_modules/"

    # Clean up
    cd ..
    rm -rf $TEMP_DIR

    echo "Package $OUTPUT_ZIP created successfully!"
}

# Move to the smsStack directory
cd /Users/work/Documents/development/cloud-saas-api/smsStack

# Package smsFailureDetection
create_lambda_package "smsFailureDetection" "sms-failure-detection.zip"

# Package smsFunction
create_lambda_package "smsFunction" "sms-processor.zip"

# Return to original directory
cd $CURRENT_DIR

echo "Lambda packaging completed!"
