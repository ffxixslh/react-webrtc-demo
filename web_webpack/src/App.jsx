import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import AssignmentIcon from "@material-ui/icons/Assignment";
import PhoneIcon from "@material-ui/icons/Phone";
import React, { useState, useEffect, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import SimplePeer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

function App() {
  const socket = io.connect("http://localhost:9000");

  const [stream, setStream] = useState(null);
  const [name, setName] = useState("");
  const [me, setMe] = useState("");
  const [idToCall, setIdToCall] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [userName, setUserName] = useState("");
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef();
  const remoteVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // 获取本地 stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("error: ", err.message);
      });

    // 保存本地 socket id
    socket.on("me", (id) => setMe(id));

    // 接收方获取从服务器传递的发起方数据
    socket.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setUserName(data.to);
      setCallerSignal(data.signal);
      console.log("hey", data);
    });
  }, []);

  // 发起呼叫
  const handleCallRemote = (idToCall) => {
    // 初始化 peer 对象
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    // 传递信令
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: idToCall,
        signalData: data,
        from: me,
        name: name,
      });
    });

    // 获取对方 stream
    peer.on("stream", (stream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
    });

    // 对方接受通话时设置信令
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    // 保存 peer 对象
    connectionRef.current = peer;
  };

  // 接受呼叫
  const handleCallAccepted = () => {
    setCallAccepted(true);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    // 设置信令
    peer.on("signal", (data) => {
      socket.emit("acceptCall", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (stream) => {
      remoteVideo.current.srcObject = stream;
    });

    // 保存发起方信令
    peer.signal(callerSignal);

    // 保存 peer 对象
    connectionRef.current = peer;
  };

  // 结束通话
  const handleCallEnded = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <div className="App">
      <div className="container">
        {/* video container */}
        <div className="video-container">
          <div className="video">
            {stream && (
              <video
                ref={myVideo}
                playsInline
                // autoPlay
                // muted
                controls
                style={{ width: "500px" }}
              />
            )}
          </div>
          <div className="video">
            {callAccepted && !callEnded ? (
              <video
                ref={remoteVideo}
                playsInline
                // autoPlay
                // muted
                controls
                style={{ width: "500px" }}
              />
            ) : null}
          </div>
        </div>
        {/* input container */}
        <div className="myId">
          <TextField
            id="filled-basic"
            label="姓名"
            variant="filled"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            style={{ marginBottom: "10px" }}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "10px" }}>
            <Button
              style={{ width: "100%", height: "100%" }}
              variant="contained"
              color="primary"
              startIcon={<AssignmentIcon fontSize="large" />}
            >
              我的通话ID
            </Button>
          </CopyToClipboard>
          <TextField
            id="filled-basic"
            label="请输入对方通话ID"
            variant="filled"
            value={idToCall}
            onChange={(e) => {
              setIdToCall(e.target.value);
            }}
            style={{ marginBottom: "10px" }}
          />
          <div className="callButtons">
            {callAccepted && !callEnded ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleCallEnded()}
              >
                结束通话
              </Button>
            ) : (
              <IconButton
                color="primary"
                aria-label="call"
                onClick={() => handleCallRemote(idToCall)}
              >
                <PhoneIcon fontSize="large" />
              </IconButton>
            )}
          </div>
        </div>
        {/* accept call */}
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1>{userName}正在呼叫</h1>
            <Button
              color="primary"
              variant="contained"
              onClick={() => handleCallAccepted()}
            >
              同意接听
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
