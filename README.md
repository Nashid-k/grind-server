# Grind API — Career Tracker Backend

Express and MongoDB API for the [Grind career-tracking application](https://github.com/Nashid-k/grind-client).

## API modules

| Base path | Responsibility |
|---|---|
| `/api/auth` | Registration, login and Google sign-in handler |
| `/api/jobs` | Job records and tracking |
| `/api/friends` | Friends and social features |
| `/api/leaderboard` | Leaderboard |
| `/api/challenges` | Challenges |
| `/api/prep` | Interview and preparation resources |
| `/api/reviews` | Reviews |

## Stack

Node.js, Express, Mongoose, MongoDB, dotenv and Axios.

## Local development

```bash
git clone https://github.com/Nashid-k/grind-server.git
cd grind-server
npm install
cp .env.example .env
npm run dev
```

The API defaults to port `5000`.

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Reserved for token-based authentication; current routes do not yet issue or verify JWTs |
| `CLIENT_URL` | Allowed frontend origin for CORS |

## Important security status

**Do not use real user accounts or deploy this API as a production authentication service yet.** The current username/password routes store and compare passwords as plain text. The Google sign-in handler also needs server-side ID-token verification. User-facing routes need authorization checks before they can be considered secure.

The database connection string is read from `MONGO_URI`; no credential is embedded in source code. Rotate any MongoDB credential that was previously committed to a public repository.
