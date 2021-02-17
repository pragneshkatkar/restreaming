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

    socket.on('video_change', (data) => {
        console.log(data.streamArray);
        socket.to(data.room).emit('video_change', {streamArray: data.streamArray})
    })
}

module.exports = stream;