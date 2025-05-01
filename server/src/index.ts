import { PORT, CLIENT_URL } from './schemas/envSchema';
import { usersRouter } from './routes/users';
import cookie from 'cookie-parser';
import express from 'express';
import log from 'morgan';
import cors from 'cors';
import { mysqlConn } from './connection/mysql';

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
