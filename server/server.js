const io = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:3001'],
    }
}
);
let numOnline = 0;
let allRooms = {}

io.on('connection', socket => {
    socket.on('connected', user => {
        socket.join('public');
        numOnline++;
        console.log(`${user} has connected!`);
        io.emit('update-num-online', numOnline);
        if (!allRooms['public']) {
            allRooms['public'] = [user];
        }
        else {
            allRooms['public'].push(user);
        }


        socket.to('public').emit('announce-connection', user);
    })


    socket.on('send-message', (message, room, user) => {
        if (message !== '') {
            console.log(`${user}: ${message}`);
            socket.to(room).emit('resend-message', message, user);

        }
    })
    socket.on('image', (data, user, room) => {
        socket.to(room).emit('resend-image', user, data);
    });

    socket.on('get-room-list', room => {
        if (allRooms[room]) {
            socket.emit('update-room-list', allRooms[room]);
        }

    })

    socket.on('join-room', (room, user) => {
        socket.join(room);
        if (!allRooms[room]) {
            allRooms[room] = [user];
        }
        else {
            allRooms[room].push(user);
        }

        socket.to(room).emit('announce-join', room, user);
    })
    socket.on('leave-room', (room, user) => {
        socket.to(room).emit('announce-leave', room, user);
        allRooms[room] = allRooms[room].slice(0, allRooms[room].indexOf(user)).concat(allRooms[room].slice(allRooms[room].indexOf(user) + 1));
        if (allRooms[room].length == 0 && room !== 'public') {
            delete allRooms[room];
        }

        socket.leave(room);
    })


    socket.on('disconnected', (user, room) => {
        allRooms[room] = allRooms[room].slice(0, allRooms[room].indexOf(user)).concat(allRooms[room].slice(allRooms[room].indexOf(user) + 1));
        numOnline--;
        console.log(`${user} has disconnected!`);
        io.emit('update-num-online', numOnline);

        if (allRooms[room].length == 0 && room !== 'public') {
            delete allRooms[room];
        }

        socket.to(room).emit('announce-disconnection', user, room);
    })

})