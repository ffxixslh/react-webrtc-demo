import React, { useState, useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

function New() {
  const [me, setMe] = useState();
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [allUsers, setAllUsers] = useState({});

  const socket = useRef();
  const myVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    socket.current = io.connect("http://localhost:9000");

    socket.current.on("allUsers", (users) => setAllUsers(users || {}));

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.current.on("me", (id) => setMe(id));

    // 接收方获取从服务器传递的发起方数据
    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
      console.log("hey", data);
    });
  }, []);

  function callPeer(id) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
      });
    });

    // peer.addStream(stream);

    // peer.addTrack(track, stream);

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex" }}>
        <video
          playsInline
          muted
          autoPlay
          ref={myVideo}
          style={{ width: "300px" }}
        ></video>
        {callAccepted && (
          <video
            playsInline
            muted
            autoPlay
            ref={partnerVideo}
            style={{ width: "300px" }}
          ></video>
        )}
      </div>
      <div>
        {Object.keys(allUsers).map((user) =>
          user === me ? null : (
            <button key={user} onClick={() => callPeer(user)}>
              call {user}
            </button>
          )
        )}
      </div>
      {receivingCall && (
        <div>
          <h1>{caller} is calling you</h1>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}
    </div>
  );
}

export default New;
