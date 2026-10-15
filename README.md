# FA2 — CI/CD with Jenkins, Container Orchestration and Observability

<<<<<<< HEAD
An end-to-end DevOps project extending the FA1 application with automated testing, Docker image publishing, Kubernetes deployment, and application monitoring using Prometheus and Grafana.

## Overview

FA2 extends the original two-container application consisting of an Nginx frontend and a Node.js backend API. It introduces an automated CI/CD pipeline that builds and tests the application, creates container images, publishes them to GitHub Container Registry (GHCR), and validates deployment in a temporary Kubernetes cluster.

Prometheus collects application and container-process metrics from the backend pods, while Grafana visualizes availability, request traffic, CPU usage, memory consumption, and request latency.

### Key Features

- Automated CI/CD using GitHub Actions
- Automated backend unit and API testing with Jest and Supertest
- Docker image build and publishing to GHCR
- Kubernetes Deployments and Services
- Automated rollout verification and deployment smoke tests
- Horizontal scaling and rolling-update support
- Prometheus metrics collection and Grafana dashboards
- Automated pipeline failure when tests fail

## Architecture

```text
Developer
   |
   | Git push / Pull request
   v
GitHub Actions
   |
   +--> Checkout source code
   |
   +--> Install dependencies and run tests
   |
   +--> Build backend and frontend images
   |
   +--> Publish images to GHCR (main branch pushes)
   |
   +--> Deploy to temporary Kubernetes (kind) cluster
   |       |
   |       +--> Apply Kubernetes manifests
   |       +--> Verify deployment rollouts
   |       +--> Run application smoke tests
   |       +--> Scale backend replicas
   |
   v
Kubernetes application namespace: fa2
   |
   +--> Frontend: Nginx (2 replicas)
   |       |
   |       +--> NodePort Service: 30080
   |       |
   |       +--> /api requests
   |                |
   |                v
   +--> Backend API: Node.js / Express
           |
           +--> ClusterIP Service: backend-api:5000
           |
           +--> /api/health
           +--> /api/status
           +--> /metrics

Monitoring namespace
   |
   +--> Prometheus --> Scrapes backend pod metrics
   |
   +--> Grafana --> Visualizes Prometheus data
```

The CI/CD workflow deploys to an ephemeral Kubernetes cluster created on the GitHub Actions runner. The local Kubernetes environment is managed separately for interactive demonstrations and monitoring.

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Version control | Git and GitHub | Source code and change tracking |
| CI/CD | GitHub Actions | Automated build, test and deployment workflow |
| Backend | Node.js and Express | REST API and application metrics |
| Frontend | HTML, Nginx | Web interface and API reverse proxy |
| Testing | Jest and Supertest | Automated API tests |
| Containerization | Docker | Reproducible application images |
| Image registry | GitHub Container Registry | Container image storage |
| Orchestration | Kubernetes with kind | Deployment, service discovery and scaling |
| Metrics | Prometheus | Metrics collection and querying |
| Dashboards | Grafana | Monitoring visualization |

## Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker/
│   ├── backend/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── tests/
│   │   │   └── api.test.js
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── package-lock.json
│   └── frontend/
│       ├── index.html
│       ├── nginx.conf
│       └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── backend.yaml
│   └── frontend.yaml
├── monitoring/
│   ├── prometheus.yaml
│   └── grafana.yaml
├── docs/
│   └── README-FA1.md
=======
An end-to-end DevOps project extending the FA1 application (Nginx frontend + Node.js/Express backend) with a **Jenkins** CI/CD pipeline, Docker image publishing, **Kubernetes** deployment, and monitoring with **Prometheus** and **Grafana**.

## Overview

A `git push` to `main` is detected by Jenkins, which runs a pipeline defined as code in the `Jenkinsfile`: it checks out the repository, builds and unit-tests the backend, scans dependencies, builds Docker images, pushes them to GitHub Container Registry (GHCR), deploys them to the local Kubernetes cluster with a rolling update, runs smoke tests and scales the backend.

