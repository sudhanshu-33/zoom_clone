
import React, { useState,useRef, useEffect } from "react";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client";


const server_url = "http://localhost:8000";
var connections ={};
 
const peerConfigConnections ={
    "iceServers" :[
        {"urls" : "stun:stun.l.google.com:19302"}
    ]
}

export default function VideoMeetComponent(){
     
    var socketRef = useRef();
    let socketidRef = useRef();

    let localVideoRef =useRef();

    let [videoAvailable , setVideoAvailable] = useState(true);

    let [audioAvailable , setAudioAvailable] = useState(true);

    let [video , setVideo] = useState([]);

    let [audio , setAudio] = useState();

    let [screen , setScreen] = useState();

    let [showModel , setshowModel] = useState();

    let [screenAvailable , setScreenAvailable] = useState();

    let [messages , setMessages] = useState([]);

    let [message , setMessage] = useState("");

    let [newMessage , setNewMessage] = useState(0);
    

    let [askForUsername , setAskForUsername] = useState(true);
    let [username , setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos , setVideos] =useState([]);



    useEffect(() =>{
        getpermissions();
    })


    const getpermissions = async ()=>{
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video:true});

            if(videoPermission){
                setVideoAvailable(true)
            }else{
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio:true});

            if(audioPermission){
                setAudioAvailable(true)
            }else{
                setAudioAvailable(false);
            }
            if(navigator.mediaDevices.getUserMedia){
                setVideoAvailable(true)
            }else{
                setVideoAvailable(false)
            }
            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video : videoAvailable , audio : audioAvailable});

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        }catch(err) {
            console.log(err)
        }
    };

    useEffect(() =>{
        if(video !== undefined && audio !== undefined){
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);
        }
    },[video , audio]);

    let getMedia =() =>{
        setVideo(setVideoAvailable)
        setAudio(setAudioAvailable)
        connectToSocketServer();
    }
    
    let getUserMediaSuccess =(stream) =>{
        try{
            window.localStream.getTracks().foreach(track => track.stop());
        }catch(e) {
            console.log(e);
        }
        window.localStream =stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketRef.current) continue;

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) =>{
                connections[id].setLocalDescription(description)
                .then(() =>{
                    socketidRef.current.emit("signal",id ,JSON.stringify({"sdp":connections[id].LocalDescription}))
                }).catch(e => console.log(e));
            })
        }
        stream.getTracks().foreach(track => track.onended = () =>{
            setVideo(false);
            setAudio(false);
       
         try{
            let tracks = localVideoRef.current.srcObject.getTracks()
            tracks.foreach(track => track.stop());
         }catch(e){
            console.log(e);
         }

         let blackSilence =(...args) => new MediaStream([black(...args) , silence(...args)])
         window.localStream=blackSilence();
         localVideoRef.current.srcObject =window.localStream;

         for(let id in connections){
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) =>{
                connections[id].setLocalDescription(description)
                .then(() =>{
                    socketidRef.current.emit("signal" , id ,JSON.stringify({"sdp" : connections[id].LocalDescription}))
                }).catch(e => console.log(e));
            })
         }
        });
    }

    let getUserMedia = () =>{
        if( (video && videoAvailable ) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({video:video , audio : audio})
            .then(getUserMediaSuccess)
            .then((stream) => {})
            .catch((e) => (console.log(e)))
        }else{
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.foreach((track) => {track.stop()})
            }catch(e){

            }
        }
    }

    
    let gotMessagefromServer =(fromId,message) =>{
        var signal = JSON.parse(message)

        if(fromId !== socketidRef.current) {
            if(signal.sdp){
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() =>{
                    if(signal.sdp.type === "offer"){

                        connections[fromId].createOffer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(()=>{
                                socketidRef.current.emit("signal" , fromId , JSON.stringify({"sdp" : connections[fromId].LocalDescription}))
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }
            if(signal.ice){
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice).catch(e => console.log(e)));
            }
        }
    }


    let connectToSocketServer =() =>{
        socketRef.current = io.connect(server_url , {secure : false})
        socketRef.current.on('signal', gotMessagefromServer)
        
        socketRef.current.on('connect' ,() =>{
            socketRef.current.emit("join-call" , window.location.href)

            socketidRef.current = socketRef.current.id

            socketRef.current.on('chat-message',addMessage)

            socketRef.current.on("user-left" ,(id) =>{
                setVideo((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined' , (id,clients) =>{
                clients.foreach((socketListId) =>{

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event) =>{
                        if(event.candidate != null){
                        socketRef.current.emit('signal' , socketListId,JSON.stringify({'ice' : event.candidate}))
                    }
                }
                connections[socketListId].onaddstream =(event) => {
                  let videoexists = videoRef.current.find(video => video.socketId === socketListId);
                  
                  if(videoexists){
                    setVideo(videos => {
                        const updatedVideos = videos.map(video =>
                            video.socketId === socketListId ? { ...video , stream : event.stream} : video
                        );
                        videoRef.current = updatedVideos;
                        return updatedVideos;
                    })
                  }else{

                    let newvideo = {
                        socketId : socketListId,
                        stream : event.stream,
                        autoPlay : true,
                        playsinline : true
                    }
                    setVideos( videos =>{
                        const updatedVideos = [...videos , newvideo];
                        videoRef.current = updatedVideos;
                        return updatedVideos;
                    })
                  }
                };
                if(window.localStream !== undefined && window.localStream !== null){
                    connections[socketListId].addStream(window.localStream);
                }else{
                    
                    let blackSilence =(...args) => new MediaStream([black(...args) , silence(...args)])
                    window.localStream=blackSilence();
                    connections[socketListId].addStream(window.localStream);
                }
                })
                
                if(id === socketidRef.current){
                    for(let id2 in connections){
                        if(id2 === socketidRef.current) continue

                        try{
                            connections[id2].addStream(window.localStream);
                        }catch(e){ }
                        connections[id2].createOffer().then((description) =>{
                            connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal',id2 , JSON.stringify({"sdp" :connections[id2].LocalDescription}))
                            })
                            .catch((e) => console.log(e));
                        })
                    }
                }
            
            })
        })
    }

    let silence = () =>{
        let ctx  = new AudioContext();
        let oscillator = ctx.createOscillator();
        
        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTrack()[0] , {enabled : false})
    }
    let black = ({height = 640 ,width = 480}) => {
        let canvas = Object.assign(document.createElement("canvas"),{height,width});

        canvas.getContext("2d").fillRect(0,0,height,width);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0],{enabled : false})
    }





    let addMessage = () => {

    }

    let connect = () =>{
        setAskForUsername(false);
        getMedia();
    }
    return (
        <div>
            {askForUsername === true ?
            <div>
                <h2>enter into lobby</h2>
                <TextField id="outlined-basic" label="Username" value={username} onChange={e=>setUsername(e.target.value)} variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>
                <div>
                    <video ref={localVideoRef} autoPlay muted></video>
                </div>

            </div>:<>

              <video  ref={localVideoRef} autoPlay muted></video>
            {videos.map((video) =>(
                <div key= {video.socketId}>
             <h2>{video.socketId}</h2>
             <video
                data-socket={video.socketId}
                ref ={ ref => {
                    if(ref && video.stream){
                        ref.srcObject = video.stream;
                    }
                }}
                autoPlay
                >
             </video>
             
                </div>
            ))}
            </>

            }
        </div>
    )
}