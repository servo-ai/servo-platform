#!/bin/bash
./backup.sh
git checkout master
git pull
sudo cp ~/devcode/servo-admin/release-proc/server-config.json ~/devcode/servo-admin/src/server/config.json

cd ~/devcode/servo-admin/src/client/b3

sudo cp ~/devcode/servo-admin/release-proc/b3-config.json ~/devcode/servo-admin/src/client/b3/config.json
gulp dev

