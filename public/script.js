const socket = io();

let localStream;
let pc;
let roomId;

function createRoom() {
    roomId = Math.random().toString(36).substr(2, 9);
    document.getElementById('roomId').value = roomId;
    alert(`Room created! Share this Room ID: ${roomId}`);
    socket.emit('joinRoom', roomId);
}

function joinRoom() {
    roomId = document.getElementById('roomId').value;
    socket.emit('joinRoom', roomId);
}

async function startScreenSharing() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' } });
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;

        startTransmission();
    } catch (error) {
        console.error('Error starting screen sharing:', error);
    }
}

function startTransmission() {
    pc = new RTCPeerConnection();

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = event => {
        if (!document.getElementById('remoteVideo')) {
            const remoteVideo = document.createElement('video');
            remoteVideo.id = 'remoteVideo';
            remoteVideo.autoplay = true;
            document.getElementById('container').appendChild(remoteVideo);
        }
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    };

    socket.on('offer', offer => {
        pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
                socket.emit('answer', { answer: pc.localDescription, room: roomId });
            })
            .catch(error => console.error('Error creating answer:', error));
    });

    socket.on('answer', answer => {
        pc.setRemoteDescription(new RTCSessionDescription(answer))
            .catch(error => console.error('Error setting remote description:', error));
    });

    socket.on('candidate', candidate => {
        pc.addIceCandidate(candidate)
            .catch(error => console.error('Error adding ICE candidate:', error));
    });

    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', { offer: pc.localDescription, room: roomId });
        })
        .catch(error => console.error('Error creating offer:', error));
}
