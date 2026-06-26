# FoodChain AI - Phase 1 (Foundation)

You are a senior Full Stack Engineer and AI Architect.

Build **Phase 1** of a production-grade AI-powered procurement platform called **FoodChain AI**.

The application helps street food vendors find the best nearby raw material suppliers.

This phase should ONLY build the application foundation.

**Do NOT implement the Machine Learning model yet.**

The project must follow production-grade software engineering practices with clean architecture, modular code, reusable components, proper folder structure, and industry standards.

---

# Tech Stack

## Frontend

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query
* Axios
* React Hook Form
* Zod
* Framer Motion
* React Leaflet (for future maps)

---

## Backend

* FastAPI
* Python 3.12
* SQLAlchemy 2
* PostgreSQL
* Alembic
* Pydantic v2
* JWT Authentication
* Passlib
* Uvicorn

---

## Database

PostgreSQL

---

## Project Structure

Create the following structure.

```text
FoodChainAI/

frontend/

backend/

data/

models/

notebooks/

README.md

docker-compose.yml

.env.example
```

Inside backend create:

```text
app/

api/

core/

db/

models/

schemas/

services/

utils/

main.py
```

Inside frontend create:

```text
app/

components/

hooks/

lib/

services/

types/

public/
```

---

# Authentication

Implement complete authentication.

Features

* Register
* Login
* Logout
* JWT Authentication
* Password Hashing
* Protected Routes
* User Profile

Use secure authentication practices.

---

# Registration

During registration collect

* Full Name
* Email
* Password
* Mobile Number
* Business Name
* Food Type

Examples

* Vada Pav
* Pani Puri
* Misal Pav
* Dosa
* Sandwich
* Tea Stall

Very Important

Automatically request browser location permission.

After permission is granted

store

* Latitude
* Longitude

inside PostgreSQL.

If location permission is denied

allow manual location selection later.

---

# Login

Simple login using

Email

Password

JWT Token.

---

# Dashboard

After login redirect to dashboard.

Create modern dashboard using shadcn.

Cards

* Nearby Suppliers
* Inventory (Coming Soon)
* AI Recommendation (Coming Soon)
* Today's Ingredient Search

Use placeholder values.

Do not implement ML yet.

---

# Sidebar

Dashboard

Suppliers

Recommendation

Profile

Settings

Logout

Inventory (Coming Soon)

---

# Supplier Page

Create supplier search page.

User can search

Potato

Tomato

Butter

Oil

etc.

For now

retrieve supplier data directly from PostgreSQL.

Do not use ML.

Provide

* Search
* Filter by Area
* Filter by Supplier Type

Display supplier cards.

Each card should contain

Supplier Name

Area

Rating

Price

Delivery Radius

Delivery Time

Button

View Details

---

# Supplier Details Page

Show

Supplier Information

Products

Ratings

Location

Future Map Placeholder

---

# Profile Page

Allow user to update

Business Name

Food Type

Phone Number

Location

Profile Information

---

# Settings

Theme Toggle

Account Settings

Logout

---

# Database

Create proper SQLAlchemy models.

Users

Suppliers

Products

Design database with proper relationships.

The supplier dataset already exists as CSV.

Do not import it yet.

Just prepare models.

---

# Backend APIs

Create REST APIs.

POST

/auth/register

POST

/auth/login

GET

/profile

PUT

/profile

GET

/suppliers

GET

/suppliers/{id}

GET

/products

GET

/ingredients

Do NOT create recommendation endpoint yet.

---

# UI

Modern

Minimal

Professional

Responsive

Dark Mode

Smooth animations

Good typography

Use shadcn components wherever possible.

---

# Code Quality

Follow Clean Architecture.

Separate

* Routes
* Services
* Database
* Schemas
* Models
* Utilities

No business logic inside API routes.

Use dependency injection where appropriate.

Use environment variables.

Implement centralized exception handling.

Implement request validation.

Enable CORS.

Use logging.

---

# Docker

Create

Dockerfile

docker-compose.yml

for

Frontend

Backend

PostgreSQL

Application should start using one command.

---

# README

Generate professional README containing

* Project Overview
* Tech Stack
* Installation
* Folder Structure
* Environment Variables
* Run Instructions

---

# Important

Do NOT implement

* Machine Learning
* Recommendation Engine
* KMeans
* LLM
* Inventory Forecasting

Instead, prepare the application so these modules can be integrated in Phase 2 without changing the architecture.

Build production-quality code, not tutorial code.
