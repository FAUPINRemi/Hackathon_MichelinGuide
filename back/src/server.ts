import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import restaurantsRouter from './routes/restaurants.js';
import hotelsRouter from './routes/hotels.js';
import roadtripRouter from './routes/roadtrip.js';
import placesRouter from './routes/places.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { openapiSpec } from './docs/openapi.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(
  (pinoHttp as unknown as (opts: {
    logger: typeof logger;
    customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => 'error' | 'warn' | 'info';
  }) => express.RequestHandler)({
    logger,
    customLogLevel: (_: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'michelin-back', version: 'roadtrip-ts-v1' });
});

app.get('/api/docs.json', (_, res) => {
  res.json(openapiSpec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/restaurants', restaurantsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/roadtrip', roadtripRouter);
app.use('/api/places', placesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening');
});
