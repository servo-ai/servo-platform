#!/bin/bash
cd ~
#backup
ssh  -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'mkdir /home/ubuntu/backup/$(date '+%d-%b-%Y')'
ssh  -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'mv /home/ubuntu/servo-stage /home/ubuntu/backup/$(date '+%d-%b-%Y')'
ssh  -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'mkdir /home/ubuntu/servo-stage/client; mkdir /home/ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client ubuntu/servo-stage/client;'
ssh  -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'mkdir /home/ubuntu/servo-stage/client/prod; mkdir /home/ubuntu/servo-stage/clienti/dev;'

#client
scp  -rp  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/dist/prod/  ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client 
scp  -rp  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/dist/dev/  ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client 
#client configs
scp -p  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/configparams* ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/prod/
scp -p  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/configparams.json ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/dev/configparams-mainmachine.json
#client routes
scp -p -i /home/liorm/.ssh/thismicrostaging.private.fixed  ~/devcode/servo-admin/release-proc/package.json ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/
scp -rp  -i /home/liorm/.ssh/thismicrostaging.private.fixed  ~/devcode/servo-admin/release-proc/routes ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/routes
scp -rp  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/views ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/views

#server- 
scp -rp  -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/src/server ubuntu@172.31.39.255:/home/ubuntu/servo-stage/

#server-config 
scp -p -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/config-staging.json ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/server

scp -p -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/clientapp-dev.js ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/
scp -p -i /home/liorm/.ssh/thismicrostaging.private.fixed ~/devcode/servo-admin/release-proc/clientapp-prod.js ubuntu@172.31.39.255:/home/ubuntu/servo-stage/client/

#installs on client and server
ssh -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'cd /home/ubuntu/servo-stage/client;npm install;'
# remember to create html_imgs folder;
#server- ssh -i /home/liorm/.ssh/thismicrostaging.private.fixed ubuntu@172.31.39.255 'cd /home/ubuntu/servo-stage/server; npm install@0.9.2'
 #? version of botbuilder

#NO cp ~/devcode/servo-admin/dist/dev/index.html ~/servo-app/client/index.html

# UNREMARK 443 LISTENTING IN SERVER/APP.JS
# CHANGE SERVER/CONFIG.JSON TO //        /*'ACCOUNT_SID'*/'AC73bb880adc90e3c13f8b19f2680e4fb7',
#                               //       /*'AUTH_TOKEN'*/'aab768d1618145e876917c884680b012'); //==> 707 number production