Prometheus scrapes metrics from the backend pods and Grafana visualises availability, request count, request rate, CPU, memory and p95 latency.

### Key features

- Jenkins declarative pipeline (Pipeline as Code, `Jenkinsfile`)
- Automatic trigger on new Git commits (SCM polling)
- Backend unit/API tests with Jest and Supertest; pipeline fails if a test fails
- Dependency security scan (`npm audit`) as a DevSecOps stage
- Docker images tagged `<build-number>-<git-sha>` and `latest`
- Kubernetes Deployments, Services, probes, resource limits, rolling updates, rollback
- Prometheus metrics collection and a provisioned Grafana dashboard

## Architecture

```
Developer --git push--> GitHub (main)
                           |
                 Jenkins (polls SCM every ~2 min)
                           |
   Checkout -> Build -> Unit Test -> Security Scan -> Docker Build
        -> Push to GHCR -> Deploy to Kubernetes -> Smoke Test -> Scale
                           |
Kubernetes namespace: fa2
   Frontend (Nginx, 2 replicas) - NodePort 30080
        | /api requests
        v
   Backend (Node.js/Express) - ClusterIP service backend-api:5000
        /api/health   /api/status   /metrics

Kubernetes namespace: monitoring
   Prometheus --> scrapes backend pods (pod service discovery)
   Grafana    --> dashboard "FA2 Backend Overview"
```

## Technology stack

| Component | Technology | Purpose |
|---|---|---|
| Version control | Git, GitHub | Source code and change tracking |
| CI/CD | Jenkins (Pipeline as Code) | Build, test, scan, image build, deploy |
| Backend | Node.js, Express | REST API and metrics |
| Frontend | HTML, Nginx | Web page and API reverse proxy |
| Testing | Jest, Supertest | Automated API tests |
| Containers | Docker | Reproducible images |
| Registry | GitHub Container Registry | Image storage |
| Orchestration | Kubernetes | Deployment, service discovery, scaling |
| Metrics / dashboards | Prometheus, Grafana | Monitoring |

## Repository structure

```
.
├── Jenkinsfile                  # CI/CD pipeline
├── docker/
│   ├── backend/  (app.js, server.js, tests/api.test.js, Dockerfile, package*.json)
│   └── frontend/ (index.html, nginx.conf, Dockerfile)
├── k8s/         (namespace.yaml, backend.yaml, frontend.yaml)
├── monitoring/  (prometheus.yaml, grafana.yaml)
├── docs/README-FA1.md
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)
├── .gitignore
└── README.md
```

<<<<<<< HEAD
## CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci-cd.yml`. It runs automatically for pushes and pull requests targeting `main`.

### 1. Build and Test
=======
## CI/CD pipeline (Jenkins)

Defined in `Jenkinsfile`. Stages run in order; a failure stops all later stages.

| # | Stage | What it does |
|---|---|---|
| 1 | Checkout | Pulls the repository and computes the image tag `<build>-<short-sha>` |
| 2 | Build | `npm ci` installs the exact locked dependencies |
| 3 | Unit Test | `npm test` (Jest). Pipeline fails here if any test fails |
| 4 | Security Scan (DevSecOps) | `npm audit`; marks the stage unstable instead of failing |
| 5 | Docker Build | Builds backend and frontend images with two tags each |
| 6 | Push Images to GHCR | Optional (`PUSH_TO_GHCR` parameter), uses Jenkins credentials `ghcr-creds` |
| 7 | Load Images into kind | Only if the `KIND_CLUSTER` parameter is set |
| 8 | Deploy to Kubernetes | Applies manifests with this build's image tag, waits for rollout (rolling update) |
| 9 | Smoke Test | In-cluster requests: `/api/health`, `/api/status`, `/metrics` |
| 10 | Scale | Scales the backend to `BACKEND_REPLICAS`, prints rollout history |

