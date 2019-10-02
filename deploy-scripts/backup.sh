#!/bin/bash

cd ~
#mkdir backup
cd backup
foldername=$(date '+%d-%b-%Y')
mkdir $foldername
cd $foldername
cp -rR ~/servo-platform/ .
rm -r servo-platform/server/node_modules
tar -zvcf $foldername.tar.gz ./
rm -r servo-platform