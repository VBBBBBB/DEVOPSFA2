# FA1 — Git-Based Infrastructure as Code and Multi-Environment Container Deployment

![DevOps](https://img.shields.io/badge/DevOps-FA1-blue?style=for-the-badge)
![Terraform](https://img.shields.io/badge/Terraform-1.15+-623CE4?style=for-the-badge&logo=terraform&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/Git-Branching-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## 📋 Project Overview

This repository demonstrates **Infrastructure as Code (IaC)** principles using **Terraform** to provision and manage a multi-container microservice application (**Frontend** + **Backend**) across multiple isolated environments:
- 🧪 **QA (Quality Assurance)**
- 🔬 **UAT (User Acceptance Testing)**
- 🚀 **PROD (Production)**

### ✨ Key Design Philosophy: Single Reusable Codebase
Rather than duplicating Terraform files for each environment, a **single unified configuration** (`main.tf`, `variables.tf`, `outputs.tf`) is driven dynamically by environment definition files (`environments/qa.tfvars`, `environments/uat.tfvars`, `environments/prod.tfvars`).

---

## 🏗️ Architecture & Component Topology

```
+-------------------------------------------------------------------------+
| Host Machine (localhost)                                                |
|                                                                         |
|  [Port 8081 (QA) / 8082 (UAT) / 8080 (PROD)]                             |
|                           │                                             |
|                           ▼                                             |
|   +─────────────────────────────────────────────────────────────────+   |
|   | Container 1: Frontend (Nginx Alpine)                           |   |
|   | - Dynamic dark-mode dashboard with live health diagnostics       |   |
|   | - Internal Reverse Proxy (/api/ -> http://backend-api:5000/api/) |   |
|   +───────────────────────────────┬─────────────────────────────────+   |
|                                   │                                     |
|           Isolated Docker Network: app_network_${env}                   |
|                                   │                                     |
|                                   ▼                                     |
|   +─────────────────────────────────────────────────────────────────+   |
|   | Container 2: Backend (Node.js Alpine)                           |   |
|   | - REST API service with /api/health and /api/status             |   |
|   | - Alias: backend-api:5000                                       |   |
|   +─────────────────────────────────────────────────────────────────+   |
|                           ▲                                             |
|                           │                                             |
|  [Port 5001 (QA) / 5002 (UAT) / 5000 (PROD)] (Direct Host Port)         |
+-------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
.
├── .gitignore                      # Excludes tfstate, .terraform, secrets
├── README.md                       # Comprehensive project documentation
├── docker/
│   ├── backend/
│   │   ├── Dockerfile              # Lightweight Node.js 18 Alpine runtime
│   │   ├── package.json            # Dependencies (express, cors)
│   │   └── server.js               # REST API endpoints (/api/health, /api/status)
│   └── frontend/
│       ├── Dockerfile              # Nginx 1.25 Alpine base
│       ├── index.html              # Glassmorphic environment dashboard
│       └── nginx.conf              # Reverse proxy routing to backend-api
└── terraform/
    ├── terraform.tf                # Provider specification (kreuzwerker/docker)
    ├── variables.tf                # Declarative variable definitions & types
    ├── main.tf                     # Reusable network, image, and container logic
    ├── outputs.tf                  # Exported URLs and container metadata
    └── environments/
        ├── qa.tfvars               # QA environment configuration
        ├── uat.tfvars              # UAT environment configuration
        └── prod.tfvars             # PROD environment configuration
```

---

## ⚙️ Environment Configuration Matrix

| Parameter | QA (`qa.tfvars`) | UAT (`uat.tfvars`) | PROD (`prod.tfvars`) |
| :--- | :--- | :--- | :--- |
| **`environment_name`** | `qa` | `uat` | `prod` |
| **Frontend External Port** | `8081` | `8082` | `8080` |
| **Backend External Port** | `5001` | `5002` | `5000` |
| **Logging Level** | `debug` | `info` | `warn` |
| **Docker Network** | `app_network_qa` | `app_network_uat` | `app_network_prod` |
| **Frontend URL** | `http://localhost:8081` | `http://localhost:8082` | `http://localhost:8080` |
| **Backend API URL** | `http://localhost:5001/api/status` | `http://localhost:5002/api/status` | `http://localhost:5000/api/status` |

---

## 🚀 Step-by-Step Execution Guide

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Terraform CLI](https://developer.hashicorp.com/terraform/install) (v1.3+).
- [Git](https://git-scm.com/).

### 2. Git Setup & Remote Repository
```bash
# Verify local branches
git branch -v

# Link to your GitHub remote repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
git push origin feature/terraform-multi-env
git push origin feature/docker-microservices
```

### 3. Initialize & Validate Terraform
```bash
cd terraform

# Format and check syntax
terraform fmt

# Initialize plugins (downloads kreuzwerker/docker)
terraform init

# Validate configuration semantics
terraform validate
```

---

## 🌐 Deploying Multi-Environment Infrastructure

### A. Deploy QA Environment
```bash
# 1. Preview changes
terraform plan -var-file="environments/qa.tfvars"

# 2. Deploy infrastructure
terraform apply -var-file="environments/qa.tfvars" -auto-approve

# 3. Test QA deployment
curl http://localhost:8081
curl http://localhost:5001/api/status
```

### B. Deploy UAT Environment
```bash
# 1. Preview changes
terraform plan -var-file="environments/uat.tfvars"

# 2. Deploy infrastructure
terraform apply -var-file="environments/uat.tfvars" -auto-approve

# 3. Test UAT deployment
curl http://localhost:8082
curl http://localhost:5002/api/status
```

### C. Deploy PROD Environment
```bash
# 1. Preview changes
terraform plan -var-file="environments/prod.tfvars"

# 2. Deploy infrastructure
terraform apply -var-file="environments/prod.tfvars" -auto-approve

# 3. Test PROD deployment
curl http://localhost:8080
curl http://localhost:5000/api/status
```

### D. Teardown / Cleanup
To destroy any environment cleanly without affecting others:
```bash
terraform destroy -var-file="environments/qa.tfvars" -auto-approve
# or
terraform destroy -var-file="environments/uat.tfvars" -auto-approve
# or
terraform destroy -var-file="environments/prod.tfvars" -auto-approve
```

---

## 📸 Screenshots Required for Submission

Take screenshots of the following for your submission document:
1. **Git Initialization & Commits**: Terminal showing `git log --oneline` and `git branch -a`.
2. **Terraform Validation**: Terminal showing `terraform init` and `terraform validate` (Success output).
3. **Terraform Plan & Apply**: Terminal output of `terraform apply -var-file="environments/qa.tfvars"`.
4. **Running Docker Containers**: Terminal showing `docker ps` displaying both `fa1-frontend-qa` and `fa1-backend-qa`.
5. **Frontend Web Dashboard**: Browser showing `http://localhost:8081` with the QA badge and successful backend connection response.
6. **Backend Direct API Response**: Browser or Postman showing `http://localhost:5001/api/status`.

---

## 🎤 5-Minute Viva & Presentation Talking Points

1. **What is Infrastructure as Code (IaC)?**
   - IaC allows provisioning and managing computational resources (networks, servers, containers) using machine-readable definition files rather than manual interactive configuration.
2. **How does this implementation achieve multi-environment without duplicate code?**
   - We separate **logic** (`main.tf`) from **configuration** (`.tfvars`). By passing `-var-file="environments/<env>.tfvars"`, Terraform dynamically injects environment-specific ports, names, network IDs, and environment variables.
3. **How do the two containers communicate?**
   - They reside on a dedicated user-defined Docker bridge network (`app_network_${env}`). The frontend Nginx container communicates with the backend container via Docker's embedded DNS using the container alias `backend-api:5000`.
4. **Why use .gitignore with Terraform?**
   - `.tfstate` files can contain sensitive configuration data and resource IDs. They should be stored in a secure remote backend (e.g. Terraform Cloud or AWS S3), never committed to public Git repositories.
