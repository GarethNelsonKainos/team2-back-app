# team2-back-app
Team 2 Backend Application Feb/March 2026

## Environment Setup
Create a `.env` file in the project root with the following content, replacing the placeholders with your actual database credentials:
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=<schema_name>"
SCHEMA_NAME="<schema_name>"
```

Additionally, add `PORT` to the `.env` file if you want to specify a custom port for the backend server (default is 3000):
```env
PORT=1234
```

**DO NOT** commit the `.env` file to version control, as it contains sensitive information. The `.gitignore` file is already configured to ignore it.

## Using the API (Backend)
Install dependencies:

```sh
npm install
```

Run in development mode (with hot reload):

```sh
npm run dev
```

Build the application:

```sh
npm run build
```

Run the production build:

```sh
npm start
```

Run tests:

```sh
npm run test
```

View tests with coverage:

```sh
npm run test:coverage
```

Run linting and formatting checks:

```sh
npm run lint
npm run format:check
```

Migrate the database (after making changes to the Prisma schema):

```sh
npx prisma migrate dev
```

## UI (Frontend)
The frontend is located in a separate [GitHub Repo](https://github.com/GarethNelsonKainos/team2-front-app). Please refer to that repository for instructions on how to set up and run the frontend application.