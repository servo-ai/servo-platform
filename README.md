
# Servo.ai
**Servo Bot Automation Framework** is the leading framework for building bots and automation flows. It allows developers to use visual architecture, open code and reusable AI.

Go to <a href="http://dev.servolabs.org"  target="_blank">dev.servolabs.org </a> for a playground

Or click to watch a short intro video:
<br>
[![Servo](https://j.gifs.com/lxQOk1@426x240.gif)](https://www.youtube.com/watch?v=KREhqahVqA0)]

# Installation
1. install nodejs (v8 or v9) and npm (v5.5 and above)
3. clone and install:
    * sudo npm install -g gulp bower
	* git clone https://github.com/servo-ai/servo-platform.git
    * cd servo-platform/server
    * npm install
    * cd ../editor
    * npm install
    * bower install

If you get errors during npm install, then:
	* on windows:  npm install --global --production windows-build-tools 
	* linux:  sudo apt-get install build-essential libssl-dev
    
# Run Servo
From server or editor folder:
<br>
 **npm start**

On the browser open localhost:8000

# Tutorials

A getting started tutorial could be found at the wiki: <a href="https://github.com/servo-ai/servo-platform/wiki" target="_blank">https://github.com/servo-ai/servo-platform/wiki</a>

For reference documentation, see <a href="https://servo-ai.github.io/servo-platform/" target="_blank">https://servo-ai.github.io/servo-platform/</a>

<hr>

# Build documentation
* cd server
* jsdoc ./ -r -c ./jsdoc-config.json  -d ../docs -t ./ink-docstrap/template -R ./README.md
* npm run cpdoc


# Optional/advanced installations:	
	
## Terminals
Servo uses two apps, one for the server and one for the editor. npm start will run them both on the same terminal. you can, however, run them in two separate terminals:
* cd server && 
 node app.js
* cd editor &&
 gulp serve

## **Database:**

### couchbase
 * install couchbase
 * restore from release-proc/couchbase-buckets
 * change db entry at src/server/config.json to 'couchdb'
### mongodb
* install mongodb
 * change db entry at src/server/config.json to 'mongo'


## **Certificates:**
 
1. get a new domain 

2. Install a certificate

* all certificates should be put under a server/certificates/<domain> folder, with following names:
**cert.pem
**chain.pem
**privkey.pem

* change entries at server/config.json:
``"serverBaseDomain": "<domain>",
  "openSSL": true,
``  

## E2E/Unit tests:
npm test

#License and copyright
* Server is licensed under AGPL 
* Client is licensed under MIT license

  This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

Copyright (c) 2016-2019 Servo Labs Inc
Some of the source files have parts Copyright by Renato de Pontes Pereira

