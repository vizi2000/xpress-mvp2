# DevOps/GitOps Portfolio - CV Summary

**One-Page Technical Summary for Resume/CV**

---

## Project Overview

**Production GitOps Infrastructure on VPS Server (borg.tools)**

Designed, implemented, and maintain a production-ready Kubernetes-based infrastructure using GitOps methodology with ArgoCD, demonstrating advanced DevOps skills and cloud-native best practices.

**Duration**: 5 weeks design/implementation + 2+ weeks production runtime
**Status**: Production-active, 24/7 uptime, zero manual interventions in 16 days

---

## Technical Stack

### Core Technologies
- **Kubernetes**: v1.33.5 (Minikube v1.37.0)
- **GitOps**: ArgoCD with automated sync and self-healing
- **Infrastructure as Code**: Kustomize for environment management
- **SSL Automation**: cert-manager with Let's Encrypt integration
- **Networking**: ingress-nginx with SSL termination
- **Monitoring**: Prometheus + Grafana with 15-day retention
- **Containerization**: Docker + Kubernetes hybrid architecture

### Programming & Scripting
- **Python 3**: FastAPI web application (150+ lines)
- **Bash**: System automation and Git operations
- **YAML**: Kubernetes manifests and configuration

### Cloud & Infrastructure
- **Linux**: VPS management, systemd, networking
- **DNS**: Multi-domain routing and management
- **Reverse Proxy**: nginx configuration and load balancing

---

## Key Achievements

### 1. Full GitOps Implementation
- **100% declarative infrastructure** - All configuration stored in Git
- **Automated continuous delivery** - ArgoCD polls Git every 3 minutes
- **Self-healing system** - Automatic revert of manual changes
- **Zero manual deployments** - No kubectl commands in 16 days of operation

### 2. Custom Deployment Automation
Built **FastAPI-based plugin deployer** solving WordPress deployment challenges:
- Web UI for GitHub-to-Kubernetes deployment
- Automated validation and GitOps integration
- Zero-downtime plugin updates
- Full audit trail via Git commits

**Innovation**: Combines InitContainers, ConfigMaps, and GitOps for elegant solution

### 3. Automated SSL Certificate Management
- **4 domains** with Let's Encrypt certificates
- **Automatic renewal** 30 days before expiry
- **HTTP-01 challenge** automated via ingress-nginx
- **Zero manual intervention** - fully automated

### 4. Production-Grade Monitoring
- **Prometheus** metrics collection (100+ metrics)
- **Grafana** dashboards for visualization
- **15-day retention** with automatic compaction
- **Application health tracking** via ArgoCD

### 5. Multi-Layer Security
- SSL/TLS on all public services
- Kubernetes RBAC and namespace isolation
- Secrets management (not stored in Git)
- Internal-only Git daemon (no internet exposure)
- Network security via ClusterIP services

---

## Architecture Highlights

### Infrastructure Components
- **24 Kubernetes pods** across 7 namespaces
- **17 Kubernetes services** (internal routing)
- **10 Docker containers** (hybrid architecture)
- **3 ArgoCD projects** (logical isolation)
- **2 ArgoCD applications** (WordPress, Platform)

### GitOps Repository Structure
```
gitops/
├── base/                 # Reusable base manifests
├── environments/         # Environment-specific overlays
├── apps/                 # Platform applications
└── argocd/              # ArgoCD configuration
```

### Network Architecture
```
Internet → nginx-proxy (Docker) → Minikube NodePort
  → ingress-nginx → Services → Pods
```

### SSL Certificate Flow
```
Ingress → cert-manager → Let's Encrypt ACME
  → HTTP-01 Challenge → Certificate Issued → Secret
```

---

## Skills Demonstrated

### DevOps Core Skills
- [x] Kubernetes administration and troubleshooting
- [x] GitOps methodology implementation
- [x] Infrastructure as Code (IaC)
- [x] CI/CD pipeline design
- [x] Container orchestration
- [x] Configuration management (Kustomize)

### Security & Networking
- [x] SSL/TLS certificate automation
- [x] Ingress controller configuration
- [x] Reverse proxy setup
- [x] Secrets management
- [x] RBAC implementation
- [x] Network isolation

### Monitoring & Reliability
- [x] Prometheus metrics collection
- [x] Grafana dashboard creation
- [x] Health check implementation
- [x] Disaster recovery planning
- [x] System reliability engineering

### Automation & Development
- [x] Python FastAPI development
- [x] Bash scripting
- [x] Git automation
- [x] REST API design
- [x] Web application development

---

## Complex Problem Solved

**Challenge**: Integrate WordPress plugin deployment with GitOps workflow while maintaining zero-downtime and audit trail.

**Constraints**:
- WordPress expects plugins at runtime
- Can't bake plugins into Docker image (breaks GitOps)
- Plugin source is external (GitHub)
- Need automated deployment

**Solution Architecture**:
1. **FastAPI Deployer** - Web UI validates and updates GitOps repo
2. **ConfigMap** - Stores plugin repository details
3. **InitContainer** - Clones plugin before WordPress starts
4. **ArgoCD** - Detects ConfigMap change and restarts pod
5. **Git Audit** - Full deployment history

**Result**: Elegant solution demonstrating deep Kubernetes knowledge and creative problem-solving.

---

## Production Metrics