**Trigger:** `pollSCM('H/2 * * * *')`. Jenkins checks GitHub every ~2 minutes and starts a build when it finds a new commit.

### Jenkins setup (Windows)

1. Install JDK 17 or 21. Download `jenkins.war` from https://get.jenkins.io/war-stable/latest/jenkins.war
2. Run `java -jar jenkins.war --httpPort=8081`, open http://localhost:8081, enter the initial admin password and install the suggested plugins.
3. Add credentials: **Manage Jenkins → Credentials → Global → Add** — kind *Username with password*, ID `ghcr-creds`, username = GitHub user, password = a GitHub personal access token with `write:packages`.
4. Create a job: **New Item → Pipeline** (`FA2-Pipeline`). Definition *Pipeline script from SCM*, SCM *Git*, repository `https://github.com/VBBBBBB/DEVOPSFA2.git`, branch `*/main`, script path `Jenkinsfile`.
5. Click **Build Now**. Later runs start automatically after a push.

Jenkins runs on the same machine as Docker Desktop and the local Kubernetes cluster, so the pipeline deploys directly to that cluster.

## Local development and testing
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

The workflow checks out the repository, configures Node.js, installs dependencies using `npm ci`, and executes the backend test suite using `npm test`.

The tests cover:

- API health endpoint
- API status endpoint
- Root endpoint
- Unknown-route handling
- Prometheus metrics endpoint

If dependency installation or automated tests fail, the dependent Docker build and deployment jobs do not run.

### 2. Docker Build and Image Publishing

The pipeline builds separate images for the backend and frontend. Images are tagged with the short Git commit SHA and `latest`.

```text
ghcr.io/<owner>/fa2-backend:<git-sha>
ghcr.io/<owner>/fa2-backend:latest

ghcr.io/<owner>/fa2-frontend:<git-sha>
ghcr.io/<owner>/fa2-frontend:latest
```

Images are published to GitHub Container Registry on pushes to `main`. Pull requests run the earlier validation stages without publishing images.

### 3. Kubernetes Deployment and Smoke Testing

The deployment job creates a temporary kind cluster, loads the images built by the pipeline, applies the Kubernetes manifests, and checks rollout status.

It then performs smoke tests against the application endpoints, verifies the backend metrics endpoint, and scales the backend deployment to three replicas.

This validates the application deployment within the CI/CD runner. It does not automatically update the separate local Kubernetes cluster.

## Local Development and Testing

### Prerequisites

Install the following tools:

- Git
- Node.js and npm
- Docker Desktop
- kubectl
- kind, if using kind for the local Kubernetes cluster

### Run Backend Tests

From the repository root:

```powershell
cd docker/backend
npm ci
npm test
```

<<<<<<< HEAD
### Build Container Images

Return to the repository root before running these commands:

```powershell
=======
Build images manually:

```
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)
docker build -t ghcr.io/vbbbbbb/fa2-backend:latest docker/backend
docker build -t ghcr.io/vbbbbbb/fa2-frontend:latest docker/frontend
```

<<<<<<< HEAD
If using kind, load the locally built images into the cluster:
=======
## Kubernetes deployment
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

```powershell
kind load docker-image ghcr.io/vbbbbbb/fa2-backend:latest
kind load docker-image ghcr.io/vbbbbbb/fa2-frontend:latest
```

These image-loading commands assume the kind cluster already exists and uses the expected image names.

## Kubernetes Deployment

Apply the manifests from the repository root:

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
<<<<<<< HEAD
```

Verify deployments, pods and services:

```powershell
kubectl -n fa2 get deployments,pods,services
kubectl -n fa2 rollout status deployment/backend
kubectl -n fa2 rollout status deployment/frontend
```

### Access the Application

Forward the frontend Service to the local machine:
=======

