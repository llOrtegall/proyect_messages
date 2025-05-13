import { File, DataWs, SocketClient, Message } from './types/interfaces';
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
import fs from 'node:fs';
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

app.use('/uploads', express.static(__dirname + '/uploads'));

app.get('/api/v1/messages', async (req, res) => {
  const params = req.query;

  // validate is objen and exist id on type string
  if (typeof params.id !== 'string') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }

  const user = await verifyToken(req.cookies.token);

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const messages = await Messages.findAll({
    where: {
      [Op.or]: [
        { from: user.id, to: params.id },
        { from: params.id, to: user.id }
      ]
    },
    order: [['createdAt', 'ASC']]
  });

  res.status(200).json(messages);
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

app.get('/api/v1/logout', async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
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

  conn.isAlive = true;

  conn.timer = setInterval(() => {
    conn.ping();
    conn.deathTimer = setTimeout(() => {
      conn.isAlive = false;
      conn.terminate();
      NotifyOnlineUsers()
      clearInterval(conn.timer)
      clearTimeout(conn.deathTimer)
    }, 1000)
  }, 10000)

  conn.on('pong', () => {
    clearTimeout(conn.deathTimer)
  })

  const NotifyOnlineUsers = () => [...wss.clients].forEach((client) => {
    client.send(JSON.stringify({
      type: 'onlineUsers',
      data: [...wss.clients].map((c: SocketClient) => ({ id: c.id, username: c.username }))
    }))
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
      conn.id = decoded.id;
      conn.username = decoded.username;
    }
  } catch (err) {
    console.log(err);
  }

  conn.on('message', async (data) => {
    const msgData: DataWs = JSON.parse(data.toString());
    if (msgData.type === 'newMessage' && msgData.data instanceof Object) {
      const message = msgData.data as Message;

      await Messages.sync();
      await Messages.create({
        content: message.content,
        from: message.from,
        to: message.to
      });

      [...wss.clients].forEach((c: SocketClient) => {
        if(c.id === message.to){
          c.send(JSON.stringify({
            type: 'newMessage',
            data: msgData.data
          }))
        }
      })
    } else if (msgData.type === 'newFile' && msgData.data instanceof Object) {
      const { name, type, size, content } = msgData.data as File;

      const parts = name.split('.');
      const extension = parts[parts.length - 1];
      const fileName = Date.now() + '.' + extension;
      const path = __dirname + '/uploads/' + fileName;
      const bufferData = Buffer.from(content, 'base64');

      fs.writeFile(path, bufferData, () => {
        console.log('File saved' + path);
      });
    }
  });

  NotifyOnlineUsers()
});

