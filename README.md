# 🗳️ Voting App — Backend API

A RESTful backend for an online voting system, built with **Node.js**, **Express**, and **MongoDB**. It supports voter/admin registration, JWT-based authentication, candidate management, and vote casting with built-in rules to keep elections fair (one vote per user, no admin voting, Aadhar-based identity checks).

> This is a backend-only project — no frontend/UI is included. Use tools like Postman, Insomnia, or `curl` to interact with the API.

---

## ✨ Features

- **User authentication** with JWT (signup & login)
- **Role-based access control** — `voter` and `admin` roles
- **Aadhar Card validation** — exactly 12 digits, unique per user
- **One admin, one vote per voter** enforced at the database/business-logic level
- **Candidate management** (create, update, delete) restricted to admins
- **Vote casting** with duplicate-vote and admin-vote prevention
- **Live results** endpoint that returns candidates sorted by vote count
- **Profile management** — view and edit the logged-in user's profile

---

## 🛠️ Tech Stack

| Layer          | Technology                     |
|----------------|---------------------------------|
| Runtime        | Node.js                         |
| Framework      | Express 5                       |
| Database       | MongoDB with Mongoose           |
| Auth           | JSON Web Tokens (`jsonwebtoken`)|
| Password hashing | `bcrypt`                      |
| Env config     | `dotenv`                        |
| Middleware     | `cors`, `body-parser`           |

---

## 📁 Project Structure

```
voting/
├── models/
│   ├── user.js          # User schema (voter/admin, Aadhar, password, isVoted)
│   └── candidate.js      # Candidate schema (name, party, votes, voteCount)
├── routes/
│   ├── userRoutes.js     # Signup, login, profile view/edit
│   └── candidateRoutes.js# CRUD for candidates + voting + results
├── db.js                 # MongoDB connection setup
├── jwt.js                 # JWT auth middleware + token generator
├── server.js              # App entry point
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ralon-1/voting.git
cd voting
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URL_LOCAL=mongodb://127.0.0.1:27017/voting_app
JWT_SECRET=your_super_secret_key
```

| Variable             | Description                                  |
|-----------------------|-----------------------------------------------|
| `PORT`                | Port the server listens on (default: `3000`) |
| `MONGODB_URL_LOCAL`   | MongoDB connection string                     |
| `JWT_SECRET`          | Secret key used to sign/verify JWTs           |

### 4. Run the server

```bash
node server.js
```

The API will be available at `http://localhost:3000`.

---

## 📡 API Reference

All authenticated routes require an `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### 👤 User Routes — `/user`

| Method | Endpoint         | Auth required | Description                              |
|--------|-------------------|:-------------:|-------------------------------------------|
| POST   | `/user/signup`     | ❌            | Register a new voter or admin             |
| POST   | `/user/login`      | ❌            | Log in with Aadhar number & password      |
| GET    | `/user/profile`    | ✅            | Get the logged-in user's profile          |
| POST   | `/user/profile/edit` | ✅          | Update the logged-in user's profile       |

**Signup — request body**
```json
{
  "name": "Jane Doe",
  "age": 28,
  "email": "jane@example.com",
  "mobile": "9876543210",
  "address": "123 Main St",
  "aadharCardNumber": "123456789012",
  "password": "yourpassword",
  "role": "voter"
}
```
> Only one user with `role: "admin"` is allowed. `aadharCardNumber` must be exactly 12 digits and unique.

**Login — request body**
```json
{
  "aadharCardNumber": "123456789012",
  "password": "yourpassword"
}
```
Returns a JWT `token` to be used in the `Authorization` header for protected routes.

---

### 🧑‍⚖️ Candidate Routes — `/candidate`

| Method | Endpoint                      | Auth required | Role required | Description                              |
|--------|--------------------------------|:-------------:|:--------------:|--------------------------------------------|
| GET    | `/candidate`                    | ❌            | —              | List all candidates                        |
| POST   | `/candidate`                    | ✅            | admin          | Add a new candidate                        |
| PUT    | `/candidate/:candidateID`       | ✅            | admin          | Update a candidate's details               |
| DELETE | `/candidate/:candidateID`       | ✅            | admin          | Delete a candidate                         |
| POST   | `/candidate/vote/:candidateID`  | ✅            | voter          | Cast a vote for a candidate                |
| GET    | `/candidate/vote`               | ❌            | —              | Get live results, sorted by vote count     |

**Add candidate — request body**
```json
{
  "name": "Alex Kumar",
  "party": "Independent",
  "age": 45
}
```

**Voting rules enforced by `/candidate/vote/:candidateID`:**
- Admins **cannot** vote.
- Each voter can vote **only once** (`isVoted` flag on the user).
- Returns `404` if the candidate or user doesn't exist.

---

## 🔐 Authentication Flow

1. A user signs up via `POST /user/signup` or logs in via `POST /user/login`.
2. The server issues a JWT containing the user's `id`, signed with `JWT_SECRET`.
3. The client stores this token and sends it in the `Authorization: Bearer <token>` header for protected routes.
4. `jwt.js` middleware (`jwtAuthMiddleware`) verifies the token and attaches the decoded payload to `req.user`.
5. Admin-only routes additionally check `user.role === 'admin'` before proceeding.

---

## 🧪 Example Usage (curl)

```bash
# Sign up a voter
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","age":28,"address":"123 Main St","aadharCardNumber":"123456789012","password":"secret123","role":"voter"}'

# Log in
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{"aadharCardNumber":"123456789012","password":"secret123"}'

# Cast a vote (replace TOKEN and CANDIDATE_ID)
curl -X POST http://localhost:3000/candidate/vote/CANDIDATE_ID \
  -H "Authorization: Bearer TOKEN"

# View results
curl http://localhost:3000/candidate/vote
```

---

## ⚠️ Known Limitations / Notes

- Passwords are currently stored and compared as **plain text** — password hashing with `bcrypt` (already a dependency) is not yet wired into the `User` model or login route. Enable this before using the app with real data.
- There is no route-level input sanitization beyond the Aadhar format check — consider adding a validation layer (e.g. `express-validator` or `zod`) for production use.
- `temp.js` in the repo root is a leftover/reference file and is not mounted in `server.js`.

---

## 🗺️ Roadmap Ideas

- [ ] Hash passwords with `bcrypt` on signup and verify on login
- [ ] Add refresh tokens / token expiry handling on the client side
- [ ] Rate limiting on `/user/login` and `/candidate/vote`
- [ ] Input validation middleware
- [ ] Automated tests (Jest / Supertest)
- [ ] Dockerfile for easier deployment

---

## 📄 License

ISC

## 👤 Author

[ralon-1](https://github.com/ralon-1)
