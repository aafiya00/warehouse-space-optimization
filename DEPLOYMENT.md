# Deployment Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- Git

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/warehouse-space-optimization.git
cd warehouse-space-optimization
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv env
env\Scripts\activate        # Windows
source env/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend runs at: http://localhost:8000
Swagger docs at: http://localhost:8000/swagger/

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Running Tests
```bash
cd backend
python manage.py test --verbosity=2
```

## Production Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### Backend → Render
1. Connect GitHub repo to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn warehouse_core.wsgi:application`
4. Add environment variables:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `DATABASE_URL`
5. Deploy