import { WebSocketServer, WebSocket } from "ws";
import https from "https";
import fs from "fs";

const server = https.createServer({
  cert: fs.readFileSync('/home/vanshchopra101/ssl/fullchain.pem'),
  key: fs.readFileSync('/home/vanshchopra101/ssl/privkey.pem'),
});

const wss = new WebSocket.Server({ server });

type Client = {
  socket: WebSocket;
  username: string;
  roomId: string;
};

type JoinMessage = {
  type: "JOIN";
  username: string;
  roomId: string;
};

type ChatMessage = {
  type: "CHAT";
  content: string;
  sender: string;
  roomId: string;
};

type LeaveMessage = {
  type: "LEAVE";
  username: string;
  roomId: string;
};

type Message = JoinMessage | ChatMessage | LeaveMessage;

let clients: Client[] = [];

function handleJoin(ws: WebSocket, message: JoinMessage) {
  const newClient: Client = {
    socket: ws,
    username: message.username,
    roomId: message.roomId,
  };
  console.log(`User ${newClient.username} joined room ${newClient.roomId}`);
  clients.push(newClient);
}

function handleChat(message: ChatMessage) {
  console.log(
    `User ${message.sender} sent a message to room ${message.roomId}`,
  );
  clients.forEach((client) => {
    if (client.roomId === message.roomId) {
      client.socket.send(
        JSON.stringify({
          type: "CHAT",
          content: message.content,
          sender: message.sender,
        }),
      );
    }
  });
}

function handleLeave(ws: WebSocket, message: LeaveMessage) {
  console.log(`User ${message.username} left room ${message.roomId}`);
  clients = clients.filter((client) => client.socket !== ws);
}

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected to the server");
  ws.on("message", (message: string) => {
    try {
      const parsedMessage = JSON.parse(message.toString()) as Message;
      switch (parsedMessage.type) {
        case "JOIN":
          handleJoin(ws, parsedMessage);
          break;
        case "CHAT":
          handleChat(parsedMessage);
          break;
        case "LEAVE":
          handleLeave(ws, parsedMessage);
          break;
        default:
          console.warn("Unknown message type received");
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });
    ws.on("close", () => {
        console.log("Client disconnected");
        clients = clients.filter(client => client.socket !== ws);
    });
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});


server.listen(8080, () => {
  console.log('Secure WebSocket server running on wss://vansh-ws.dsandev.in:8080');
});