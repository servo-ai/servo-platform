#!/bin/bash

cd /home/liorm
#mkdir backup
cd backup
foldername=$(date '+%d-%b-%Y')-convocde
mkdir $foldername
cd $foldername
cp -rR ~/servo-platform/server/convocode .
tar -zvcf $foldername.tar.gz ./
