# Paper Trading Pro

A professional terminal-style paper trading platform with AI signal analysis, paper trading engine, gamification, and leaderboards.

## How to Start the Project

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

---

### Step 1: Start the Backend Service

Navigate to the `backend` directory, activate the virtual environment, and run the FastAPI data app:

```bash
cd backend
```

**Activate Virtual Environment:**
- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\activate
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

**Run the Backend Server:**
```bash
python data_app.py
```
*or directly with Uvicorn:*
```bash
uvicorn data_app:app --host 0.0.0.0 --port 8000 --reload
```

The backend server runs on `http://127.0.0.1:8000`.

---

### Step 2: Start the Frontend Application

Open a new terminal window/tab, navigate to the `frontend` directory, install dependencies (if not installed), and launch the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will run on `http://localhost:5173`.

---

## Test Credentials

- **Email:** `test@example.com`
- **Password:** `test123`
