# Grind API — Job Tracking Backend

Express and MongoDB API for the [Grind job-tracking application](https://github.com/Nashid-k/grind-client).

## Related repository

- **Web client:** [Nashid-k/grind-client](https://github.com/Nashid-k/grind-client)
- **API server:** this repository

## API modules

| Base path | Responsibility |
|---|---|
| `/api/auth` | Authentication |
| `/api/jobs` | Job records and tracking |
| `/api/friends` | Friends and social features |
| `/api/leaderboard` | Leaderboard |
| `/api/challenges` | Challenges |
| `/api/prep` | Interview and preparation resources |
| `/api/reviews` | Reviews |

The API uses Node.js, Express, Mongoose, and MongoDB. It loads configuration with dotenv and connects to MongoDB before starting the HTTP listener.

## Requirements

- Node.js (an LTS release recommended)
- MongoDB instance (local or hosted)

## Local development

```bash
git clone https://github.com/Nashid-k/grind-server.git
cd grind-server
npm install
cp .env.example .env
```

Set these variables in your local `.env` file:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (defaults to `5000`) |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used for token signing |

Start the development server with `npm run dev`; use `npm start` for the standard start command.

## Project structure

```text
.
├── models/       # Mongoose models
├── routes/       # Express route modules
├── db.js         # Database connection
├── index.js      # Express app and route registration
└── .env.example  # Environment variable names
```

## Security

Never commit `.env` or real credentials. Use a unique, high-entropy `JWT_SECRET` in each environment, restrict CORS origins before production, and rotate any credential that has been committed to a public repository.
