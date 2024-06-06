const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

io.on('connection', socket => {
    console.log('Nowe połączenie:', socket.id);

    socket.on('createRoom', roomId => {
        socket.join(roomId);
        console.log(`Pokój ${roomId} utworzony przez ${socket.id}`);
    });

    socket.on('joinRoom', roomId => {
        socket.join(roomId);
        console.log(`Użytkownik ${socket.id} dołączył do pokoju ${roomId}`);
    });

    socket.on('screenData', ({ roomId, data }) => {
        socket.to(roomId).emit('screenData', data);
    });

    socket.on('disconnect', () => {
        console.log('Rozłączono:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});
