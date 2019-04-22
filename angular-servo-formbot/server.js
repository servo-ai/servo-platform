var express = require('express');
var app=express();
var url = require('url');
var path=require('path');
app.use(express.static(path.join(__dirname, 'dist/formbot')));
app.use((req, res) => res.sendFile(`${__dirname}/dist/formbot/index.html`))
app.listen(4200, function(){
    console.log('Server running on 4200...');
});
