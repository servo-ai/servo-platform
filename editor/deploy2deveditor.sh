#!/bin/bash
echo "Please make sure you are at the b3 editor, post npm install"
./runinstalls.sh
gulp dev

echo "make a DevEditor folder "
mkdir DevEditor
cp -rR build/* DevEditor/
cd DevEditor/
mkdir DevEditor
cp -rR js/ DevEditor/
cp -rR css/ DevEditor/
echo "run from b3 folder"
cd ..
node clientapp.js


