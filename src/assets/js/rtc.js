/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from './helpers.js';


window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');
    let mixedStream = '';

    if (!room) {
        window.location.href = "/create-meeting";
    }

    else if (!username) {
        window.location.href = "/join-meeting?room=" + room;
    }

    else {
        // let commElem = document.getElementsByClassName('room-comm');

        // for (let i = 0; i < commElem.length; i++) {
        //     commElem[i].attributes.removeNamedItem('hidden');
        // }

        var pc = [];

        var socket = io.connect('/stream');

        var socketId = '';
        var myStream = '';
        var strs = [];
        var str = [];
        document.getElementById("golive-button").addEventListener("click", function(){
            streamtest();
        })

        h.getUserMedia().then((stream) => {
            //save my stream

            document.getElementById('local-video').srcObject = stream;
            document.getElementById("add-local-video").addEventListener('click', function(){
                addtomain(stream, username);
            })
        }).catch((e) => {
            console.error(`stream error: ${e}`);
        });
        

        socket.on('connect', () => {
            //set socketId
            socketId = socket.io.engine.id+"____"+username;


            socket.emit('subscribe', {
                room: room,
                socketId: socketId,
                username: username
            });



            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId, username:data.username });
                pc.push(data.socketId);
                init(true, data.socketId);
            });


            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });


            socket.on('ice candidates', async (data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserMedia().then(async (stream) => {
                        if (!document.getElementById('local-video').srcObject) {
                            document.getElementById('local-video').srcObject = stream;
                        }

                        //save my stream
                        // myStream = stream;

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();

                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                    }).catch((e) => {
                        console.error(e);
                    });
                }

                else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });


            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });

            socket.on('video_change', (data) => {
                let mixer = new MultiStreamsMixer(MediaStream.getTrackById(data.streamArray));
                mixer.frameInterval = 1;
                mixer.startDrawingFrames();

                document.getElementById("main-video_html5_api").srcObject = mixer.getMixedStream();
            });
            socket.on('getusername', (data) => {
                tempusername = data.username;
            });
        });


        function sendMsg(msg) {
            let data = {
                room: room,
                msg: msg,
                sender: username
            };

            //emit chat message
            socket.emit('chat', data);


            //add localchat
            h.addChat(data, 'local');
        }



        function init(createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());

            h.getUserMedia().then((stream) => {
                //save my stream
                myStream = stream;

                stream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                });

                document.getElementById('local-video').srcObject = stream;
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });



            //create offer
            if (createOffer) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();

                    await pc[partnerName].setLocalDescription(offer);

                    socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
                };
            }



            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({ candidate }) => {
                socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
            };



            //add
            pc[partnerName].ontrack = (e) => {
                console.log("The user is connected");
                let str = e.streams[0];
                let partnerNameArr = partnerName.split('____');
                let tempusername = partnerNameArr[partnerNameArr.length - 1];
                if (document.getElementById(`${partnerName}-video`)) {
                    // alert('if'+partnerName);
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                    document.getElementById(`${partnerName}-p`).textContent = tempusername;
                }

                else {
                    // alert('else'+partnerName);
                    //video elem
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.style.width = '100%';

                    //create a new div for card
                    // let cardDiv = document.createElement('div');
                    // cardDiv.className = 'card mb-3';
                    // cardDiv.appendChild(newVid);

                    //create a new div for everything
                    let div = document.createElement('div');
                    div.className = 'videos';
                    div.id = partnerName;
                    div.style.position = 'relative';
                    div.appendChild(newVid);

                    let namediv = document.createElement('div');
                    namediv.id = `${partnerName}-p`;
                    namediv.style.padding = '2px 5px';
                    namediv.style.borderRadius = '0px 0px 5px 5px';
                    namediv.style.backgroundColor = 'white';
                    namediv.style.fontSize = '10px';
                    namediv.textContent = tempusername;
                    div.appendChild(namediv);

                    let adddiv = document.createElement('div');
                    adddiv.className = 'add-div align-items-center justify-content-center';
                    div.appendChild(adddiv);

                    let addbutton = document.createElement('button');
                    addbutton.id = partnerName+"-button";
                    addbutton.addEventListener('click', function(){
                        addtomain(str, tempusername)
                    });
                    addbutton.className = 'add-button';
                    if(strs.includes(str)){
                        addbutton.textContent = 'Remove from stream';
                    } else{
                        addbutton.textContent = 'Add to stream';
                    }
                    adddiv.appendChild(addbutton);

                    //put div in videos elem
                    document.getElementById('videos').appendChild(div);
                }
            };
            
            document.getElementById("enter-multistream").addEventListener('click', function(){
                alert(strs);
                let mixer = new MultiStreamsMixer(strs);
                mixer.frameInterval = 1;
                mixer.startDrawingFrames();

                document.getElementById("main-video").srcObject = mixer.getMixedStream();
            });



            pc[partnerName].onconnectionstatechange = (d) => {
                switch (pc[partnerName].iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        console.log("The user is failed/disconnected");
                        break;

                    case 'closed':
                        console.log("The user is closed");
                        break;
                }
            };



            pc[partnerName].onsignalingstatechange = (d) => {
                switch (pc[partnerName].signalingState) {
                    case 'closed':
                        console.log("Signalling state is 'closed'");
                        h.closeVideo(partnerName);
                        break;
                }
            };
        }
        function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            if (typeof stroke == 'undefined') {
                stroke = true;
            }
            if (typeof radius === 'undefined') {
                radius = 5;
            }
            if (typeof radius === 'number') {
                radius = {
                    tl: radius,
                    tr: radius,
                    br: radius,
                    bl: radius
                };
            } else {
                var defaultRadius = {
                    tl: 0,
                    tr: 0,
                    br: 0,
                    bl: 0
                };
                for (var side in defaultRadius) {
                    radius[side] = radius[side] || defaultRadius[side];
                }
            }
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            // ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
            ctx.lineTo(x + width, y + height);
            // ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            ctx.lineTo(x, y + height);
            // ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
            ctx.lineTo(x, y);
            // ctx.quadraticCurveTo(x, y, x + radius.tl, y)
            ctx.closePath();
            if (fill) {
                ctx.fill();
            }
            // if (stroke) {
            //     ctx.stroke();
            // }
        }
        function normalVideoRenderHandler(stream, textToDisplay, callback) {
            // on-video-render:
            // called as soon as this video stream is drawn (painted or recorded) on canvas2d surface
            stream.onRender = function(context, x, y, width, height, idx, ignoreCB) {
                if(!ignoreCB && callback) {
                    callback(context, x, y, width, height, idx, textToDisplay);
                    return;
                }

                var measuredTextWidth = parseInt(context.measureText(textToDisplay).width);
                x = x + (parseInt((width - measuredTextWidth)) / 2);
                // y = (context.canvas.height - height) + 50;
                context.fillStyle = 'rgba(255, 255, 255, 1)';
                roundRect(context, x - measuredTextWidth, y - 18, measuredTextWidth + 40, 25, 20, true);
                context.fillStyle = 'white';
                context.fillText(textToDisplay, x, y);
            };
        }
        function streamtest(){
            var streamkey = document.getElementById("stream-key").value;
            if(streamkey != ''){
                document.getElementById("stream-key").style.border = "1px solid #E0E0E0";
                socket.emit('config_rtmpDestination', "rtmp://x.rtmp.youtube.com/live2/"+streamkey);
                socket.emit('start','start');
                if(mixedStream != ''){
                    document.getElementById("golive-button").textContent = 'You are live';
                    let mediaRecorder = new MediaRecorder(mixedStream);
                    mediaRecorder.start(250);
                    mediaRecorder.ondataavailable = function(e) {
                        
                        socket.emit("binarystream",e.data);
                        //chunks.push(e.data);
                    }

                } else{
                    alert("You have not added any stream")
                }

            } else{
                document.getElementById("stream-key").style.border = '1px solid red';
            }
        }
        function addtomain(stream, name){
            normalVideoRenderHandler(stream, name, function(context, x, y, width, height, idx, textToDisplay) {
                var measuredTextWidth = parseInt(context.measureText(textToDisplay).width);
                x = x + (parseInt((measuredTextWidth)));

                y = height - 20;

                if(idx == 2 || idx == 3) {
                    y = (height * 2) - 20;
                }

                if(idx == 4 || idx == 5) {
                    y = (height * 3) - 20;
                }
                
                context.fillStyle = 'rgba(255, 255, 255, 1)';
                roundRect(context, x - measuredTextWidth, y - 18, measuredTextWidth + 40, 29, 20, true);
                context.fillStyle = 'black';
                context.fillText(textToDisplay, x - measuredTextWidth + 10, y);
            });
            strs.push(stream);
            let mixer = new MultiStreamsMixer(strs);
            mixer.frameInterval = 1;
            mixer.startDrawingFrames();
            mixedStream = mixer.getMixedStream();
            document.getElementById("main-video").srcObject = mixedStream;
            
            var socketOptions = {secure: true, reconnection: true, reconnectionDelay: 1000, timeout:15000, pingTimeout: 15000, pingInterval: 45000,query: {framespersecond: 24, audioBitrate: 44100}};
    
                socket.emit('config_rtmpDestination', "rtmp://x.rtmp.youtube.com/live2/9pz2-175v-usb1-fab6-3jhf");
                socket.emit('start','start');
                let mediaRecorder = new MediaRecorder(mixedStream);
                mediaRecorder.start(250);
                console.log(mediaRecorder);
                mediaRecorder.ondataavailable = function(e) {
                
                    socket.emit("binarystream",e.data);
                    //chunks.push(e.data);
                }
            console.log(MediaStream.getTrackById(mixer.getMixedStream().id));
            document.getElementById("golive-button").addEventListener("click", streamtest(mixedStream), false)
        }
    }
    let isAudio = true;
    document.getElementById("mute-audio").addEventListener('click', function(e) {
        e.stopPropagation();
        let element = e.target;
        $(element).toggleClass("active");
        if ($(element).children("i").text() == "mic_off") {
            $(element).children("i").text("mic");
            $(element).children("p").text("Mute");
        } else {
            $(element).children("p").text("Unmute");
            $(element).children("i").text("mic_off");
        }
        myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled);
    });
    let isVideo = true;
    document.getElementById("mute-video").addEventListener('click', function(e) {
        e.stopPropagation();
        $("#mute-video").toggleClass("active");
        if ($("#mute-video").children("i").text() == "videocam_off") {
            $("#mute-video").children("i").text("videocam");
        } else {
            $("#mute-video").children("i").text("videocam_off");
        }
        myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);
    });
    document.getElementById("screen-share").addEventListener('click', function() {
        if(navigator.getDisplayMedia) {
            navigator.getDisplayMedia({video: true}).then(screenStream => {
                afterScreenCaptured(screenStream);
            });
        }
        else if(navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({video: true}).then(screenStream => {
                afterScreenCaptured(screenStream);
            });
        }
        else {
            alert('getDisplayMedia API is not supported by this browser.');
        }
    });
    function afterScreenCaptured(screenStream) {
        navigator.mediaDevices.getUserMedia({
            video: true
        }).then(function(cameraStream) {
            screenStream.fullcanvas = true;
            screenStream.width = screen.width; // or 3840
            screenStream.height = screen.height; // or 2160 

            cameraStream.width = parseInt((30 / 100) * screenStream.width);
            cameraStream.height = parseInt((30 / 100) * screenStream.height);
            cameraStream.top = screenStream.height - cameraStream.height;
            cameraStream.left = screenStream.width - cameraStream.width;

            // fullCanvasRenderHandler(screenStream, 'Your Screen!');
            // normalVideoRenderHandler(cameraStream, 'Your Camera!');

            let mixer = new MultiStreamsMixer([screenStream, cameraStream]);

            mixer.frameInterval = 1;
            mixer.startDrawingFrames();

            document.getElementById("main-video").srcObject = mixer.getMixedStream();

            // updateMediaHTML('Mixed Screen+Camera!');

            addStreamStopListener(screenStream, function() {
                mixer.releaseStreams();
                videoPreview.pause();
                videoPreview.src = null;

                cameraStream.getTracks().forEach(function(track) {
                    track.stop();
                });
            });
        });
    }
});