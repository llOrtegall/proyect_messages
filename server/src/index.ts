import { verifyToken } from './services/tokenVerifyToken';
import { PORT, CLIENT_URL } from './schemas/envSchema';
import { mysqlConn } from './connection/mysql';
import { usersRouter } from './routes/users';
import { WebSocketServer } from 'ws';
import cookie from 'cookie-parser';
import express from 'express';
import log from 'morgan';
import cors from 'cors';

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mysqlConn.authenticate().then(() => {
  console.log('Database connected');
}).catch((err) => {
  console.log(err);
})

const server = app.listen(3010);

const wss = new WebSocketServer({ server });

interface User {
  id: string;
  username: string;
}

interface Message {
  type: string;
  content: string;
  to: Pick<User, 'id'>;
}

// Define una lista o mapa para almacenar los usuarios conectados
const connectedUsers: Map<string, User> = new Map();

wss.on('connection', async (conn, req) => {
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
    }
  } catch (err) {
    console.log(err);
  }

  conn.on('message', (data) => {
    const msgData: Message = JSON.parse(data.toString());
    if (msgData.type === 'message') {
      [...wss.clients].forEach( c => console.log(c))
    }
  });

  // envio la lista de usuarios conectados a todos los clientes
  [...wss.clients].forEach((client) => {
    client.send(JSON.stringify({
      onlineUsers: [...connectedUsers.values()]
    }))
  })

});