kubectl -n fa2 get deployments,pods,services
kubectl -n fa2 rollout status deployment/backend
kubectl -n fa2 rollout status deployment/frontend
kubectl -n fa2 port-forward svc/frontend 8080:80     # open http://localhost:8080
```

| Resource | Details |
|---|---|
| Deployment `backend` | 2 replicas, RollingUpdate (maxUnavailable 0, maxSurge 1), readiness/liveness probes on `/api/health`, CPU/memory requests and limits |
| Service `backend-api` | ClusterIP, port 5000 |
| Deployment `frontend` | 2 replicas, probes on `/` |
| Service `frontend` | NodePort 30080 |

### Scaling, rollout and rollback
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

```powershell
kubectl -n fa2 port-forward svc/frontend 8080:80
```

Open `http://localhost:8080` in a browser. Keep the terminal running while using the forwarded connection.

### Scaling and Rollout Management

Scale the backend deployment to four replicas:

```powershell
kubectl -n fa2 scale deployment/backend --replicas=4
kubectl -n fa2 rollout status deployment/backend
<<<<<<< HEAD
kubectl -n fa2 get deployment backend
kubectl -n fa2 get pods
```

Inspect rollout history:
=======
kubectl -n fa2 rollout history deployment/backend
kubectl -n fa2 rollout undo deployment/backend
```

## Monitoring and observability

The backend exposes `/metrics` via `prom-client`: default process metrics (CPU, memory, event loop), `http_requests_total` and `http_request_duration_seconds`. Prometheus finds backend pods through Kubernetes pod discovery using the `prometheus.io/scrape` annotations.
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

```powershell
kubectl -n fa2 rollout history deployment/backend
```

To roll back the latest rollout:

```powershell
kubectl -n fa2 rollout undo deployment/backend
kubectl -n fa2 rollout status deployment/backend
```

The local demonstration uses four backend replicas when scaled as shown above. The GitHub Actions workflow separately scales its temporary deployment to three replicas.

## Monitoring and Observability

The backend exposes a `/metrics` endpoint using `prom-client`. Prometheus discovers backend pods through Kubernetes pod service discovery and scrapes their metrics.

### Deploy Monitoring Components

From the repository root:

```powershell
kubectl apply -f monitoring/prometheus.yaml
kubectl apply -f monitoring/grafana.yaml
kubectl -n monitoring get pods,services
<<<<<<< HEAD
```

Verify that the monitoring pods are running before opening the interfaces.

### Access Prometheus
=======
kubectl -n monitoring port-forward svc/prometheus 9090:9090   # http://localhost:9090/targets
kubectl -n monitoring port-forward svc/grafana 3000:3000      # http://localhost:3000  (admin / admin)
```

The Grafana dashboard **FA2 Backend Overview** shows:

