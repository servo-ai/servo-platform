# Servo
The following document explains how to install and run the Servo Editor and Servo run time environments. It assumes you are a developer with basic knowledge of NodeJS dev ops. 

# Installation 
### Prequesits
Install the following (you might need to sudo it)
  - NodeJS ver 7.0 or above
  - Git
  - Gulp: npm install -g gulp
  - Bower: npm install -g bower
  - (optional): Visual Code

### Procedure
From the command line:
```sh
1. git clone --depth 1 https://<your username>@bitbucket.org/servoai/servo-admin.git
2. git checkout alexa
3. cd src/server
4. npm install
5. Test: node app.js (npm install --save any dependencies that are missing) and break (Ctrl-C)
6. cd ../client/b3
7. npm install
8. gulp serve (npm install --save any dependencies that are missing) 
```
9. Now the editor is running
10 . Go to settings and change layout to vertical
11. Create a new project

# Running
### Import trees
1. You can find all trees for current project (Alexa) under **src/server/fsmcode/default-user/fsms/drbrook**
2. Each tree can be dependent on other sub-trees, which are under its trees/ folder
2. In the editor, Project-->Import Tree for all trees
3. Make sure you start importing from lower level dependent trees 

### Run server
#### Local machine
If you run on your local machine, it is best to use Visual Code for debugging. However, this might be only good for Brooks' client testing, since Alexa needs a permanent IP to communicate with. You might need to test. For that:
1. Open the servo-admin root folder
2. open src/server/config.json and make sure it shows:
``` JSON
  {
  "serverBaseDomain": "localhost",
    "openSSL": false,
    "db": "brook",
    "readOnly": false,
    "port": 3000,
    "pubnub": {
        "pubKey": "pub-c-00914e8c-f93d-41a8-be93-7591fee9fe5b",
        "subKey": "sub-c-7ede64aa-4606-11e6-9c7c-0619f8945a4f",
        "secKey": "sec-c-M2ZkYTU5MDYtYjg4Ny00YjhjLThhZDgtNGIzMGY5MDhhN2Qz",
        "authKey": "secret admin key for read and write to pubnub"
    },
    "brook": {
        "appVersion": "99.99",
        "host": "azure.brook.ai",
        "port": "443",
        "path": "/VIQDev/do",
        "admin": {
            "email": "servo_system@brook.ai",
            "password": "QSl0H90jCg8AqOizaU78"
        }
    }
```
3. In the debug settings, create a new configuration (cogwheel)
4. Use the following:
```json
{
            "name": "Launch",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/src/server/app.js",
            "stopOnEntry": false,
            "args": [],
            "cwd": "${workspaceRoot}/src/server/",
            "preLaunchTask": null,
            "runtimeExecutable": null,
            "runtimeArgs": [
                "--nolazy"
            ],
            "env": {
                "NODE_ENV": "development"
            },
            "console": "internalConsole",
            "sourceMaps": false,
            "outDir": null,
             "restart": true
        }
```
4. press the Play button to run

#### Cloud server
if you are on a cloud server, you can run all from the command line:
``` 
node app.js
# for debug:
node --inspect app.js
# or
node --inspect --debug-brk app.js
```
if you are using this, you might find use in the following utility:
```
var clipboard = require('clipboard');
var ncp = require("copy-paste");

// _Read_
ncp.paste((a,url)=> {
	console.log(a,url)

	var url1 = url.replace('localhost','<your IP/URL here>');
	var url2 = url1.replace("'","")
	var cp = require('child_process');
	console.log(url2)
	ncp.copy(url2)
	cp.spawn('c:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' , [ '--enable-devtools-experiment', '--auto-open-devtools-for-tabs', url2 ]);
})

```
run it after npm instal copy-paste with node runDebug.js 

# Client
The client needs to connect to the URL that is exposed by the server. The URL is a copncatonation of:
1. The serverBaseDomain from config.json 
2. '/alexa/' or  '/VIQServo/' 
3. The top-level tree id

# Tips and Tricks
-  Remember: the goal of every tree is to return Success. If it doesn't you might get 'SOMETHING FAILED IN THIS TICK. ' error report. If you need, you can use the Succeeder action. For example: ![stop-controller][https://i.snag.gy/fLV8bz.jpg]

- Each tree has a prpoerties object which can be set by setting the properties of its node. Some of its members:
-- tick-debug: 1/0 - a very useful debug option that shows the current node in play. 
-- channels: msbot, facebook, alexa or brook
-- alias: an alias for the url (instead of the tree id being the url) 
-- "userId": only for alexa (as a demo, until we link accounts)
