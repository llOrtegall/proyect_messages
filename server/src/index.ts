import { User, Message, DataWs, SocketClient } from './types/interfaces';
import { verifyToken } from './services/tokenVerifyToken';
import { PORT, CLIENT_URL } from './schemas/envSchema';
import { mysqlConn } from './connection/mysql';
import { usersRouter } from './routes/users';
import { Messages } from './models/messages';
import { Users } from './models/users';
import { WebSocketServer } from 'ws';
import cookie from 'cookie-parser';
import { Op } from 'sequelize';
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
app.use(log('dev'));
app.use(cookie());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/v1', usersRouter);

app.get('/api/v1/messages/:id', async (req, res) => {
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

app.get('/api/v1/people', async (req, res) => {
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

  res.json(users);
})

const serverUp = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mysqlConn.authenticate().then(() => {
  console.log('Database connected');
}).catch((err) => {
  console.log(err);
})

const wss = new WebSocketServer({ server: serverUp });

wss.on('connection', async (conn: SocketClient, req) => {
  const cookie = req.headers.cookie?.split(';').find((cookie) => cookie.startsWith('token='));

  if (!cookie) {
    conn.close();
    return;
  }

  const token = cookie.split('=')[1];

  try {
    const decoded = await verifyToken(token);
    if (decoded) {
      conn.id = decoded.id;
      conn.username = decoded.username;
    }
  } catch (err) {
    console.log(err);
  }

  conn.on('message', async (data) => {
    console.log(JSON.parse(data.toString()));
  });

  conn.on('message', (data, isBinary) => {
    const msgData: DataWs = JSON.parse(data.toString())
    if (msgData.type === 'newMessage' && msgData.data instanceof Object) {
      [...wss.clients].forEach((c: SocketClient) => {
        if(c.id === msgData.data.to){
          c.send(JSON.stringify({
            type: 'newMessage',
            data: msgData.data
          }))
        }
      })
    }
  });

  [...wss.clients].forEach((client) => {
    client.send(JSON.stringify({
      type: 'onlineUsers',
      data: [...wss.clients].map((c: SocketClient) => ({ id: c.id, username: c.username }))
    }))
  })
});