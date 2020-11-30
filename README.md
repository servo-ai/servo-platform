
# Servo.ai
**Servo Bot Automation Framework** is the leading framework for building bots and automation flows. It allows developers to use visual architecture, open code and reusable AI.
<br>
Click to watch a short intro video:
<br>
<span style="display: inline-block; margin: auto;">[![Servo](https://j.gifs.com/lxQOk1@426x240.gif)](https://www.youtube.com/watch?v=KREhqahVqA0)]</span>

# Installation
1. install nodejs (v8 and higher) and npm (v5.5 and above)
3. clone and install:
    * sudo npm install -g gulp bower concurrently
	* git clone https://github.com/servo-ai/servo-platform.git
    * cd servo-platform/server
    * optional:<br>
      ** Windows: npm install --global --production windows-build-tools <br>
      ** Linux: sudo apt-get install build-essential libssl-dev
    * npm install
    * cd ../editor
    * npm install
    * bower install

If you get errors during npm install, then:
	* on windows:  npm install --global --production windows-build-tools 
	* linux:  sudo apt-get install build-essential libssl-dev
    
# Run Servo
From **server**  folder:
<br>
  **npm start**

On Chrome browser open localhost:8000. 

**Please note**: Servo comes with a couple of tutorial projects, that will connect to Wit.ai NLU engine.

# Tutorials

To get started, see the wiki: <a href="https://github.com/servo-ai/servo-platform/wiki" target="_blank">https://github.com/servo-ai/servo-platform/wiki</a>

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

