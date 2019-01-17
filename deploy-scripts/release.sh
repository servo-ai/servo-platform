#!/bin/bash
cd ~
#mkdir backup
cd backup
foldername=$(date '+%d-%b-%Y')
mkdir $foldername
cd $foldername
mv ~/servo-app/* .


cd ~/servo-app

mkdir client
mkdir server

cp -rR ~/devcode/servo-admin/dist/prod ~/servo-app/client
cp ~/devcode/servo-admin/release-proc/configparams.json ~/servo-app/client/prod
cp ~/devcode/servo-admin/release-proc/config.json ~/servo-app/server

cp -rR ~/devcode/servo-admin/src/server ~/servo-app/
cp  ~/devcode/servo-admin/release-proc/clientapp.js ~/servo-app/client/
cp  ~/devcode/servo-admin/release-proc/package.json ~/servo-app/client/
cp -rR ~/devcode/servo-admin/release-proc/routes ~/servo-app/client/routes
cp -rR ~/devcode/servo-admin/release-proc/views ~/servo-app/client/views
cd ~/servo-app/client
npm install
cd ~/servo-app/server
npm install@0.9.2  #? version of botbuilder

#NO cp ~/devcode/servo-admin/dist/dev/index.html ~/servo-app/client/index.html

# UNREMARK 443 LISTENTING IN SERVER/APP.JS
# CHANGE SERVER/CONFIG.JSON TO //        /*'ACCOUNT_SID'*/'AC73bb880adc90e3c13f8b19f2680e4fb7',
#                               //       /*'AUTH_TOKEN'*/'aab768d1618145e876917c884680b012'); //==> 707 number production
