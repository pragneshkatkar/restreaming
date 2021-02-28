const stream = (socket)=>{
    socket.on('subscribe', (data)=>{
        //subscribe/join a room
        // console.log(socket)
        socket.join(data.room);
        socket.join(data.socketId);
        socket.join(data.username);

        //Inform other members in the room of new user's arrival
        if(socket.adapter.rooms[data.room].length > 1){
            socket.to(data.room).emit('new user', {socketId:data.socketId, username: data.username});
        }

        // console.log(socket.rooms);
    });


    socket.on('newUserStart', (data)=>{
        socket.to(data.to).emit('newUserStart', {sender:data.sender});
    });


    socket.on('sdp', (data)=>{
        socket.to(data.to).emit('sdp', {description: data.description, sender:data.sender});
    });


    socket.on('ice candidates', (data)=>{
        socket.to(data.to).emit('ice candidates', {candidate:data.candidate, sender:data.sender});
    });


    socket.on('chat', (data)=>{
        socket.to(data.room).emit('chat', {sender: data.sender, msg: data.msg});
    });

    socket.on('getusername', (data) => {
        socket.to(data.room).emit('getusername', {username: data.username})
    })

    socket.on('video_change', (data) => {
        console.log(data.streamArray);
        socket.to(data.room).emit('video_change', {streamArray: data.streamArray})
    })
    socket.on('config_rtmpDestination',function(m){
		// if(typeof m != 'string'){
		// 	socket.emit('fatal','rtmp destination setup error.');
		// 	return;
		// }
		// var regexValidator=/^rtmp:\/\/[^\s]*$/;//TODO: should read config
		// if(!regexValidator.test(m)){
		// 	socket.emit('fatal','rtmp address rejected.');
		// 	return;
		// }
		socket._rtmpDestination=m;
		// socket.emit('message','rtmp destination set to:'+m);
	});
	socket.on('start',function(m){
		// if(ffmpeg_process || feedStream){
			
		// 	socket.emit('fatal','stream already started.');
		// 	return;
		// }
		// if(!socket._rtmpDestination){
		// 	socket.emit('fatal','no destination given.');
		// 	return;
		// }
		
		var framerate = socket.handshake.query.framespersecond;
		var audioBitrate = parseInt(socket.handshake.query.audioBitrate);
	    var audioEncoding = "64k";
		if (audioBitrate ==11025){
			audioEncoding = "11k";
		} else if (audioBitrate ==22050){
			audioEncoding = "22k";
		} else if (audioBitrate ==44100){
			audioEncoding = "44k";
		}
		console.log(audioEncoding, audioBitrate);
		console.log('framerate on node side', framerate);
		//var ops = [];
		if (framerate == 1){
			var ops = [
				'-i','-',
				 '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
				//'-max_muxing_queue_size', '1000', 
				//'-bufsize', '5000',
			       '-r', '1', '-g', '2', '-keyint_min','2', 
					'-x264opts', 'keyint=2', '-crf', '25', '-pix_fmt', 'yuv420p',
			        '-profile:v', 'baseline', '-level', '3', 
     				'-c:a', 'aac', '-b:a', audioEncoding, '-ar', audioBitrate, 
			        '-f', 'flv', socket._rtmpDestination		
			];
			
		}else if (framerate == 15){
			var ops = [
				'-i','-',
				 '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
				'-max_muxing_queue_size', '1000', 
				'-bufsize', '5000',
			       '-r', '15', '-g', '30', '-keyint_min','30', 
					'-x264opts', 'keyint=30', '-crf', '25', '-pix_fmt', 'yuv420p',
			        '-profile:v', 'baseline', '-level', '3', 
     				'-c:a', 'aac', '-b:a',audioEncoding, '-ar', audioBitrate, 
			        '-f', 'flv', socket._rtmpDestination		
			];
			
		}else{
		   var ops=[
			 '-i','-',
			//'-c', 'copy', 
			'-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',  // video codec config: low latency, adaptive bitrate
			'-c:a', 'aac', '-ar', audioBitrate, '-b:a', audioEncoding, // audio codec config: sampling frequency (11025, 22050, 44100), bitrate 64 kbits
			//'-max_muxing_queue_size', '4000', 
			//'-y', //force to overwrite
			//'-use_wallclock_as_timestamps', '1', // used for audio sync
			//'-async', '1', // used for audio sync
			//'-filter_complex', 'aresample=44100', // resample audio to 44100Hz, needed if input is not 44100
			//'-strict', 'experimental', 
			'-bufsize', '5000',
			
			'-f', 'flv', socket._rtmpDestination
			/*. original params
			'-i','-',
			'-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',  // video codec config: low latency, adaptive bitrate
			'-c:a', 'aac', '-ar', '44100', '-b:a', '64k', // audio codec config: sampling frequency (11025, 22050, 44100), bitrate 64 kbits
			'-y', //force to overwrite
			'-use_wallclock_as_timestamps', '1', // used for audio sync
			'-async', '1', // used for audio sync
			//'-filter_complex', 'aresample=44100', // resample audio to 44100Hz, needed if input is not 44100
			//'-strict', 'experimental', 
			'-bufsize', '1000',
			'-f', 'flv', socket._rtmpDestination
			*/
			
		];
	}
	console.log("ops", ops);
		console.log(socket._rtmpDestination);
		ffmpeg_process=spawn('ffmpeg', ops);
		console.log("ffmpeg spawned");
		feedStream=function(data){
			
			ffmpeg_process.stdin.write(data);
			//write exception cannot be caught here.	
		}

		ffmpeg_process.stderr.on('data',function(d){
			socket.emit('ffmpeg_stderr',''+d);
		});
		ffmpeg_process.on('error',function(e){
			console.log('child process error'+e);
			socket.emit('fatal','ffmpeg error!'+e);
			feedStream=false;
			socket.disconnect();
		});
		ffmpeg_process.on('exit',function(e){
			console.log('child process exit'+e);
			socket.emit('fatal','ffmpeg exit!'+e);
			socket.disconnect();
		});
	});
}

module.exports = stream;