#!/bin/bash
./backup.sh

cd ../src/client/b3
sudo cp ~/devcode/servo-admin/release-proc/b3-config.json /home/liorm/devcode/servo-admin/src/client/b3/config.json

gulp dev


