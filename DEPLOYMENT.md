# Deployment Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for containerised deployment)
- Git

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/aafiya00/warehouse-space-optimization.git
cd warehouse-space-optimization
```

### 2. Backend Setup
```bash
cd backend
python -m venv env
env\Scripts\activate        # Windows
source env/bin/activate     # Mac/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
Backend runs at: http://localhost:8000
Swagger docs at: http://localhost:8000/swagger/

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Docker Deployment (Recommended)

Runs the full stack — PostgreSQL, Redis, Django, and React/Nginx — in one command.

### 1. Build and start all services
```bash
docker-compose up --build
```

### 2. Access the app
| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/swagger/ |
| PostgreSQL | localhost:5432 |

### 3. Stop all services
```bash
docker-compose down
```

### 4. Stop and remove volumes (reset database)
```bash
docker-compose down -v
```

---

## Running Tests

### Backend — all test suites
```bash
cd backend
python manage.py test accounts inventory warehouses approvals notifications tests_security tests_validation --verbosity=2
```

### Frontend — UI tests
```bash
cd frontend
npm run test
```

### Performance tests (requires locust)
```bash
pip install locust
locust -f backend/tests/performance/locustfile.py --headless -u 50 -r 5 --run-time 60s --host http://localhost:8000
```

---

## Production Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Set root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

### Backend → Render
1. Connect GitHub repo to Render
2. Set root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn warehouse_core.wsgi:application`
5. Add environment variables:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `DATABASE_URL`
   - `ALLOWED_HOSTS`
6. Deploy

---

## CI/CD Pipeline

GitHub Actions runs automatically on every push to `main`, `develop`, or `feature/**` branches:

- **Backend job** — installs deps, runs Bandit security scan, runs all tests with coverage
- **Frontend job** — installs deps, lints, builds
- **Docker job** — builds both Docker images (runs only on `main`)