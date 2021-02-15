/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from './helpers.js';

window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

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

        let socket = io('/stream');

        var socketId = '';
        var myStream = '';

        socket.on('connect', () => {
            //set socketId
            socketId = socket.io.engine.id+"____"+username;


            socket.emit('subscribe', {
                room: room,
                socketId: socketId,
                username: username
            });


            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
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
                        myStream = stream;

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
            })
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
            let strs = [];
            pc[partnerName].ontrack = (e) => {
                let str = e.streams[0];
                console.log(e.streams);
                if (document.getElementById(`${partnerName}-video`)) {
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                }

                else {
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
                    namediv.style.padding = '2px 5px';
                    namediv.style.borderRadius = '0px 0px 5px 5px';
                    namediv.style.backgroundColor = 'white';
                    namediv.style.fontSize = '10px';
                    namediv.textContent = username;
                    div.appendChild(namediv);

                    let adddiv = document.createElement('div');
                    adddiv.className = 'add-div d-flex align-items-center justify-content-center';
                    div.appendChild(adddiv);

                    let addbutton = document.createElement('button');
                    addbutton.className = 'add-button';
                    if(strs.includes(str)){
                        addbutton.textContent = 'Remove from stream';
                    } else{
                        addbutton.textContent = 'Add to stream';
                    }
                    addbutton.addEventListener('click', function(e){
                        addtomain(e, str)
                    });
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
            function addtomain(stream){
                if(strs.includes(stream)){
                    strs.splice(strs.indexOf(stream), 1);
                } else{
                    strs.push(stream);
                }
                let mixer = new MultiStreamsMixer(strs);
                mixer.frameInterval = 1;
                mixer.startDrawingFrames();

                document.getElementById("main-video").srcObject = mixer.getMixedStream();
            }



            pc[partnerName].onconnectionstatechange = (d) => {
                switch (pc[partnerName].iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        h.closeVideo(partnerName);
                        break;

                    case 'closed':
                        h.closeVideo(partnerName);
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


        // document.getElementById('chat-input').addEventListener('keypress', (e)=>{
        //     if(e.which === 13 && (e.target.value.trim())){
        //         e.preventDefault();

        //         sendMsg(e.target.value);

        //         setTimeout(()=>{
        //             e.target.value = '';
        //         }, 50);
        //     }
        // });


        // document.getElementById('toggle-video').addEventListener('click', (e)=>{
        //     e.preventDefault();

        //     myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);

        //     //toggle video icon
        //     e.srcElement.classList.toggle('fa-video');
        //     e.srcElement.classList.toggle('fa-video-slash');
        // });


        // document.getElementById('toggle-mute').addEventListener('click', (e)=>{
        //     e.preventDefault();

        //     myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled);

        //     //toggle audio icon
        //     e.srcElement.classList.toggle('fa-volume-up');
        //     e.srcElement.classList.toggle('fa-volume-mute');
        // });
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
});