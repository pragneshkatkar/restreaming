let express = require('express');
let app = express();
let server = require('http').createServer(app);
require('dotenv').config()
let port = process.env.PORT || 3000;
server.listen(port, function(){
  console.log("Listening to port " + port);
});
let io = require('socket.io')(server);
let stream = require('./src/ws/stream');
let path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
var bodyparser = require('body-parser')

var urlencodedParser = bodyparser.urlencoded({ extended: false });
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: 'videocast'
});

app.use(express.static('public'));

app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/src/index.html');
});
app.get('/create-meeting', (req, res)=>{
    res.sendFile(__dirname+'/src/create-meeting.html');
});
app.get('/join-meeting', (req, res)=>{
    res.sendFile(__dirname+'/src/join-meeting.html');
});
app.get('/meeting-joined', (req, res)=>{
    res.sendFile(__dirname+'/src/index1.html');
});
app.post('/create-meeting-act', urlencodedParser, (req, res) => {
    // let meeting_id = req.body.meeting_id;
    // let host = req.body.host;
    // let sql = "INSERT INTO meetings (meeting_id, host) VALUES ('"+meeting_id+"', '"+host+"')";
    // con.query(sql, function (err, result) {
    //   if (err) throw err;
    //   console.log("1 record inserted");
    // });
    // console.log(req.body);
})


io.of('/stream').on('connection', stream);

spawn('ffmpeg',['-h']).on('error',function(m){
	console.error("FFMpeg not found in system cli; please install ffmpeg properly or make a softlink to ./!");
	process.exit(-1);
});