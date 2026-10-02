import express from 'express';
import session from 'express-session';
import httpErrors from 'http-errors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import routes from './routes.js';

export default function main(options, cb) {
  const ready = cb || function () {};
  const opts = Object.assign({}, options);
  const logger = pino();

  let server;
  let serverStarted = false;
  let serverClosing = false;

  function unhandledError(err) {
    logger.error(err);
    if (serverClosing) return;
    serverClosing = true;

    if (serverStarted) {
      server.close(() => process.exit(1));
    }
  }

  process.on('uncaughtException', unhandledError);
  process.on('unhandledRejection', unhandledError);

  const app = express();

  // Middlewares globais
  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(
    session({
      secret: 'fingerpint',
      resave: true,
      saveUninitialized: true
    })
  );

  // Registra as rotas
  routes(app, opts);

  // Handlers de erro
  app.use(function fourOhFourHandler(req, res, next) {
    next(httpErrors(404, `Route not found: ${req.url}`));
  });

  app.use(function fiveHundredHandler(err, req, res, next) {
    if (err.status >= 500) {
      logger.error(err);
    }
    res.status(err.status || 500).json({
      messages: [
        {
          code: err.code || 'InternalServerError',
          message: err.message
        }
      ]
    });
  });

  server = app.listen(opts.port, opts.host, function (err) {
    if (err) return ready(err, app, server);
    if (serverClosing) {
      return ready(new Error('Server was closed before it could start'));
    }

    serverStarted = true;
    const addr = server.address();
    logger.info(`Started at ${opts.host || addr.host || 'localhost'}:${addr.port}`);
    ready(err, app, server);
  });
}