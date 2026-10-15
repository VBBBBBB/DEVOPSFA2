# FA2 — CI/CD, Container Orchestration and Observability

Extends the FA1 two-container app (Nginx **frontend** + Node.js **backend API**) with an automated DevOps pipeline, Kubernetes deployment and Prometheus/Grafana monitoring. The original FA1 (Terraform + Docker, QA/UAT/PROD) documentation is kept in [`docs/README-FA1.md`](docs/README-FA1.md).

```
Developer -> git push -> GitHub Actions
                          ├─ Checkout
                          ├─ Build (npm ci)
                          ├─ Unit tests (Jest)         <- pipeline FAILS here on any failing test
                          ├─ Docker build (backend + frontend, tagged <git-sha> and latest)
                          ├─ Push to GHCR (main branch pushes)
                          └─ Deploy to Kubernetes (kind) -> rollout status -> smoke test -> scale
Kubernetes (ns: fa2)  frontend (2 pods, Service: NodePort 30080) -> backend-api (2 pods, ClusterIP :5000)
Kubernetes (ns: monitoring)  Prometheus --scrapes /metrics--> backend pods --> Grafana dashboard
```

## Repository layout

```
.github/workflows/ci-cd.yml   CI/CD pipeline
docker/backend/               app.js (API + /metrics), server.js, tests/, Dockerfile
docker/frontend/              index.html, nginx.conf, Dockerfile
k8s/                          namespace.yaml, backend.yaml, frontend.yaml (Deployments + Services)
monitoring/                   prometheus.yaml, grafana.yaml (datasource + dashboard auto-provisioned)
terraform/                    FA1 infrastructure (unchanged)
```

## 1. Git and the pipeline

* Repo: GitHub; every push/PR to `main` triggers `.github/workflows/ci-cd.yml` automatically.
* **build-test**: checkout -> Node 18 -> `npm ci` (build) -> `npm test` (5 Jest/Supertest tests: health, status, root, 404, `/metrics`). A failing test or failed install stops the pipeline, so no image is built or deployed.
* **docker**: builds both images, tags them `ghcr.io/<owner>/fa2-backend|fa2-frontend:<7-char git sha>` and `:latest`, pushes to GitHub Container Registry on pushes to `main`.
* **deploy**: starts a throw-away `kind` Kubernetes cluster on the runner, loads the freshly built images, applies `k8s/`, waits for `rollout status`, smoke-tests frontend -> backend through the Services, checks `/metrics`, and scales the backend to 3 replicas.

Run the tests locally:

```
cd docker/backend
npm ci
npm test
```

**Demonstrate "pipeline fails on test failure":** change an expected value in `docker/backend/tests/api.test.js`, push, and show the red run in the Actions tab; revert and push to see it go green.

## 2. Kubernetes deployment (local cluster: Docker Desktop, minikube or kind)

The manifests reference `ghcr.io/vbbbbbb/fa2-*:latest` with `imagePullPolicy: IfNotPresent`. Either pull the images pushed by CI (make the GHCR packages public) **or** build locally:

```
docker build -t ghcr.io/vbbbbbb/fa2-backend:latest  docker/backend
docker build -t ghcr.io/vbbbbbb/fa2-frontend:latest docker/frontend
# minikube only:  minikube image load ghcr.io/vbbbbbb/fa2-backend:latest ; minikube image load ghcr.io/vbbbbbb/fa2-frontend:latest
# kind only:      kind load docker-image ghcr.io/vbbbbbb/fa2-backend:latest ; kind load docker-image ghcr.io/vbbbbbb/fa2-frontend:latest
```

Deploy and verify:

```
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl -n fa2 get deployments,pods,svc
kubectl -n fa2 rollout status deployment/backend
kubectl -n fa2 port-forward svc/frontend 8080:80      # open http://localhost:8080
```

* `backend.yaml`: Deployment (2 replicas, rolling update, readiness/liveness probes on `/api/health`, resource requests/limits) + ClusterIP Service named **`backend-api`** (the name `nginx.conf` already proxies to, so the FA1 frontend works unchanged).
* `frontend.yaml`: Deployment (2 replicas, probes) + NodePort Service (30080).

Scaling / rollout demo:

```
kubectl -n fa2 scale deployment/backend --replicas=4
kubectl -n fa2 get pods -w
kubectl -n fa2 set image deployment/backend backend=ghcr.io/vbbbbbb/fa2-backend:<sha>   # rolling update
kubectl -n fa2 rollout status deployment/backend
kubectl -n fa2 rollout undo deployment/backend                                          # rollback
```

## 3. Monitoring (Prometheus + Grafana)

The backend exposes `/metrics` (via `prom-client`): request counter `http_requests_total`, latency histogram `http_request_duration_seconds`, plus default process metrics (CPU, memory, event loop). Backend pods carry `prometheus.io/*` annotations, and Prometheus discovers them with Kubernetes pod service discovery (RBAC in `monitoring/prometheus.yaml`).

```
kubectl apply -f monitoring/prometheus.yaml
kubectl apply -f monitoring/grafana.yaml
kubectl -n monitoring get pods
kubectl -n monitoring port-forward svc/prometheus 9090:9090   # Status -> Targets: both backend pods UP
kubectl -n monitoring port-forward svc/grafana 3000:3000      # http://localhost:3000  (admin / admin)
```

Grafana auto-loads the Prometheus datasource and the **FA2 / FA2 Backend Overview** dashboard:

| Panel | PromQL | Metric type |
| --- | --- | --- |
| Availability (pods up) | `sum(up{job="fa2-backend"})` | availability |
| Total requests served | `sum(http_requests_total)` | request count |
| Request rate by route | `sum by (route) (rate(http_requests_total[1m]))` | request rate |
| CPU usage per pod | `rate(process_cpu_seconds_total[1m])` | CPU |
| Memory per pod | `process_resident_memory_bytes` | memory |
| p95 latency | `histogram_quantile(0.95, ...)` | latency |

Generate traffic so the graphs move:

```
kubectl -n fa2 run load --rm -i --restart=Never --image=busybox -- sh -c "while true; do wget -q -O- http://frontend/api/status >/dev/null; done"
```

## Screenshots for the demo / submission

1. GitHub repo + commit history; Actions run (green) with all three jobs; one red run from a deliberately failing test
2. GHCR package showing the `<sha>` and `latest` tags
3. `kubectl get deployments,pods,svc -n fa2`, `rollout status`, and the scale-up output
4. App in browser via port-forward
5. Prometheus Status -> Targets (UP)
6. Grafana dashboard with live data under load
