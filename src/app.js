let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');

app.use(express.static('public'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});
app.get('/create-meeting', (req, res)=>{
    res.sendFile(__dirname+'/create-meeting.html');
});
app.get('/join-meeting', (req, res)=>{
    res.sendFile(__dirname+'/join-meeting.html');
});


io.of('/stream').on('connection', stream);
let port = process.env.PORT || 3000;
server.listen(port);

spawn('ffmpeg',['-h']).on('error',function(m){
	console.error("FFMpeg not found in system cli; please install ffmpeg properly or make a softlink to ./!");
	process.exit(-1);
});