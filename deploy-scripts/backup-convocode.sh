#!/bin/bash

cd /home/liorm
#mkdir backup
cd backup
foldername=$(date '+%d-%b-%Y')-convocde
mkdir $foldername
cd $foldername
cp -rR ~/devcode/servo-admin/src/server/convocode .
tar -zvcf $foldername.tar.gz ./
