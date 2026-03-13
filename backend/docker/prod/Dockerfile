FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# collect static files (if Django project uses them)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "project_name.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
