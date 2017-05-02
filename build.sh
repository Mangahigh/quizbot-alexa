#/bin/bash

rm -rf dist
mkdir -p dist
cp package.json dist
npm --prefix ./dist --only=prod install
rm -rf dist/etc
cp src/* dist

grunt compress

