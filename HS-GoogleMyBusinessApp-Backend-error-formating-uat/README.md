# Introduction
This application facilitates communication to the Google My Business API. It provides response formatting and abstracts the
GMB limitation of only working with one location per request.

# Setup Instructions
## Docker Installation Instructions
The application is running on Docker. Follow the instructions below to install with Docker.

### Requirements
* Docker
* Docker Compose
* Make
* Node (Version 8)

### Configuration
When being built, this project will reference the values in the root `.env` file. This file is populated during the build
setup process using the values stored in the appropriate `.config/.env.[environment]` file. For example, creating a local
build will mean that `.env` is populated with values from `.config/.env.local`.

Use Make commands to toggle to the appropriate environment configuration.

**NOTE:** The Make commands will overwrite the root `.env` with an environment-specific `.env.[environment]` file. Any
changes made to the root `.env` will be lost when the project is rebuilt. As a result, it is important to make your
environment changes in the `.env.[environment]` files instead of in the root `.env` directly.

The following environment variables exist in the project.

| Env Var | Default | Description |
| ------- | ------- | ----------- |
| `PROJECT`| `hootsuite-gmb` | Used for tagging the images. |
| `NODE_ENV` | `development` | The current environment node is running in. |
| `BUILD_TARGET`] | `development` | The stage in the Dockerfile to build. |
| `ACCOUNT_ID` | `175302565902` | AWS Elastic account. |
| `REPO` | `hootsuite-gmb-api` | Container registry name. |
| `REGION` | `ca-central-1` | Elastic region. |
| `PROFILE` | `freshworks` | Profile for AWS connection. |
| `PROJECT` | `hootsuite-gmb-api` | Elastic project name. |
| `BUCKET_NAME` | `elasticbeanstalk-ca-central-1-175302565902` | Elastic bucket name. |
| `POSTGRES_DB` | `hootsuite-gmb` | Postgres database name. |
| `POSTGRES_USER` | `freshworks` | Postgres database user. |
| `POSTGRES_PASSWORD` | `Fresh123!` | Postgres password. |
| `GOOGLE_CLIENT_ID` |  | Google API client ID. Required to run the app locally. |
| `GOOGLE_CLIENT_SECRET` |  | Google API secret. Required to run the app locally. |
| `GOOGLE_REDIRECT_URI` |  | Google oAuth redirect URI. |
| `SHARED_SECRET` | `testing` | Share secret with Hootsuite dashboard. |
| `SECRET` | `testing`| Secret used to encrypt the JWT. |


**NOTE:** The `GOOGLE_CLIENT_SECRET` environment variable is required in order to support Google Sign-in. At the time of
writing, the only way to get this value is to ask an existing developer on the project or to get access to the Google
Developer account on which this auth screen is configured. This can be found by clicking on the link to the Google Developer
project on the Google Sign-in window.

### Building
All builds (local, production, staging etc.) are run through the Make commands. The Make commands parse in the environment
variables so that they are available to the docker-compose file and containers it generates. It is essential that you use
the Make commands to ensure that the correct variables are defined in the build.

| Make Command | Description |
| ------------ | ----------- |
| `make local` | Builds the container based on your local git branch and 'mocks' the applicable services for full integration development and testing. Links to your host files so that changes are automatically reflected in the running container. |
| `make close-local` | Closes the local development containers and networks.|
| `make deploy` | Builds the container based on the dev settings files. Pushes the containers and deploys them to AWS.|
| `make healthcheck` | Returns the status to the deployed AWS container. |
| `make database` | Connects to the local running database container. |
| `make help` | Lists all available task-targets, helpers and available commands in this Makefile. |

### Installation
* Open a terminal
* Clone the repository:

```
$ git clone git@bitbucket.org:freshworks/hootsuite-gmb-api.git
```

* One-time setup of the configuration files for local development:

```
$ cp .config/ormconfig.example.json .config/ormconfig.local.json
$ cp .config/.env.example .config/.env.local
```

* Add a value for `GOOGLE_CLIENT_SECRET` in `.config/.env.local` (see Configuration for more details)

* Ensure that you are using Node 8 (10 may work but is not recommended)
* With the configuration complete, run the following commands:
```
$ npm ci
$ npm run build
$ make local
```

The above commands only need to be run again if the `package.json` is updated. Otherwise, the project can be started with:
```
$ make local
```

Test with Postman to `http://localhost:5000/api/healthcheck` or the port number that is specified in `.config/.env.*`

### Testing
To run the tests, issue the following commands from the project root:
```
$ npm run test-unit
$ npm run test-int
```

### Deployment

With the proper `.env` config values, a deployment to Staging should work
simply by using the following command
```
$ make deploy-staging
```

However, due to the fact that Production is hosted on the client's AWS account,
which includes 2-factor authentication, the Make command for a Production
deployment will not work without further configuration and setup.

For full details on the Production deployment process, please review [this
page](https://sites.google.com/a/freshworks.io/developers/projects/hootsuite-gmb).
