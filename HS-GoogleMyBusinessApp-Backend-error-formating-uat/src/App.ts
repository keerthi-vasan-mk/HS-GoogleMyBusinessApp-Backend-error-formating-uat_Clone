import 'reflect-metadata'; // this shim is required for decorator support
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import { createConnection } from 'typeorm';
import { AuthController } from './controllers/AuthController';
import { HomeController } from './controllers/HomeController';
import { LocationController } from './controllers/LocationController';
import { ReviewController } from './controllers/ReviewController';
import { QuestionController } from './controllers/QuestionController';
import { PostController } from './controllers/PostController';
import { errorHandler, unhandledApis } from './middleware/ErrorMiddleware';
import { StreamController } from './controllers/StreamController';
import { NotificationController } from './controllers/NotificationController';
import { AnalyticsController } from './controllers/AnalyticsController';
import { LogController } from './controllers/LogController';
import { LoggerService } from './utils/LoggerService';

export class App {
  private _app: express.Application;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this._app = express();

    this.initializeMiddleware();

    //
    // Register the express app with the routing controllers.
    // Must import the controllers seperatly in order to work correctly in unit tests.
    useExpressServer(this._app, {
      routePrefix: '/api',
      defaultErrorHandler: false,
      controllers: [
        AuthController,
        HomeController,
        LocationController,
        ReviewController,
        QuestionController,
        PostController,
        StreamController,
        NotificationController,
        AnalyticsController,
        LogController,
      ],
    });

    // Enable proxy trusting to allow location logging via IP lookup
    this._app.enable('trust proxy');

    // Middleware to handle unmatched routes
    this._app.use(unhandledApis);

    // Error handling must be defined at the end of all middleware and controllers.
    this._app.use(errorHandler);
  }

  /**
   * Initializes any application middleware
   *
   * @returns void
   */
  private initializeMiddleware(): void {
    // Loads environment variables from a .env file into process.env
    dotenv.config();

    this._app.use(express.json());
    this._app.use(express.urlencoded({ extended: true }));
    this._app.use(cors());
    this._app.options('*', cors());
  }

  /**
   * Starts the application with a database connection
   *
   * @returns void
   */
  public async listen(): Promise<void> {
    try {
      await createConnection();
      this._app.listen(this.port, () => {
        if (process.env.NODE_ENV == 'development') {
          LoggerService.info(`App listening on port ${this.port}`);
        }
      });
    } catch (e) {
      LoggerService.error(`Error starting the application. Error: ${e}`);
    }
  }

  get app() {
    return this._app;
  }
}
