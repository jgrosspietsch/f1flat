#!/bin/bash
set -e
set -o pipefail

npm install

# Check if AWS CDK CLI is installed
if ! [ -x "$(command -v cdk)" ]; then
    echo 'Error: AWS CDK CLI is not installed.' >&2
    exit 1
fi

# Build the f1flat.sqlite database
cd packages/f1flat_sqlite
npm run exec

# Move f1flat.sqlite to data layer directory
cd ../..
rm -rf f1flat_data_layer
mkdir f1flat_data_layer
mv packages/f1flat_sqlite/out/f1.sqlite f1flat_data_layer

# Write MD5 hash of f1flat.sqlite to file

if ! [ -x "$(command -v md5sum)" ]; then
    # If md5sum is not installed, use md5 instead
    echo 'Warning: md5sum is not installed. Using md5 instead.' >&2
    md5sum() { md5 -q "$@"; }
fi

md5sum f1flat_data_layer/f1.sqlite > f1flat_data_layer/f1.sqlite.md5

zip -r f1flat_data_layer.zip f1flat_data_layer

# Deploy the data layer
cd cdk
cdk synth
cdk deploy
