# Chatroom

A real-time chatroom application built with **React.js** and **Socket.IO**.  
One device acts as the **server**, and another acts as the **client**. Messages are processed through the server and transmitted to connected clients, enabling fast, interactive communication.

---

## 🚀 Features
- **Private Rooms** – Users can join specific chatrooms using unique codes.  
- **Direct Messages** – Send private messages directly to another user.  
- **User Counter** – Displays the number of active users online.  
- **Server Announcements** – Automatic system messages when users join or leave rooms.  
- **Real-Time Messaging** – Instant message delivery with Socket.IO event handling.  

---

## 🛠 Tech Stack
- **Frontend:** React.js  
- **Backend:** Node.js, Express  
- **WebSockets:** Socket.IO  
- **Other:** Webhooks for event-driven communication  

---

## ▶️ Getting Started

### Prerequisites
- Node.js and npm installed

### Installation
Clone the repository and install dependencies:

```bash
# Clone repo
git clone https://github.com/your-username/chatroom-app.git
cd chatroom-app

# Install client dependencies
cd client/react-app
npm install

# Install server dependencies
cd ../../server
npm install

Running the App

Start the server:

cd server
node server.js 


Start the client (in a new terminal window):

cd client/react-app
npm start
