# Cognivia

## Overview

Cognivia is a university microservices project focused on supporting Alzheimer’s patients and the people around them (caregivers, doctors, pharmacy). It provides authentication via Keycloak, service discovery via Eureka, and an API Gateway that fronts multiple Spring Boot services. The user interface is an Angular web app with i18n supportt.

## Features

- Authentication & authorization with Keycloak (realm: `pidev`) and role-based access (Admin/Doctor/Caregiver/Patient/Pharmacy).
- Spring Cloud Netflix Eureka service discovery and registration.
- Spring Cloud Gateway as a single entry point for backend APIs.
- Domain microservices:
  - Care: patients, doctors, caregivers, schedules, tasks, check-ins, location, prescriptions.
  - Appointments: appointment scheduling/management service.
  - Forum: posts, comments, reactions.
  - Pharmacy: stock & prescription management; pharmacist profile integration.
  - Chat/Notifications (dpchat): messaging between roles (e.g., doctor ↔ pharmacy).
  - Monitoring: tests/reports/journal (behavioral monitoring).
  - Games: cognitive tests/games.
  - Surveillance & Equipment: equipment-related functionality.
- Frontend integrations:
  - Keycloak login.
  - Maps/location features (Leaflet).
  - Rich editors (Quill / image editing).
  - Multi-language UI via JSON translations.
- Optional AI integrations (depending on configured keys):
  - DeepSeek (backend) and Gemini (frontend service scaffolding).

## Tech Stack

### Frontend

- Angular 21 (Angular CLI 21.1.x)
- Angular Material, NG-Zorro
- keycloak-js + keycloak-angular
- TailwindCSS (PostCSS pipeline)
- ngx-translate (i18n)

### Backend

- Java 21
- Spring Boot + Spring Cloud
  - Eureka Server (service registry)
  - Spring Cloud Gateway
  - Eureka Clients (microservices)
- Spring Security (resource server / JWT)
- JPA/Hibernate
- PostgreSQL (the configuration suggests a hosted Postgres like Neon)
- Keycloak (Docker) for IAM

## Architecture

High-level flow:

- Angular frontend runs on `http://localhost:4200`.
- Users authenticate against Keycloak (dev port `8180`, realm `pidev`).
- The frontend calls backend APIs through the Gateway at `http://localhost:8080`.
- The Gateway uses Eureka (`http://localhost:8761`) to discover microservices.

Key local ports (as configured in service `application.properties`):

- Eureka: `8761`
- Gateway: `8080`
- Keycloak (dev): `8180`
- Care: `8081`
- Monitoring: `8082`
- SurveillanceAndEquipment: `8083`
- Appointments: `8085`
- DPCHAT: `8086`
- Games: `8087`
- Forum: `8089`
- Pharmacy: `8091`

## Contributors

Module ownership list (from the academic module breakdown):

- Yahya: Forum (posts/comments/reactions), Doctor–Pharmacy chat
- Mahdi: Pharmacy stock management, Prescription management
- Jesus: Caregiver schedule management, Visit reports / AI report
- Mlaouhia: Patient status management (check-ins / location)
- Jappa: Patient tasks & medication intake, task escalation/overdue
- Souhaib: Tests/games, AI behavioral monitoring & risk scoring

## Academic Context

Developed at Esprit School of Engineering, showcasing a microservices architecture (discovery + gateway) with a modern SPA frontend and enterprise authentication.

The functional focus of the project is Alzheimer care: daily follow-up (tasks/medication), caregiver coordination, and cognitive monitoring (tests/games, monitoring/reporting).

## Getting Started

### Prerequisites

- Windows (recommended if using the provided multi-tab launcher)
- Java 21
- Maven (or use the included Maven wrappers `mvnw` / `mvnw.cmd` inside each backend module)
- Node.js + npm (the frontend uses npm scripts)
- Docker (for Keycloak)
- Windows Terminal (`wt.exe`) if you want to use the one-command multi-tab launcher

### 1) Configure environment variables

Backend services read these environment variables (see [BackEnd/env variables.txt](BackEnd/env%20variables.txt)):

- `PIDEV26_DB_URL`
- `PIDEV26_DB_USERNAME`
- `PIDEV26_DB_PASSWORD`
- `PIDEV26_KEYCLOAK_CLIENT_SECRET`
- `IMGBB_API_KEY` (optional; used by pharmacy)
- `DEEPSEEK_API_KEY` (optional; used by pharmacy)

Keycloak Docker Compose also needs Postgres connection variables (example in [BackEnd/docker/keycloak/.env.example](BackEnd/docker/keycloak/.env.example)):

- `KC_DB_URL`
- `KC_DB_USERNAME`
- `KC_DB_PASSWORD`

### 2) Start Keycloak

From [BackEnd/docker/keycloak/docker-compose.yml](BackEnd/docker/keycloak/docker-compose.yml):

- Create [BackEnd/docker/keycloak/.env](BackEnd/docker/keycloak/.env) from the provided example and fill in your Postgres connection.
- Run:
  - `docker compose up -d`

This starts Keycloak on `http://localhost:8180` and imports the realm from `realm-export.json`.

Dev credentials (from the imported realm/export):

- Keycloak admin console: `admin` / `admin` (set in docker-compose)
- Realm user: `admin` / `admin123`

Change these before deploying anywhere beyond local development.

### 3) Start backend services

Option A — start everything in one Windows Terminal window (recommended):

- Run [start-all.bat](start-all.bat)

This opens tabs and runs `mvn -q spring-boot:run` for:

- Eureka, Gateway, and all microservices

Option B — start manually (from each module folder):

- `mvn spring-boot:run`

Suggested order:

1. Eureka
2. Gateway
3. Microservices

### 4) Start the frontend

From [FrontEnd/pidev-26/package.json](FrontEnd/pidev-26/package.json):

- `npm install`
- `npm start`

The `start` script runs Angular with the proxy configuration so calls to the gateway on `8080` don’t require CORS setup.

## Acknowledgments

- Angular + Angular CLI
- Spring Boot, Spring Cloud (Gateway, Eureka)
- Keycloak (OpenID Connect)
- NG-Zorro, Angular Material
- Leaflet (maps)
