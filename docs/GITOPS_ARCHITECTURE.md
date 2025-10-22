# GitOps Architecture - Detailed Technical Documentation

**System**: borg.tools Production Infrastructure
**Author**: Wojciech Wiesner
**Architecture**: GitOps with ArgoCD + Kubernetes

---

## Table of Contents

1. [GitOps Principles Implementation](#gitops-principles-implementation)
2. [Repository Structure](#repository-structure)
3. [ArgoCD Configuration](#argocd-configuration)
4. [Deployment Workflows](#deployment-workflows)
5. [Kustomize Strategy](#kustomize-strategy)
6. [Security & Access Control](#security--access-control)
7. [Disaster Recovery](#disaster-recovery)

---

## GitOps Principles Implementation

### Core GitOps Principles

This infrastructure implements all 4 core GitOps principles:

#### 1. Declarative Configuration
✅ **Implemented**: All infrastructure defined in YAML manifests stored in Git

```yaml
# Example: gitops/base/wordpress-stack.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - name: wordpress
        image: wordpress:6.0-apache
```

#### 2. Version Control as Single Source of Truth
✅ **Implemented**: Git repository contains all configuration, history, and rollback capability

- **Repository**: Internal Git daemon at `git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git`
- **Storage**: `/home/vizi/gitops/` on borg.tools server
- **Commits**: Full audit trail of all infrastructure changes
- **Branches**: Main branch as production state

**Example Git History**:
```bash
$ git log --oneline
8a3f912 Configure plugin https://github.com/vizi2000/transkrypt.git@main
7b2d841 Update WordPress image to 6.0-apache
6c1a730 Add SSL certificate for argocd.borg.tools
5d0b620 Initial WordPress deployment
```

#### 3. Automated Deployment
✅ **Implemented**: ArgoCD continuously monitors Git and applies changes automatically

**ArgoCD Sync Policy**:
```yaml
syncPolicy:
  automated:
    prune: true          # Remove resources deleted from Git
    selfHeal: true       # Auto-fix manual changes to cluster
  syncOptions:
    - CreateNamespace=true
    - PruneLast=true
    - ApplyOutOfSyncOnly=true
```

**Sync Frequency**: ArgoCD polls Git every 3 minutes

#### 4. Continuous Reconciliation
✅ **Implemented**: ArgoCD continuously ensures cluster state matches Git state

- **Self-Healing**: Enabled - ArgoCD reverts manual changes
- **Drift Detection**: Real-time comparison of desired vs actual state
- **Health Monitoring**: Application health tracked continuously

---

## Repository Structure

### Directory Layout

```
gitops/
├── README.md                          # Repository documentation
├── argocd/                            # ArgoCD itself (Bootstrap)
│   ├── argocd-ingress.yaml           # ArgoCD web UI exposure
│   └── kustomization.yaml            # Kustomize entry point
├── apps/                              # Platform applications
│   └── deployer/                     # Custom deployer app
│       ├── deployment.yaml           # Deployer deployment spec
│       ├── service.yaml              # Deployer service
│       ├── ingress.yaml              # Deployer ingress (not yet active)
│       ├── namespace.yaml            # Deployer namespace creation
│       └── kustomization.yaml        # Kustomize manifest
├── base/                              # Reusable base manifests
│   ├── wordpress-stack.yaml          # Complete WordPress + MariaDB
│   ├── plugin-config.yaml            # Plugin deployment config
│   └── kustomization.yaml            # Base resources list
└── environments/                      # Environment-specific configs
    └── minikube/                     # Minikube/Production environment
        ├── kustomization.yaml        # Environment overlay
        └── patches.yaml              # Environment-specific patches
```

### Design Patterns

#### Pattern 1: Base + Overlay (Kustomize)

**Base Layer** (`base/`):
- Contains generic, reusable Kubernetes manifests
- No environment-specific values
- Suitable for multiple environments

**Overlay Layer** (`environments/minikube/`):
- Inherits from base
- Applies environment-specific patches
- Overrides resource limits, replicas, domains

**Example**:
```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- wordpress-stack.yaml
- plugin-config.yaml

# environments/minikube/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
patches:
- path: patches.yaml
```

#### Pattern 2: App-of-Apps (ArgoCD Projects)

ArgoCD applications organized into logical projects:

**Project: wordpress**
- Application: wordpress (WordPress + MariaDB)
- Source: `environments/minikube`
- Purpose: WordPress production workloads

**Project: platform**
- Application: argocd-platform (Deployer)
- Source: `apps/deployer`
- Purpose: Infrastructure services

**Benefits**:
- Namespace isolation
- RBAC boundaries
- Organizational clarity

#### Pattern 3: Config Externalization

**ConfigMaps for Dynamic Configuration**:
```yaml
# base/plugin-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wordpress-plugin-config
data:
  REPO_URL: https://github.com/vizi2000/transkrypt.git
  PLUGIN_PATH: wordpress-plugin/transcribe-files
  PLUGIN_BRANCH: main
```

**Benefits**:
- Modify plugin config without changing Deployment
- Deployer app updates ConfigMap via GitOps
- Triggers pod restart via ArgoCD sync

---

## ArgoCD Configuration

### ArgoCD Installation

**Method**: Official Kubernetes manifests + Kustomize overlay

**Namespace**: `argocd`

**Components**:
```bash
$ kubectl get pods -n argocd
NAME                                               READY   STATUS
argocd-application-controller-0                    1/1     Running
argocd-applicationset-controller-5b9b67656d-mm5gc  1/1     Running
argocd-dex-server-c8d667984-g4flz                  1/1     Running
argocd-notifications-controller-66cd6fcd69-22lft   1/1     Running
argocd-redis-797b6548f7-67tlm                      1/1     Running
argocd-repo-server-6df7758d78-f6wpb                1/1     Running
argocd-server-57574968c6-cqnh7                     1/1     Running
```

### ArgoCD Application Manifests

#### Application: wordpress

**File**: `~/argocd/application-wordpress.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: wordpress
  namespace: argocd
spec:
  project: wordpress
  source:
    repoURL: git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git
    targetRevision: main
    path: environments/minikube
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=false
    - PruneLast=true
    - ApplyOutOfSyncOnly=true
```

**Key Fields**:
- `project`: wordpress - Logical grouping
- `source.repoURL`: Internal Git daemon (not exposed to internet)
- `source.path`: `environments/minikube` - Points to Kustomize overlay
- `destination.namespace`: default - Target namespace
- `syncPolicy.automated.prune`: true - Remove deleted resources
- `syncPolicy.automated.selfHeal`: true - Revert manual changes

#### Application: plugin-deployer

**File**: `~/argocd/application-plugin-deployer.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: plugin-deployer
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git
    targetRevision: main
    path: apps/deployer
  destination:
    server: https://kubernetes.default.svc
    namespace: deployer
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true   # Auto-create namespace
    - PruneLast=true
    - ApplyOutOfSyncOnly=true
```

**Difference**: `CreateNamespace=true` - Deployer namespace created automatically

### ArgoCD Projects

**Project: wordpress**

**File**: `~/argocd/project-wordpress.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: wordpress
  namespace: argocd
spec:
  description: WordPress applications
  sourceRepos:
  - 'git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git'
  destinations:
  - namespace: default
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: '*'
    kind: '*'
```

**Project: platform**

**File**: `~/argocd/project-platform.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: platform
  namespace: argocd
spec:
  description: Platform infrastructure services
  sourceRepos:
  - 'git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git'
  destinations:
  - namespace: deployer
    server: https://kubernetes.default.svc
  - namespace: '*'
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: '*'
    kind: '*'
```

### ArgoCD Web UI Ingress

**File**: `gitops/argocd/argocd-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server
  namespace: argocd
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - argocd.borg.tools
    secretName: argocd-borg-tools-tls
  rules:
  - host: argocd.borg.tools
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
```

**Features**:
- Automatic SSL via cert-manager
- Force HTTPS redirect
- Accessible at https://argocd.borg.tools

### Git Repository Daemon

**Purpose**: Internal Git server for ArgoCD within Kubernetes

**Namespace**: `gitops-system`

**Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitops-git-daemon
  namespace: gitops-system
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: git-daemon
        image: gitea/git-daemon:latest
        volumeMounts:
        - name: gitops-repo
          mountPath: /git
      volumes:
      - name: gitops-repo
        hostPath:
          path: /home/vizi/gitops
          type: Directory
```

**Service**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: gitops-git-daemon
  namespace: gitops-system
spec:
  selector:
    app: gitops-git-daemon
  ports:
  - port: 9418
    protocol: TCP
    name: git
```

**Access URL**: `git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git`

**Benefits**:
- No external Git service dependency
- Fast local access (no internet latency)
- No authentication required (cluster-internal)
- Single source of truth on same machine

---

## Deployment Workflows

### Workflow 1: Manual Infrastructure Change

**Scenario**: Update WordPress image version

**Steps**:
1. Clone GitOps repository
   ```bash
   git clone git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git
   cd gitops
   ```

2. Edit manifest
   ```bash
   vim base/wordpress-stack.yaml
   # Change: image: wordpress:6.0-apache
   # To:     image: wordpress:6.1-apache
   ```

3. Commit and push
   ```bash
   git add base/wordpress-stack.yaml
   git commit -m "Update WordPress to 6.1"
   git push origin main
   ```

4. ArgoCD detects change (within 3 minutes)
5. ArgoCD syncs new configuration
6. WordPress pod recreated with new image
7. Health checks verify successful deployment

**Timeline**: ~5 minutes from commit to running pod

### Workflow 2: Automated Plugin Deployment (via Custom Deployer)

**Scenario**: Deploy WordPress plugin from GitHub

```
┌──────────────┐
│  Developer   │
│   (Web UI)   │
└──────┬───────┘
       │ 1. Submit deployment form
       │    (repo URL, plugin path, branch)
       ▼
┌──────────────────┐
│ Deployer FastAPI │
│   Application    │
└──────┬───────────┘
       │ 2. Validate plugin exists in GitHub
       │ 3. Clone GitOps repository
       │ 4. Update plugin-config.yaml
       │ 5. Git commit + push
       ▼
┌──────────────────┐
│  Git Repository  │
│  (gitops.git)    │
└──────┬───────────┘
       │ 6. ArgoCD polls (every 3 min)
       ▼
┌──────────────────┐
│  ArgoCD Server   │
│  (Sync Engine)   │
└──────┬───────────┘
       │ 7. Detect ConfigMap change
       │ 8. Trigger sync
       ▼
┌──────────────────┐
│  Kubernetes API  │
│    (kubectl)     │
└──────┬───────────┘
       │ 9. Update ConfigMap
       │ 10. Restart WordPress pod
       ▼
┌──────────────────┐
│ WordPress Pod    │
│  InitContainer   │
└──────┬───────────┘
       │ 11. Clone plugin from GitHub
       │ 12. Copy to /wp-content/plugins/
       ▼
┌──────────────────┐
│ WordPress Ready  │
│  Plugin Active   │
└──────────────────┘
```

**Detailed Steps**:

1. **User Action**: Submit form at deployer web UI
   - Repo URL: `https://github.com/vizi2000/transkrypt.git`
   - Plugin Path: `wordpress-plugin/transcribe-files`
   - Branch: `main`

2. **Deployer Validation**:
   ```python
   # Clone GitHub repo
   _clone_repo(repo_url, plugin_tmp, branch=branch, depth=1)

   # Validate plugin path exists
   candidate = plugin_tmp / plugin_path
   if not candidate.exists():
       raise HTTPException(detail=f"Plugin path '{plugin_path}' not found")
   ```

3. **GitOps Update**:
   ```python
   # Clone GitOps repo
   _clone_repo(GITOPS_REPO_URL, gitops_tmp, depth=0)

   # Update ConfigMap
   config_data = _load_yaml(config_file)
   config_data["data"]["REPO_URL"] = repo_url
   config_data["data"]["PLUGIN_PATH"] = plugin_path
   config_data["data"]["PLUGIN_BRANCH"] = branch
   _write_yaml(config_file, config_data)

   # Commit and push
   _run(["git", "commit", "-m", f"Configure plugin {repo_url}@{branch}"])
   _run(["git", "push", "origin", "HEAD"])
   ```

4. **ArgoCD Sync** (automatic):
   - Detects ConfigMap change in Git
   - Syncs new ConfigMap to Kubernetes
   - Kubernetes restarts WordPress pod (ConfigMap change triggers restart)

5. **WordPress InitContainer**:
   ```yaml
   initContainers:
   - name: clone-plugins
     image: alpine/git
     envFrom:
     - configMapRef:
         name: wordpress-plugin-config
     command:
     - sh
     - -c
     - |
       git clone --depth 1 --branch "${PLUGIN_BRANCH}" "${REPO_URL}" "${TMPDIR}"
       cp -R "${TMPDIR}/${PLUGIN_PATH}" /var/www/html/wp-content/plugins/
   ```

6. **WordPress Container Starts**: Plugin ready to use

**Timeline**: ~3-5 minutes from form submission to plugin active

**Benefits**:
- No manual SSH/FTP access needed
- Full audit trail in Git
- Automatic rollback capability (revert Git commit)
- Repeatable deployments
- Self-service for developers

### Workflow 3: Rollback Deployment

**Scenario**: New WordPress version causes issues, need to rollback

**Option 1: Git Revert** (Recommended)
```bash
# Find problematic commit
git log --oneline
# 8a3f912 Update WordPress to 6.1
# 7b2d841 Update WordPress to 6.0

# Revert commit
git revert 8a3f912
git push origin main

# ArgoCD automatically syncs old version
```

**Option 2: ArgoCD Sync to Previous Revision**
```bash
# Via ArgoCD CLI
argocd app sync wordpress --revision 7b2d841

# Via ArgoCD Web UI
# Navigate to wordpress app → Sync → Select revision 7b2d841
```

**Timeline**: ~2-3 minutes to rollback

### Workflow 4: Emergency Manual Fix

**Scenario**: Critical issue requires immediate manual fix (bypassing GitOps)

**Steps**:
1. Apply fix directly with kubectl:
   ```bash
   kubectl scale deployment/wordpress -n default --replicas=0
   kubectl scale deployment/wordpress -n default --replicas=1
   ```

2. ArgoCD detects drift (state differs from Git)

3. **Important**: Update Git immediately to match manual change:
   ```bash
   # Edit GitOps repo to match current state
   vim gitops/base/wordpress-stack.yaml
   git commit -m "Document emergency scaling fix"
   git push
   ```

4. ArgoCD sync status returns to "Synced"

**Warning**: Manual changes are reverted by ArgoCD self-heal (within minutes). Always update Git!

---

## Kustomize Strategy

### Why Kustomize?

**Benefits**:
- Native Kubernetes tool (kubectl built-in)
- No templating language (pure YAML)
- DRY principle (Don't Repeat Yourself)
- Environment-specific overlays
- Easy to understand and maintain

### Kustomize Structure

```
base/                          # Reusable base
├── wordpress-stack.yaml       # Generic WordPress + MariaDB
├── plugin-config.yaml         # Plugin config template
└── kustomization.yaml         # Resource list

environments/minikube/         # Production overlay
├── kustomization.yaml         # References base
└── patches.yaml               # Environment-specific changes
```

### Base Kustomization

**File**: `gitops/base/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- wordpress-stack.yaml
- plugin-config.yaml

# Common labels applied to all resources
commonLabels:
  managed-by: argocd
  environment: base

# Namespace for all resources
namespace: default
```

### Environment Overlay

**File**: `gitops/environments/minikube/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# Inherit from base
bases:
- ../../base

# Environment-specific namespace
namespace: default

# Apply patches
patches:
- path: patches.yaml

# Environment label
commonLabels:
  environment: minikube

# Resource limits
replicas:
- name: wordpress
  count: 1
- name: mariadb
  count: 1
```

### Patches

**File**: `gitops/environments/minikube/patches.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
spec:
  template:
    spec:
      containers:
      - name: wordpress
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Effect**: Adds resource limits to WordPress deployment

### Kustomize Build Test

```bash
# Test Kustomize build locally
kustomize build gitops/environments/minikube

# Output: Full rendered YAML with all patches applied
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    environment: minikube
    managed-by: argocd
  name: wordpress-plugin-config
  namespace: default
data:
  PLUGIN_BRANCH: main
  PLUGIN_PATH: wordpress-plugin/transcribe-files
  REPO_URL: https://github.com/vizi2000/transkrypt.git
---
apiVersion: v1
kind: Service
...
```

### Advanced Kustomize Patterns

**Pattern 1: Strategic Merge Patch**
```yaml
# Merge specific fields without replacing entire object
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
spec:
  replicas: 2  # Only changes replicas, keeps rest of deployment
```

**Pattern 2: JSON Patch**
```yaml
# Precise path-based modifications
patches:
- target:
    kind: Deployment
    name: wordpress
  patch: |-
    - op: replace
      path: /spec/replicas
      value: 2
```

**Pattern 3: Common Annotations**
```yaml
# Add annotations to all resources
commonAnnotations:
  managed-by: argocd
  deployed-by: "wojciech.wiesner@gmail.com"
```

---

## Security & Access Control

### ArgoCD RBAC

**Default Admin Access**: Initial admin password generated during installation

```bash
# Retrieve initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

**Authentication Methods**:
1. **Local Users**: Admin account + additional local users
2. **Dex Integration**: OAuth/OIDC for external identity providers
3. **SSO**: Can integrate with GitHub, Google, LDAP

**Current Setup**: Local admin user with Dex server running (configured for future SSO)

### Git Repository Security

**Access Control**:
- Git daemon accessible only within Kubernetes cluster
- No external exposure (no LoadBalancer/Ingress)
- Service type: ClusterIP (internal only)

**Git Daemon Service**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: gitops-git-daemon
  namespace: gitops-system
spec:
  type: ClusterIP  # Internal only
  selector:
    app: gitops-git-daemon
  ports:
  - port: 9418
    protocol: TCP
```

**Benefits**:
- No authentication bypass risk
- No internet exposure
- Fast local access
- ArgoCD and deployer can access without credentials

### Kubernetes RBAC

**Namespace Isolation**:
- ArgoCD applications limited to specific namespaces
- Projects define allowed destinations
- RBAC policies enforce boundaries

**Example Project RBAC**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: wordpress
spec:
  destinations:
  - namespace: default              # Only deploy to default namespace
    server: https://kubernetes.default.svc
  sourceRepos:
  - 'git://gitops-git-daemon.gitops-system.svc.cluster.local/gitops.git'
  clusterResourceWhitelist:
  - group: '*'
    kind: '*'
```

### Secrets Management

**Current Approach**: Kubernetes Secrets stored in cluster

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mariadb-secret
  namespace: default
type: Opaque
data:
  password: <base64-encoded>  # Not in Git repository
```

**Secrets NOT in Git**: Database passwords, API keys stored in cluster only

**Future Enhancement**: Sealed Secrets or External Secrets Operator for Git-stored encrypted secrets

### SSL/TLS Security

**Certificate Management**:
- All certificates managed by cert-manager
- Let's Encrypt production certificates
- Automatic renewal before expiry
- Force HTTPS redirects on all ingresses

**Ingress Security Annotations**:
```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
```

---

## Disaster Recovery

### Backup Strategy

**What's Backed Up**:
1. **Git Repository**: Primary source of truth
   - Location: `/home/vizi/gitops/`
   - Backup: Git remote (can be GitHub/GitLab)
   - Recovery: `git clone` from remote

2. **Kubernetes Cluster State**: Defined in Git
   - Backup: Git repository contains all manifests
   - Recovery: Apply manifests to new cluster

3. **Persistent Data** (Requires additional backup):
   - WordPress wp-content (PVC)
   - MariaDB database (PVC)
   - Recommendation: Velero for PVC backups

### Disaster Recovery Scenarios

#### Scenario 1: ArgoCD Crash

**Recovery Steps**:
1. Reinstall ArgoCD:
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

2. Apply ArgoCD applications:
   ```bash
   kubectl apply -f ~/argocd/application-wordpress.yaml
   kubectl apply -f ~/argocd/application-plugin-deployer.yaml
   ```

3. ArgoCD automatically syncs from Git

**Recovery Time**: ~10 minutes

#### Scenario 2: Complete Cluster Loss

**Recovery Steps**:
1. Provision new Minikube cluster:
   ```bash
   minikube start
   ```

2. Install core infrastructure:
   ```bash
   # cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

   # ingress-nginx
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

   # ArgoCD
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

3. Deploy Git daemon:
   ```bash
   kubectl create namespace gitops-system
   kubectl apply -f ~/gitops/git-daemon/
   ```

4. Apply ArgoCD applications:
   ```bash
   kubectl apply -f ~/argocd/
   ```

5. Restore persistent data (if backed up with Velero):
   ```bash
   velero restore create --from-backup wordpress-backup
   ```

**Recovery Time**: ~30-60 minutes (excluding data restore)

#### Scenario 3: Corrupted Git Repository

**Recovery Steps**:
1. Restore from Git remote backup:
   ```bash
   cd ~
   rm -rf gitops
   git clone git@github.com:vizi2000/gitops-backup.git gitops
   ```

2. Restart Git daemon pod:
   ```bash
   kubectl rollout restart deployment/gitops-git-daemon -n gitops-system
   ```

3. Force ArgoCD sync:
   ```bash
   argocd app sync wordpress --force
   argocd app sync plugin-deployer --force
   ```

**Recovery Time**: ~5 minutes

### Best Practices for DR

1. **Regular Git Backups**: Push GitOps repo to external Git service (GitHub)
2. **Document Procedures**: Keep this documentation updated
3. **Test Recovery**: Periodic DR drills (every 6 months)
4. **Monitor Sync Status**: Alert on ArgoCD sync failures
5. **Backup Secrets**: Export Kubernetes secrets to secure storage

### Recovery Commands Cheatsheet

```bash
# Backup all Kubernetes secrets
kubectl get secrets --all-namespaces -o yaml > secrets-backup.yaml

# Backup GitOps repository
cd ~/gitops && git bundle create gitops-backup.bundle --all

# Restore GitOps repository from bundle
git clone gitops-backup.bundle gitops

# List ArgoCD applications
kubectl get applications -n argocd

# Force ArgoCD sync
argocd app sync <app-name> --force

# Rollback to previous Git commit
git revert <commit-hash>
git push origin main
```

---

## Monitoring & Observability

### ArgoCD Metrics

**Available Metrics**:
- Application sync status (Synced/OutOfSync)
- Application health status (Healthy/Degraded/Missing)
- Sync operation duration
- Repository polling success rate

**Prometheus Metrics Endpoint**:
```bash
kubectl port-forward -n argocd svc/argocd-metrics 8082:8082
curl http://localhost:8082/metrics
```

**Key Metrics**:
```
argocd_app_sync_total               # Total sync operations
argocd_app_reconcile_count          # Reconciliation count
argocd_git_request_duration_seconds # Git operation latency
```

### Grafana Dashboards

**Recommended Dashboards**:
1. **ArgoCD Dashboard** (Grafana ID: 14584)
   - Application health overview
   - Sync status timeline
   - Failed syncs alerts

2. **Kubernetes Cluster Dashboard** (Grafana ID: 7249)
   - Node resource usage
   - Pod status
   - Namespace resource consumption

**Dashboard Import**:
```bash
# Access Grafana
http://borg.tools:3000

# Import dashboard
Dashboard → Import → Enter ID 14584 → Load
```

---

## Troubleshooting Guide

### Issue: ArgoCD Application OutOfSync

**Diagnosis**:
```bash
kubectl get applications -n argocd
# NAME         SYNC STATUS   HEALTH STATUS
# wordpress    OutOfSync     Healthy
```

**Causes**:
1. Manual changes to cluster (kubectl apply)
2. Git repository not accessible
3. Invalid YAML in Git

**Resolution**:
```bash
# Check diff
argocd app diff wordpress

# Force sync
argocd app sync wordpress --force

# Check self-heal setting
kubectl get application wordpress -n argocd -o yaml | grep selfHeal
```

### Issue: Git Daemon Not Accessible

**Diagnosis**:
```bash
kubectl logs -n gitops-system deployment/gitops-git-daemon
```

**Causes**:
1. Git daemon pod crashed
2. Volume mount issues
3. Network policies blocking access

**Resolution**:
```bash
# Restart Git daemon
kubectl rollout restart deployment/gitops-git-daemon -n gitops-system

# Check service
kubectl get svc -n gitops-system
```

### Issue: WordPress Pod CrashLoopBackOff

**Diagnosis**:
```bash
kubectl get pods -n default
kubectl logs wordpress-<pod-id> -c clone-plugins  # InitContainer logs
kubectl logs wordpress-<pod-id> -c wordpress      # Main container logs
```

**Causes**:
1. Plugin clone failed (invalid GitHub repo)
2. Database connection failed
3. Resource limits exceeded

**Resolution**:
```bash
# Check plugin config
kubectl get cm wordpress-plugin-config -n default -o yaml

# Verify database
kubectl exec -it mariadb-<pod-id> -n default -- mysql -u wordpress -p

# Check resource usage
kubectl top pod wordpress-<pod-id> -n default
```

---

## Advanced Topics

### Multi-Cluster ArgoCD

**Future Enhancement**: Manage multiple Kubernetes clusters from single ArgoCD instance

**Architecture**:
```
ArgoCD (Primary Cluster)
    |
    +-- Cluster 1 (Production)
    +-- Cluster 2 (Staging)
    +-- Cluster 3 (Development)
```

**Benefits**:
- Centralized GitOps control
- Consistent deployments across clusters
- Environment promotion workflows

### ApplicationSets

**Purpose**: Generate multiple ArgoCD Applications from templates

**Use Case**: Deploy same application to multiple environments

**Example**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: wordpress-multi-env
spec:
  generators:
  - list:
      elements:
      - env: dev
      - env: staging
      - env: prod
  template:
    metadata:
      name: 'wordpress-{{env}}'
    spec:
      source:
        path: 'environments/{{env}}'
```

### Progressive Delivery

**Canary Deployments**: Gradual rollout with Argo Rollouts

**Blue-Green Deployments**: Zero-downtime deployments with instant rollback

**Future Integration**: Argo Rollouts + Flagger for advanced deployment strategies

---

## Conclusion

This GitOps architecture demonstrates:

- **Declarative Infrastructure**: All configuration in Git
- **Automated Workflows**: CI/CD without manual steps
- **Self-Healing Systems**: ArgoCD ensures desired state
- **Security Best Practices**: RBAC, SSL/TLS, secret management
- **Disaster Recovery**: Quick recovery from Git

**Key Takeaways**:
- Git as single source of truth
- ArgoCD for continuous reconciliation
- Kustomize for environment management
- Internal Git daemon for fast, secure access
- Custom automation (deployer) integrated with GitOps

**Production-Ready Features**:
- 14 days uptime with zero manual interventions
- Automated SSL certificate management
- Self-healing deployments
- Full audit trail in Git
- Quick rollback capability

---

**Last Updated**: October 2025
**Status**: Production Active
**Maintained By**: Wojciech Wiesner