| Metric | Value |
|--------|-------|
| **Uptime** | 16+ days continuous operation |
| **Manual Interventions** | 0 in production |
| **Failed Deployments** | 0 since launch |
| **Average Deployment Time** | 3-5 minutes (GitHub to live) |
| **SSL Certificates** | 4 domains, 100% automated |
| **GitOps Applications** | 2 applications, 100% synced |
| **Monitoring Retention** | 15 days of metrics |
| **Response Time** | <5 minutes for most failures |

---

## Disaster Recovery Capabilities

Documented and tested recovery procedures:
- **ArgoCD crash**: 10-minute recovery
- **Complete cluster loss**: 30-60 minute recovery
- **Git corruption**: 5-minute recovery
- **Pod failures**: Automatic self-healing

Full backup strategy with Git as source of truth.

---

## Business Value

### Operational Efficiency
- **Zero manual deployments** - Full automation
- **Fast deployments** - 3-5 minutes end-to-end
- **Quick rollbacks** - Git revert + auto-sync
- **Audit compliance** - Full Git history

### Cost Optimization
- **Single VPS** - Kubernetes + Docker hybrid
- **No external Git** - Internal Git daemon
- **Free SSL** - Let's Encrypt automation
- **Open source stack** - Zero licensing costs

### Reliability & Security
- **Self-healing** - ArgoCD automatic recovery
- **SSL everywhere** - All public services encrypted
- **Quick disaster recovery** - <60 minutes worst-case
- **Production-tested** - 16+ days uptime

---

## Documentation Quality

Created comprehensive technical documentation:
- **DEVOPS_PORTFOLIO.md** (27KB) - Full portfolio showcase
- **GITOPS_ARCHITECTURE.md** (30KB) - Technical deep-dive
- **PORTFOLIO_README.md** (19KB) - Quick start guide
- **GITOPS_DIAGRAMS.md** (14KB) - Architecture diagrams
- **This CV Summary** - One-page technical overview

Total documentation: **90KB** of professional technical writing.

---

## Code Samples Available

**FastAPI Deployer** (`automation/deployer/app.py`):
- 150+ lines of production Python code
- Git automation, YAML parsing, error handling
- REST API with web UI

**Kubernetes Manifests** (`gitops/`):
- 500+ lines of YAML configuration
- Kustomize base + overlays
- ArgoCD applications and projects

**ArgoCD Configuration**:
- Application definitions
- Project RBAC
- Sync policies

---

## Verifiable Claims

All claims in this portfolio are verifiable:

1. **Live Infrastructure**: Available for demonstration at borg.tools
2. **ArgoCD Dashboard**: https://argocd.borg.tools (credentials available)
3. **Production Site**: https://transcriptor.borg.tools
4. **GitOps Repository**: Available upon request
5. **Source Code**: FastAPI deployer code available
6. **SSH Access**: Can provide for technical review

---

## Relevant Experience

This portfolio demonstrates proficiency in:

### Job Titles
- DevOps Engineer
- Site Reliability Engineer (SRE)
- Kubernetes Administrator
- Platform Engineer
- Infrastructure Engineer
- GitOps Engineer

### Required Skills (Common Job Descriptions)
- [x] Kubernetes in production
- [x] GitOps with ArgoCD
- [x] Infrastructure as Code (Terraform/Ansible equivalent: Kustomize)
- [x] CI/CD pipelines
- [x] Monitoring with Prometheus/Grafana
- [x] SSL/TLS management
- [x] Linux system administration
- [x] Docker containerization
- [x] Python scripting
- [x] Bash automation
- [x] Git workflows
- [x] Disaster recovery planning
- [x] Security best practices

---

## Next Steps for Employers

### For Phone Screen
Prepared to discuss:
- High-level architecture overview
- Key technology choices
- Most challenging problem solved
- Production reliability approach

### For Technical Interview
Can demonstrate:
- Live infrastructure walkthrough
- GitOps deployment workflow
- Disaster recovery procedures
- Code review (FastAPI deployer)
- Kubernetes troubleshooting

### For On-Site
Available to:
- Present architecture to team
- Pair programming session
- System design discussion
- Hands-on troubleshooting exercise

---

## Contact Information

**Name**: Wojciech Wiesner
**Email**: wojciech.wiesner@gmail.com
**Portfolio Documentation**: Available in this repository
**Live Demo**: Available upon request (borg.tools)

**Availability**: Immediate for full-time DevOps/SRE positions

---

## Quick Stats Summary

```
Infrastructure:
  Kubernetes: 24 pods, 17 services, 7 namespaces
  Docker: 10 containers
  Domains: 4 with automated SSL

GitOps:
  Applications: 2 ArgoCD apps
  Projects: 3 ArgoCD projects
  Sync Status: 100% synced
  Automation: 100% GitOps

Operations:
  Uptime: 16+ days continuous
  Manual Ops: 0 in 16 days
  Failed Deploys: 0 since launch
  Recovery Time: <60 minutes worst-case

Monitoring:
  Metrics: 100+ collected
  Retention: 15 days
  Dashboards: 2+ Grafana dashboards
  Alerting: Manual (automated planned)

Security:
  SSL Certs: 4 Let's Encrypt
  Secrets: Kubernetes Secrets
  RBAC: Namespace isolation
  Network: ClusterIP + ingress-only
```

---

**This portfolio demonstrates production-ready DevOps skills with real infrastructure, not toy projects.**

**Last Updated**: October 2025
**Status**: Production Active
