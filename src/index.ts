import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import healthRouter from './routes/health';
import chatRouter from './routes/chat';
import auditHandler from './routes/audit';
import wallHandler from './routes/wall';

const app = express();
app.use(cors({ origin: ['https://trustchat.dev', 'https://www.trustchat.dev', 'http://localhost:3000'] }));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/chat', chatRouter);
app.post('/audit', auditHandler);
app.get('/wall', wallHandler);

const server = app.listen(CONFIG.PORT, () => {
  console.log(`trustchat-backend listening on port ${CONFIG.PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
