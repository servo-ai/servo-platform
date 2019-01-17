#!/bin/sh

echo "port" $1
cd ~/servo-app/server
nohup node app.js $1 >serverout.log 2>servererr.log < /dev/null &


