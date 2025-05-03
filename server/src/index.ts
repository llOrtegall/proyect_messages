import { verifyToken } from './services/tokenVerifyToken';
import { PORT, CLIENT_URL } from './schemas/envSchema';
import { WebSocketServer, type WebSocket } from 'ws';
import { mysqlConn } from './connection/mysql';
import { usersRouter } from './routes/users';
import { Messages } from './models/messages';
import cookie from 'cookie-parser';
import express from 'express';
import log from 'morgan';
import cors from 'cors';
import { Op } from 'sequelize';
import { Users } from './models/users';

const app = express();

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(log('dev'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/v1', usersRouter);

app.get('/api/v1/messages/:id', async(req, res) => {
  const { id } = req.params;
  const user = await verifyToken(req.cookies.token);

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const messages = await Messages.findAll({
    where: {
      [Op.or]: [
        { from: user.id, to: id },
        { from: id, to: user.id }
      ]
    },
    order: [['createdAt', 'ASC']]
  });

  res.json(messages);
});

app.get('/api/v1/people', async(req, res) => {
  const user = await verifyToken(req.cookies.token);

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const users = await Users.findAll({
    attributes: ['id', 'username'],
    where: {
      id: { [Op.ne]: user.id }
    }
  })

  const onlineUsers = [...connectedUsers.values()];

  const usersOffline = users.filter((user) => !onlineUsers.some((u) => u.id === user.id));

  res.json(usersOffline);
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mysqlConn.authenticate().then(() => {
  console.log('Database connected');
}).catch((err) => {
  console.log(err);
})

const server = app.listen(3010);

interface SocketClient extends WebSocket {
  id?: string;
  username?: string;
  isAlive?: boolean;
  timer?: NodeJS.Timeout;
  deathTimer?: NodeJS.Timeout;
}

const wss = new WebSocketServer({ server });

interface User {
  id: string;
  username: string;
}

interface Message {
  type: string;
  content: string;
  to: string;
}

// Define una lista o mapa para almacenar los usuarios conectados
const connectedUsers: Map<string, User> = new Map();

wss.on('connection', async (conn: SocketClient, req) => {
  function notifyAboutOnlineUsers() {
    [...wss.clients].forEach((client) => {
      client.send(JSON.stringify({
        onlineUsers: [...connectedUsers.values()]
      }))
    })
  }
  conn.isAlive = true;

  conn.timer = setInterval(() => {
    conn.ping();
    conn.deathTimer = setTimeout(() => {
      conn.isAlive = false;
      conn.terminate();
      notifyAboutOnlineUsers();
      console.log('User is dead');
    }, 1000)
  }, 5000);

  conn.on('pong', () => {
    clearTimeout(conn.deathTimer);
  })

  const cookie = req.headers.cookie?.split(';').find((cookie) => cookie.startsWith('token='));

  if (!cookie) {
    conn.close();
    return;
  }

  const token = cookie.split('=')[1];

  try {
    const decoded = await verifyToken(token);
    if (decoded) {
      // si el usuario ya esta conectado, no lo agregamos
      if (!connectedUsers.has(decoded.id)) {
        connectedUsers.set(decoded.id, { id: decoded.id, username: decoded.username });
      }
      conn.id = decoded.id;
      conn.username = decoded.username;
    }
  } catch (err) {
    console.log(err);
  }

  conn.on('message', async(data) => {
    const msgData: Message = JSON.parse(data.toString());
    if (msgData.type === 'message' && conn.id) {
      // save message on db
      await Messages.sync();
      await Messages.create({
        content: msgData.content,
        from: conn.id,
        to: msgData.to
      });

      [...wss.clients]
      .filter((c: SocketClient) => c.id === msgData.to )
      .forEach((c: SocketClient) => c.send(JSON.stringify({
        messages: {
          type: 'message',
          content: msgData.content,
          from: conn.id,
          to: msgData.to
        }
      })))
    }
  });

  notifyAboutOnlineUsers();
});

wss.on('close', (conn: SocketClient) => {
  if (conn.id) {
    connectedUsers.delete(conn.id);
  }
})