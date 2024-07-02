const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let pc;
let ws;

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

async function blobToText(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            resolve(event.target.result);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsText(blob);
    });
}

async function start() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    ws = new WebSocket('wss://172.12.0.9:8080');
    ws.onmessage = async (message) => {
        text = await blobToText(message.data);
        data = JSON.parse(text);
        if (data.offer) {
            console.log('received offer', data.offer);
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ answer }));
        } else if (data.answer) {
            console.log('received answer', data.answer);
            console.log("set remote description")
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.iceCandidate) {
            console.log('received ice candidate', data.iceCandidate);
            await pc.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
        }
    };
}

async function call() {
    if (localStream === undefined) {
        console.log('Local stream is not ready yet.');
        return;
    }
    const configuration = {};
    pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('sending ice candidate', event.candidate);
            ws.send(JSON.stringify({ iceCandidate: event.candidate }));
        }
    };

    pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    console.log("set local description");
    await pc.setLocalDescription(offer);
    console.log('sending offer', offer);
    ws.send(JSON.stringify({ offer }));
}

function hangup() {
    pc.close();
    pc = null;
}