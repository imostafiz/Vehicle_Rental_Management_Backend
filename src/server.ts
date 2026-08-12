import { Server } from 'http';
import app from './app';
import config from './config';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION. Shutting down...');
  console.error(err);
  process.exit(1);
});

const server: Server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port} (${config.env})`);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION. Shutting down...');
  console.error(reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
