# Smart Irrigation System Using Soil Moisture and Weather Data 🌿💧

A full-stack precision agriculture and water conservation platform designed for college mini-projects, capstone submissions, and production IoT simulations. The application integrates dynamic **soil moisture telemetry simulation** with live **OpenWeatherMap meteorological forecasts**, processed by an automated **irrigation decision engine** with hardware safety interlocks, interactive data analytics, and downloadable certified PDF audit reports.

---

## 🚀 Key Highlights & Features

1. **Deterministic Decision Engine:**
   - Evaluates soil moisture against ambient precipitation:
     ```
     IF soilMoisture < 35% AND rainProbability < 40%
         → "IRRIGATE_NOW"
     ELSE
         → "NO_IRRIGATION_NEEDED"
     ```
   - Enforces a safety interlock: the irrigation pump is **strictly blocked** from starting unless the engine determines irrigation is needed.

2. **Sensor Simulation Layer:**
   - Simulates physical sensor dynamics with zero hardware dependencies.
   - When the pump runs (`ON`), soil moisture steadily increases (+2% to +5% per step).
   - When stopped (`OFF`), moisture gradually evaporates (-0.3% to -1.0% per step).
   - Interactive dashboard controls allow evaluators to instantly set dry (24%) or moist (52%) states to test decision transitions live.

3. **Live Weather API Integration:**
   - Real-time meteorological data from OpenWeatherMap API using user-configured farm coordinates/city.
   - Resilient fallback engine ensures complete functionality even without an API key or when rate-limited.

4. **Interactive Dashboard & Pump Actuation:**
   - 5 Live Status Cards: Temperature, Humidity, Rain Probability, Soil Moisture, and Pump Status.
   - Animated water-flow stream visualization during active pump sessions.
   - Real-time elapsed runtime and calculated water consumption (15 L/min standard drip rate).

5. **Historical Auditing & Analytics:**
   - Unified chronological timeline with date range filters, category tabs, and CSV export.
   - Recharts telemetry curves: 7-day soil moisture with 35% threshold line, temperature/humidity correlation, and daily water consumption.

6. **Administrative Control Center:**
   - User roster oversight with status toggle (Active/Disabled) and account deletion.
   - Telemetry inspection modal for any farmer.
   - **One-Click Certified PDF Report Generator** (built using `pdfkit`).

7. **Zero-Configuration Embedded Database:**
   - Connects to external MongoDB Atlas via `MONGODB_URI` if provided.
   - Automatically spins up an embedded in-memory MongoDB instance if no database is detected, allowing instant execution on any evaluator's computer!

---

## 👥 Default Demo Accounts (Pre-Seeded)

The system automatically provisions these demonstration accounts on startup with 7 days of realistic historical data:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@irrigation.com` | `Farmer@1234` | Live Dashboard, Pump Controls, History, Analytics, Profile |
| **Admin** | `admin@irrigation.com` | `Admin@1234` | All Farmer features + User Management, Cross-User Audits, PDF Generation |

*(Quick demo buttons are also provided directly on the Login page for one-click access)*

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS, Lucide React Icons, Recharts
- **Backend:** Node.js, Express.js (MVC architecture)
- **Database:** MongoDB via Mongoose (with automated `MongoMemoryServer` fallback)
- **Authentication:** JWT (JSON Web Tokens) + `bcryptjs` password hashing
- **Reports:** `pdfkit`
- **Deployment:** Vercel (Frontend) + Render (Backend)

---

## 📂 Project Architecture

```
SmartIrrigation/
├── .env.example
├── README.md
├── package.json               # Root scripts
├── vercel.json                # Vercel deployment config
├── render.yaml                # Render web service config
│
├── server/                    # Express.js REST API
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── config/            # DB connection & auto-seeder
│   │   ├── controllers/       # Auth, Telemetry, Pump, History, Admin, Reports
│   │   ├── middleware/        # JWT auth, role gate, validator, error handler
│   │   ├── models/            # User, SoilReading, WeatherLog, Recommendation, PumpLog
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Decision Engine, Soil Sim, Weather, PDFKit Builder
│   │   ├── tests/             # Jest unit test suites
│   │   └── server.js          # Express entry point & simulation daemon
│
└── client/                    # React Vite Frontend
    ├── package.json
    ├── vite.config.js         # Dev proxy configuration
    ├── tailwind.config.js     # Agricultural green & dark mode theme
    └── src/
        ├── components/        # Layout, StatCard, WaterAnimation, Recharts
        ├── context/           # AuthContext & ThemeContext
        ├── pages/             # Dashboard, History, Analytics, AdminPanel, Auth
        └── services/          # Axios API client
```

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v18 or higher) and npm installed.

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Start the Backend API
```bash
cd server
npm run dev
```
The server will boot on `http://localhost:5000`. If `MONGODB_URI` is left blank, it automatically initializes embedded MongoDB and seeds the demo farmer and admin accounts.

### 4. Start the Frontend App
In a second terminal window:
```bash
cd client
npm run dev
```
Open your browser at: **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

The decision engine and authentication primitives include automated unit tests:
```bash
cd server
npm test
```
All boundary conditions (<35%, =35%, >35%, rain probabilities, and password hashing) will be verified.

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register farmer or admin
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET  /api/auth/me` — Get current user profile (Protected)
- `PUT  /api/auth/profile` — Update city, name, or crop type (Protected)
- `POST /api/auth/forgot-password` — Generate demo reset token
- `POST /api/auth/reset-password/:token` — Set new password

### Telemetry & Irrigation
- `GET  /api/telemetry/soil/latest` — Latest moisture reading & recent readings
- `POST /api/telemetry/soil/simulate` — Trigger simulation tick or force moisture %
- `GET  /api/telemetry/weather` — Current OpenWeatherMap data for farm city
- `GET  /api/recommendation/latest` — Latest decision engine result
- `POST /api/recommendation/evaluate` — Force recomputation of recommendation

### Pump Actuator
- `GET  /api/pump/status` — Running status, active runtime, last session
- `POST /api/pump/toggle` — Toggle pump ON/OFF (Protected by decision engine gate)

### Audits & Reports
- `GET  /api/history?page=1&limit=15&category=ALL&from=&to=` — Paginated audit log
- `GET  /api/analytics?days=7` — Aggregated Recharts metrics & water savings
- `GET  /api/reports/:userId?from=&to=` — Stream downloadable PDF audit report

### Admin Management
- `GET    /api/admin/users` — List registered users with summary stats
- `PATCH  /api/admin/users/:id/status` — Toggle user Active/Disabled
- `DELETE /api/admin/users/:id` — Delete user and associated telemetry
- `GET    /api/admin/users/:id/history` — Inspect user's telemetry records

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Push project to GitHub.
2. Link repository in Vercel.
3. Set **Root Directory** to `client`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Deploy! (Routing rewrites are already configured in [`vercel.json`](./vercel.json)).

### Deploying Backend to Render
1. Create a **Web Service** on Render pointing to your repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Configure Environment Variables in Render Dashboard:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_irrigation` (MongoDB Atlas)
   - `JWT_SECRET` = `<your-random-32-char-secret>`
   - `OPENWEATHER_API_KEY` = `<your-openweathermap-key>`
   - `DEFAULT_CITY` = `Bengaluru`

---

## 📜 License
Developed for educational demonstration, college mini-projects, and precision IoT coursework. Released under the MIT License.