| Panel | Query |
|---|---|
| Application availability | `sum(up{job="fa2-backend"})` |
| Total requests served | `sum(http_requests_total)` |
| Request rate by route | `sum by (route) (rate(http_requests_total[1m]))` |
| CPU usage per pod | `rate(process_cpu_seconds_total{job="fa2-backend"}[1m])` |
| Memory usage per pod | `process_resident_memory_bytes{job="fa2-backend"}` |
| p95 request latency | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[1m])))` |

### Logs and SRE indicators

- **Logs:** the backend writes one line per request; view them with `kubectl -n fa2 logs -l app=backend --tail=50`.
- **SLI (availability):** `sum(rate(http_requests_total{status_code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- **SLO examples:** 99% of requests succeed; p95 latency stays below 250 ms.
- Distributed tracing and a centralized ELK stack are not implemented in this project.

### Generate test traffic
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

```powershell
kubectl -n monitoring port-forward svc/prometheus 9090:9090
```

Open `http://localhost:9090/targets` and verify that the `fa2-backend` targets are **UP**.

### Access Grafana

In another terminal:

```powershell
kubectl -n monitoring port-forward svc/grafana 3000:3000
```

Open `http://localhost:3000`. The initial credentials configured by the provided manifest are `admin` / `admin`, unless the password has been changed. Change the initial password before using the configuration beyond a local demonstration.

The provisioned dashboard is named **FA2 Backend Overview**.

### Dashboard Metrics

| Metric | Purpose |
|---|---|
| Application availability | Number of backend targets reporting as up |
| Total requests served | Cumulative HTTP request count |
| Request rate by route | HTTP traffic over time, grouped by route |
| CPU usage per pod | Backend process CPU consumption |
| Memory usage per pod | Backend process resident memory |
| p95 request latency | 95th-percentile request duration |

Prometheus queries power the dashboard panels, allowing application traffic and resource usage to be inspected over time.

### Generate Test Traffic

To generate requests against the application and observe changes in the dashboard, run:

```powershell
kubectl -n fa2 run load --rm -i --restart=Never --image=busybox -- sh -c "while true; do wget -q -O- http://frontend/api/status >/dev/null; done"
```

<<<<<<< HEAD
Stop the command with `Ctrl+C` when sufficient traffic has been generated. The temporary load pod is configured for removal when the command exits normally.

## Testing and Failure Handling

Automated testing is a required stage of the CI/CD pipeline. A failing test prevents downstream jobs from executing, demonstrating a quality gate before image publication and deployment.

To verify this behavior safely:

1. Make a temporary change to an expected value in `docker/backend/tests/api.test.js`.
2. Push the change on a separate demonstration branch and open a pull request targeting `main`.
3. Confirm that the test job fails and dependent jobs are skipped.
4. Revert the test-only change and close the demonstration pull request.

Do not merge deliberately failing test changes into `main`.
=======
Stop with `Ctrl+C`.

## Testing and failure handling

A failing test stops the Jenkins pipeline at the **Unit Test** stage, so no image is built, pushed or deployed. To demonstrate: change an expected value in `docker/backend/tests/api.test.js`, push, observe the red stage and skipped later stages in Jenkins, then revert the change and push again.
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

## Troubleshooting

| Problem | Checks |
|---|---|
<<<<<<< HEAD
| Backend pod is not ready | `kubectl -n fa2 describe pod <pod-name>` |
| Deployment rollout fails | `kubectl -n fa2 rollout status deployment/backend` |
| Application is unreachable | Check the frontend Service and port-forward terminal |
| Prometheus target is down | Check backend pod readiness, `/metrics`, and Prometheus configuration |
| Grafana dashboard has no data | Check the Prometheus data source and dashboard time range |
| Local image is unavailable in kind | Rebuild the image and load it into the correct kind cluster |
| GitHub Actions fails | Inspect the first failed job and its logs |


## Summary

This project demonstrates an integrated DevOps workflow covering source control, automated testing, container image creation, registry publishing, Kubernetes deployment, rollout verification, scaling and application monitoring. It combines CI/CD validation with a separately managed local Kubernetes environment for operational inspection.
=======
| Jenkins build not starting after a push | Wait ~2 minutes (polling); check the job's *Polling Log* |
| `docker` / `kubectl` not found in a stage | Start Jenkins from a PowerShell window where both commands work |
| Image push fails | Check the `ghcr-creds` credentials and token scope `write:packages` |
| Backend pod not ready | `kubectl -n fa2 describe pod <pod-name>` |
| Rollout fails or pod shows `ImagePullBackOff` | Check the image tag exists in GHCR, or set `KIND_CLUSTER` for a kind cluster |
| Prometheus target down | Check pod readiness, `/metrics`, Prometheus configuration |
| Grafana has no data | Check the Prometheus data source and the dashboard time range |

## Summary

The project covers source control, a Jenkins Pipeline-as-Code workflow (build, test, security scan, Docker image build, deploy), container publishing, Kubernetes deployment with scaling and rollback, and Prometheus/Grafana monitoring.
>>>>>>> 141e49d (Migrate CI/CD from GitHub Actions to Jenkins)

