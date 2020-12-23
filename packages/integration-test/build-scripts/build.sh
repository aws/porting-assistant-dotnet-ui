#!/bin/bash -e -x
tsc
aws s3 cp s3://portingAssistant-test-solutions/test-solutions.zip .
unzip -o test-solutions.zip
mkdir ../electron/test_store