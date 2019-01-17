#!/bin/bash

cd ~
#mkdir backup
cd backup
foldername=$(date '+%d-%b-%Y')
mkdir $foldername
cd $foldername
cp -rR ~/devcode/servo-admin/src/ .
tar -zvcf $foldername.tar.gz ./
rm -r src
