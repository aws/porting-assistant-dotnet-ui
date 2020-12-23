#!/bin/bash -e
rm -rf react_build
mkdir react_build
rsync -r --copy-links node_modules/@porting-assistant/react/build/* react_build/
