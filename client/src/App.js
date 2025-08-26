import { io } from 'socket.io-client';
import { useRef, useState, useEffect } from 'react';
import './index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCircle } from '@fortawesome/free-solid-svg-icons';
function App() {
  const [chatlog, setChatLog] = useState([]);
  const [socket, setSocket] = useState(null);
  const chatRef = useRef(null);
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState('public');

  const [numOnline, setNumOnline] = useState(null);
  const [roomList, setRoomList] = useState(null);

  useEffect(() => {
    document.title = `Chat Room - ${room}`;
    function userPrompt() {
      const tempUser = prompt('Enter your username: (max 13 chars)');
      if (tempUser.length > 13 || tempUser.length === 0) {
        userPrompt();
      }
      else {
        setUser(tempUser);
      }
    }
    userPrompt();

  }, []);

  function addToLog(sender, data, [attribute, in_room], type) {
    setChatLog(cl => [...cl, [sender, data, [attribute, in_room], type]]);
  }

  //wait until username has been entered
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setRoom('public');
        addToLog('Server', `${user} has connected!`, ['server-msg'], 'p');
        newSocket.emit('connected', user);
        newSocket.emit('get-room-list', 'public');
      })
      newSocket.on('announce-connection', user => {
        newSocket.emit('get-room-list', 'public');
        addToLog('Server', `${user} has connected!`, ['server-msg'], 'p');
      })

      newSocket.on('resend-message', (msg, otherUser) => {
        addToLog(otherUser, msg, ['other'], 'p');
      })

      newSocket.on('announce-join', (thisRoom, otherUser) => {
        newSocket.emit('get-room-list', thisRoom);
        if (thisRoom !== 'public') {
          addToLog('Server', `${otherUser} joined ${thisRoom}!`, ['server-msg', 'in-room'], 'p');
        }
        else {
          addToLog('Server', `${otherUser} joined public room!`, ['server-msg'], 'p');
        }
      })

      newSocket.on('announce-leave', (thisRoom, otherUser) => {
        newSocket.emit('get-room-list', thisRoom);
        if (thisRoom !== 'public') {
          addToLog('Server', `${otherUser} left ${thisRoom}!`, ['server-msg', 'in-room'], 'p');
        }
        else {
          addToLog('Server', `${otherUser} left public room!`, ['server-msg'], 'p');
        }
      })
      newSocket.on('resend-image', (user, data) => {
        if (room !== '') {
          addToLog(user, data, ['otheruser', 'in-room'], 'img');
        }
        else {
          addToLog(user, data, ['otheruser'], 'img');
        }

      });
      newSocket.on('announce-disconnection', (user, room) => {
        newSocket.emit('get-room-list', room);
        addToLog('Server', `${user} has disconnected!`, ['server-msg'], 'p');
      })


      newSocket.on('update-num-online', numOn => {
        setNumOnline(numOn);
      })

      newSocket.on('update-room-list', rl => {
        setRoomList(rl);

      })
      return () => {
        newSocket.disconnect();
      }
    }

  }, [user]);

  //whenever room is updated after username is inputted, event listener is updated
  useEffect(() => {
    if (user) {
      function handleDisconnect(event) {
        socket.emit('disconnected', user, room);
        event.preventDefault();
        event.returnValue = '';
      }
      window.addEventListener('beforeunload', handleDisconnect);
      return () => {
        window.removeEventListener('beforeunload', handleDisconnect);
      }
    }


  }, [user, room, socket]);

  //TO START SERVER: npm run devStart
  //TO START CLIENT: npm start in chatroom/client/react-app

  function sendMessage(message) {
    addToLog(user, message, ['self', room !== 'public' ? 'in-room' : undefined], 'p');
    socket.emit('send-message', message, room, user);
  }

  function sendImage(input) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('image', reader.result, user, room);
      if (room !== 'public') {
        addToLog(user, reader.result, ['self', 'in-room'], 'img');
      }
      else {
        addToLog(user, reader.result, ['self'], 'img');
      }

    };
    reader.readAsDataURL(input.files[0]);

  };


  function joinRoom(rm) {
    setRoom(rm);
    socket.emit('join-room', rm, user);
    socket.emit('get-room-list', rm);
    if (rm !== 'public' && user) {
      addToLog('Server', `${user} joined ${rm}!`, ['server-msg', 'in-room'], 'p');
    }
    else if (user) {
      addToLog('Server', `${user} joined public room!`, ['server-msg'], 'p');
    }
  }

  function leaveRoom(rm) {
    if (rm !== 'public') {
      addToLog('Server', `${user} left ${rm}!`, ['server-msg', 'in-room'], 'p');
    }
    else {
      addToLog('Server', `${user} left public room!`, ['server-msg'], 'p');
    }
    socket.emit('leave-room', rm, user);
    setRoom('');
  }


  function convertNumber(num) {

    if (num < 1000) {
      return num;
    }
    else {
      if (num % 1000 < 100) {
        return `${Math.floor(num / 1000)}K`
      }
      else {
        return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 100)}K`
      }
    }

  }
  return (
    <>
      <div className="side-bar side">
        <div className="container user-container">
          <p className="label">User:</p>
          <p className="display">{user ? user : '...'}</p>
        </div>
        <div className="num-online-container">
          <FontAwesomeIcon className="label" icon={faCircle} style={{ color: 'rgb(0, 200, 0)' }} />
          <p className="display" >{numOnline ? convertNumber(numOnline) : '...'}</p>
        </div>
        <br></br>
        <div className="container room-name-container">
          <p className="label">Room:</p>
          <p className="display">{room ? room : '...'}</p>
        </div>

        <div className="room-list-container" id="room-list-container">
          <p className="label">Room List:</p>
          <div className="roomlist">
            {roomList ? roomList.map(el => {
              return <ol className={el === user ? 'self' : 'other'}><span style={{ color: 'white' }}>•</span> {el}</ol>
            }) : '...'}


          </div>
        </div>
      </div>
      <div className="main side">
        <div className="chat-container">
          <div ref={chatRef} className="chatlog">{chatlog.map(([sender, data, [attribute, in_room], type], i) => {
            if (type === 'img') {
              return <>
                <div className={`message ${in_room ? in_room : ''}`} key={i}>
                  <p className={`sender ${attribute}`} id="img-sender">{sender}:</p>
                  <img style={{ width: '20%', marginLeft: `${1 * sender.length + 10}px`, border: '1px solid black' }} src={data} alt="Image Unavailable"></img>
                </div>
              </>
            }
            if (type === 'p') {
              return <>
                <div className={`message ${in_room ? in_room : ''}`} key={i}>
                  <p className={`sender ${attribute}`}>{sender}:</p>
                  <p className="data">{data}</p>
                </div>
              </>
            }
            return <></>
          })}</div>

          <div className="file-input-container">
            <input className="file-input" id="file-input" type="file" onChange={(e) => {
              if (e.target.files[0].type.startsWith('image/')) {
                document.querySelector('#file-icon').style.color = 'green';
              }
              else {
                document.querySelector('#file-icon').style.color = 'red';
                e.target.value = '';
              }
            }}></input>
            <FontAwesomeIcon className="file-icon" id="file-icon" icon={faUpload} />
          </div>
          <input className="message-input" id="message-input" placeholder="Enter Message" onKeyUp={(e) => {
            if (e.key == "Enter") {
              if (document.querySelector('#message-input').value) {
                sendMessage(document.querySelector('#message-input').value);
              }
              if (document.querySelector('#file-input').value) {
                sendImage(document.querySelector('#file-input'));
              }
              document.querySelector('#message-input').value = '';
              document.querySelector('#file-input').value = '';
              document.querySelector('#file-icon').style.color = '';
            }
          }}></input>
          <br></br>
          <br></br>
          <input className="room-input" id="room-input" placeholder="Enter Room ID (Max 20)" onKeyUp={(e) => {
            if (e.key == "Enter") {
              if (document.querySelector('#room-input').value !== room && document.querySelector('#room-input').value.length <= 20 && document.querySelector('#room-input').value !== '') {

                leaveRoom(room);
                joinRoom(document.querySelector('#room-input').value);


              }
              else if (document.querySelector('#room-input').value === '' && room !== 'public') {
                leaveRoom(room);
                joinRoom('public');
              }
            }
          }}></input>


        </div>
      </div>

    </>
  );
}

export default App;
