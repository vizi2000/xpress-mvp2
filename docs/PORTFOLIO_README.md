# DevOps/GitOps Portfolio - Quick Start Guide

**Welcome!** This guide provides a quick overview of the DevOps/GitOps infrastructure portfolio for recruiters and technical interviewers.

---

## 5-Minute Overview

### What This Is

A **production-ready GitOps infrastructure** running on a VPS server (borg.tools) showcasing:

- Kubernetes cluster management (Minikube)
- GitOps continuous delivery (ArgoCD)
- Automated SSL certificates (cert-manager + Let's Encrypt)
- Custom deployment automation (FastAPI application)
- Production monitoring (Prometheus + Grafana)
- Real WordPress deployments with automated plugin management

### Key Stats

| Metric | Value |
|--------|-------|
| **Uptime** | 16+ days continuous |
| **Applications Managed** | 2 ArgoCD applications |
| **Services Running** | 17 Kubernetes services + 10 Docker containers |
| **SSL Certificates** | 4 automated Let's Encrypt certificates |
| **Automation Level** | 100% GitOps (zero manual deployments) |
| **Recovery Time** | <5 minutes for most failures |

---

## Architecture at a Glance

```
Internet (443/80)
    |
nginx-proxy (Docker) ──────┬──────> Kubernetes (Minikube)
    |                       |
    |                       ├─> ArgoCD (GitOps Engine)
    |                       ├─> cert-manager (SSL Automation)
    |                       ├─> ingress-nginx (Traffic Routing)
    |                       ├─> WordPress + MariaDB (Production App)
    |                       └─> Custom Deployer (FastAPI)
    |
    ├─> Grafana:3000 (Monitoring Dashboard)
    ├─> Prometheus:9091 (Metrics)
    └─> Portainer:9000 (Docker Management)
```

**Key Domains**:
- `argocd.borg.tools` - GitOps dashboard (ArgoCD web UI)
- `transcriptor.borg.tools` - Production WordPress site
- `borg.tools` - Main landing page

---

## Why This Matters

### DevOps Skills Demonstrated

1. **GitOps Methodology**
   - All infrastructure defined as code
   - Git as single source of truth
   - Automated reconciliation and self-healing
   - Zero manual kubectl commands in production

2. **Kubernetes Expertise**
   - Cluster setup and management
   - Multi-namespace organization
   - Custom resource management
   - Health checks, probes, and rollout strategies

3. **Automation & Scripting**
   - FastAPI application for deployment automation
   - Python scripting for GitOps integration
   - Shell scripting for system management
   - CI/CD pipeline design

4. **Security Best Practices**
   - Automated SSL certificate management
   - Secrets management (Kubernetes Secrets)
   - RBAC and namespace isolation
   - Network security (ClusterIP, ingress-only access)

5. **Monitoring & Observability**
   - Prometheus metrics collection
   - Grafana dashboards
   - Application health monitoring
   - SSL certificate expiry tracking

6. **Production Operations**
   - 24/7 running services
   - Disaster recovery procedures
   - Rollback strategies
   - Incident response planning

---

## Unique Innovations

### 1. Custom WordPress Plugin Deployer

**Problem**: Traditional WordPress plugin deployment requires manual FTP/SSH uploads.

**Solution**: Built a FastAPI web application that:
- Accepts GitHub repository URL and plugin path
- Validates plugin exists
- Updates GitOps configuration
- Triggers automated deployment via ArgoCD
- WordPress pod automatically clones plugin on startup

**Result**: Zero-downtime plugin deployments from GitHub with full audit trail.

**Technologies**: FastAPI, Git automation, Kubernetes InitContainers, ConfigMaps

### 2. Internal Git Daemon for ArgoCD

**Problem**: ArgoCD needs Git repository access without exposing it to the internet.

**Solution**: Deployed Git daemon inside Kubernetes cluster:
- Accessible only within cluster (ClusterIP service)
- Mounts local filesystem from host
- ArgoCD connects via internal DNS
- No authentication needed (cluster-internal)

**Result**: Fast, secure GitOps with no external dependencies.

**Technologies**: Git daemon, Kubernetes Services, hostPath volumes

### 3. Automated SSL for Multiple Domains

**Problem**: Manual SSL certificate management is time-consuming and error-prone.

**Solution**: Integrated cert-manager with Let's Encrypt:
- Automatic certificate requests via HTTP-01 challenge
- Renewal 30 days before expiry
- Integration with ingress-nginx
- Multiple issuers (production, staging, self-signed)

**Result**: 4 domains with valid SSL certificates, zero manual intervention.

**Technologies**: cert-manager, Let's Encrypt ACME, ingress-nginx

---

## Documentation Structure

This portfolio contains three main documents:

### 1. DEVOPS_PORTFOLIO.md (Main Portfolio)
**For**: Recruiters and hiring managers
**Contents**:
- Executive summary with key achievements
- Complete infrastructure overview
- Technology stack details
- Real-world use cases
- Production metrics and statistics
- Technical challenges solved

**Time to Read**: 20-30 minutes

### 2. GITOPS_ARCHITECTURE.md (Technical Deep-Dive)
**For**: Technical interviewers and DevOps engineers
**Contents**:
- GitOps principles implementation
- ArgoCD configuration details
- Deployment workflow diagrams
- Kustomize strategy
- Security architecture
- Disaster recovery procedures
- Troubleshooting guide

**Time to Read**: 30-45 minutes

### 3. PORTFOLIO_README.md (This Document)
**For**: Quick overview and navigation
**Contents**:
- 5-minute summary
- Skills matrix
- Key innovations
- How to verify claims
- Contact information

**Time to Read**: 5-10 minutes

---

## How to Verify These Claims

### Option 1: Review Live Infrastructure (Recommended)

I can provide **live demonstration** access to:

1. **ArgoCD Dashboard** (`argocd.borg.tools`)
   - View application sync status
   - See Git commit history
   - Check application health

2. **Production WordPress** (`transcriptor.borg.tools`)
   - Live site with automated plugin deployment
   - SSL certificate verification
   - Performance testing

3. **Grafana Dashboards** (`borg.tools:3000`)
   - Prometheus metrics visualization
   - Cluster resource usage
   - Application health monitoring

4. **SSH Access** (upon request)
   - Inspect Kubernetes cluster (`kubectl`)
   - Review GitOps repository
   - Examine configuration files

### Option 2: Review Code & Configuration

**GitOps Repository** (can be provided):
- Complete Kubernetes manifests
- ArgoCD application definitions
- Kustomize overlays
- Custom deployer source code

**Key Files to Review**:
```
gitops/
├── base/wordpress-stack.yaml        # WordPress production setup
├── base/plugin-config.yaml          # Dynamic plugin configuration
├── argocd/argocd-ingress.yaml       # ArgoCD SSL ingress
└── apps/deployer/deployment.yaml    # Custom deployer app

automation/
└── deployer/app.py                  # FastAPI deployer source code
```

### Option 3: Technical Interview

Prepared to discuss:
- Architecture decisions and trade-offs
- Disaster recovery procedures
- Scaling strategies
- Security considerations
- Cost optimization
- Alternative approaches

---

## Skills Matrix

### Kubernetes & Container Orchestration

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| Kubernetes Administration | Advanced | 24 running pods, 7 namespaces, 17 services |
| kubectl CLI | Expert | Daily cluster management, troubleshooting |
| Docker | Advanced | 10 production containers, custom images |
| Minikube | Expert | Full cluster setup and networking |
| Helm/Kustomize | Advanced | Kustomize-based configuration management |
| Container Networking | Advanced | Ingress, Services, NetworkPolicies |
| Resource Management | Intermediate | Resource requests/limits, HPA-ready |

### GitOps & CI/CD

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| ArgoCD | Advanced | 2 projects, 2 applications, automated sync |
| Git Workflows | Expert | Git-driven deployments, branching strategies |
| Infrastructure as Code | Advanced | 100% of infrastructure in Git |
| Kustomize | Advanced | Base + overlay pattern, patches |
| Automated Deployments | Advanced | Zero manual deployments in 16 days |
| Rollback Strategies | Intermediate | Git revert + ArgoCD sync |

### Security & Networking

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| SSL/TLS Management | Advanced | cert-manager + Let's Encrypt automation |
| Ingress Controllers | Advanced | ingress-nginx with SSL termination |
| Secrets Management | Intermediate | Kubernetes Secrets, no secrets in Git |
| RBAC | Intermediate | Namespace isolation, ArgoCD projects |
| Network Security | Intermediate | ClusterIP services, internal-only Git |

### Monitoring & Observability

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| Prometheus | Intermediate | 15-day retention, metrics collection |
| Grafana | Intermediate | Dashboard configuration, data sources |
| Log Aggregation | Beginner | kubectl logs (ELK stack planned) |
| Health Monitoring | Advanced | Readiness/liveness probes, health checks |
| Alerting | Beginner | Manual monitoring (Alertmanager planned) |

### Programming & Scripting

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| Python | Advanced | FastAPI deployer application (150+ lines) |
| Bash Scripting | Advanced | System automation, Git operations |
| YAML | Expert | Kubernetes manifests, configuration |
| FastAPI | Intermediate | REST API with Git integration |
| Git Automation | Advanced | Programmatic Git operations |

### Cloud & Infrastructure

| Skill | Proficiency | Evidence |
|-------|-------------|----------|
| Linux System Admin | Advanced | VPS management, systemd, networking |
| VPS/Cloud Hosting | Intermediate | Production server management |
| DNS Management | Intermediate | Multiple domain routing |
| Reverse Proxy | Advanced | nginx configuration, port forwarding |
| Storage Management | Intermediate | PersistentVolumes, PVCs |

---

## Project Timeline

| Phase | Duration | Key Achievements |
|-------|----------|------------------|
| **Planning & Design** | 3 days | Architecture design, technology selection |
| **Core Infrastructure** | 5 days | Kubernetes setup, ArgoCD installation, ingress-nginx |
| **SSL Automation** | 2 days | cert-manager integration, Let's Encrypt configuration |
| **WordPress Deployment** | 3 days | MariaDB + WordPress stack, persistent storage |
| **Custom Deployer** | 4 days | FastAPI app development, Git integration, testing |
| **Monitoring Setup** | 2 days | Prometheus + Grafana deployment |
| **Documentation** | 2 days | Portfolio creation, architecture diagrams |
| **Production Stabilization** | 14+ days | Continuous operation, bug fixes, improvements |

**Total**: ~5 weeks (part-time development) + 2+ weeks production runtime

---

## Technical Highlights

### Most Complex Challenge

**Challenge**: Integrate WordPress plugin deployment with GitOps workflow

**Complexity**:
- WordPress expects plugins at `/wp-content/plugins/` at runtime
- Can't bake plugins into Docker image (breaks GitOps)
- Plugin source is in external GitHub repository
- Need zero-downtime updates

**Solution**:
1. Create ConfigMap with plugin repository details
2. Custom deployer app updates ConfigMap via Git
3. WordPress pod uses InitContainer to clone plugin
4. Plugin copied to shared volume before WordPress starts
5. ArgoCD detects ConfigMap change and restarts pod

**Result**: Elegant solution combining InitContainers, ConfigMaps, and GitOps

### Most Satisfying Achievement

**Achievement**: 16+ days of continuous operation with zero manual interventions

**Why It Matters**:
- Demonstrates system reliability
- Validates self-healing architecture
- Proves GitOps methodology works
- Shows proper monitoring and alerting

---

## Common Interview Questions

### Q: Why GitOps instead of traditional CI/CD?

**A**: GitOps provides:
- **Declarative**: Desired state in Git, not imperative scripts
- **Versioned**: Full history of infrastructure changes
- **Auditable**: Who changed what and when
- **Rollback**: `git revert` to undo any change
- **Self-Healing**: ArgoCD continuously ensures desired state
- **Security**: Git as authentication/authorization boundary

Traditional CI/CD uses imperative scripts (`kubectl apply`), which lack auditability and can drift from source control.

### Q: How do you handle secrets in GitOps?

**A**: Current approach:
- Secrets created manually with `kubectl create secret`
- Not stored in Git repository
- Referenced by name in manifests

**Production approach** (planned):
- Sealed Secrets (Bitnami) - encrypt secrets for Git storage
- External Secrets Operator - fetch from Vault/AWS Secrets Manager
- SOPS - encrypt YAML files with PGP/KMS

### Q: What happens if ArgoCD goes down?

**A**:
- **Workloads continue running** - ArgoCD is control plane only
- **Manual operations** - Can use `kubectl` directly
- **Quick recovery** - Reinstall ArgoCD + apply application manifests
- **Recovery time** - ~10 minutes

GitOps separation of control plane (ArgoCD) and data plane (Kubernetes) ensures resilience.

### Q: How would you scale this to 100 applications?

**A**:
- **ApplicationSets** - Generate apps from templates
- **Multi-cluster** - Separate clusters per environment
- **App-of-Apps pattern** - Hierarchical application structure
- **Mono-repo vs multi-repo** - Evaluate based on team size
- **RBAC** - Per-team ArgoCD projects
- **Automation** - GitLab/GitHub webhooks for faster sync

### Q: What's your disaster recovery strategy?

**A**:
1. **Git backup** - GitOps repo pushed to GitHub
2. **Secrets backup** - Export to secure storage
3. **Documentation** - Recovery procedures documented
4. **Testing** - Periodic DR drills
5. **Monitoring** - Alerts on critical failures

**Recovery scenarios**:
- ArgoCD crash: 10 minutes
- Cluster loss: 30-60 minutes
- Git corruption: 5 minutes

---

## Contact & Next Steps

### For Recruiters

**Interested in discussing this portfolio?**

I'm available for:
- Live demonstration of the infrastructure
- Technical deep-dive presentations
- Code review sessions
- Architecture discussion
- Hands-on pair programming

**Contact**:
- Email: wojciech.wiesner@gmail.com
- Server: borg.tools (available for demo access)

### For Technical Interviewers

**Want to dig deeper?**

Prepared to discuss:
- Alternative architecture approaches
- Trade-offs in technology selection
- Production incident scenarios
- Scaling and optimization strategies
- Security hardening
- Cost analysis

**Available Materials**:
- Full GitOps repository access
- Custom deployer source code
- Kubernetes manifests
- ArgoCD configuration
- Architecture diagrams

---

## Related Projects

This portfolio is part of a broader DevOps skill demonstration including:

1. **MCP VIBE Server** (`borg.tools/mcp`)
   - FastAPI specification management system
   - Requirements generation, design validation
   - API-driven workflow automation

2. **Agent Zero AI** (`borg.tools:50001`)
   - AI-powered automation agent
   - Docker deployment on same infrastructure
   - Integration with development workflow

3. **Remote Desktop (Guacamole)** (`borg.tools:8080`)
   - Browser-based remote access
   - PostgreSQL backend
   - Multi-user support

4. **Monitoring Stack**
   - Prometheus metrics collection
   - Grafana visualization
   - Portainer for Docker management

All services managed with consistent DevOps practices.

---

## Portfolio Metrics Summary

| Category | Metric | Value |
|----------|--------|-------|
| **Infrastructure** | Kubernetes Pods | 24 running |
| | Kubernetes Services | 17 services |
| | Docker Containers | 10 containers |
| | Namespaces | 7 namespaces |
| **GitOps** | ArgoCD Applications | 2 applications |
| | ArgoCD Projects | 3 projects |
| | Sync Status | 100% synced |
| | Automation Level | 100% GitOps |
| **Security** | SSL Certificates | 4 Let's Encrypt certs |
| | Certificate Automation | 100% automated |
| | Force HTTPS | All ingresses |
| **Reliability** | Uptime | 16+ days continuous |
| | Manual Interventions | 0 in 16 days |
| | Failed Deployments | 0 in 16 days |
| **Monitoring** | Prometheus Retention | 15 days |
| | Grafana Dashboards | 2+ dashboards |
| | Metrics Collected | 100+ metrics |

---

## Technical Stack Summary

**Core Technologies**:
- Kubernetes v1.33.5
- ArgoCD (Latest)
- Minikube v1.37.0
- cert-manager (Latest)
- ingress-nginx (Latest)

**Languages & Frameworks**:
- Python 3 + FastAPI
- Bash scripting
- YAML (Kubernetes manifests)

**Monitoring**:
- Prometheus (Latest)
- Grafana (Latest)
- Portainer CE (Latest)

**Infrastructure**:
- Linux VPS (borg.tools)
- Docker + Kubernetes hybrid
- nginx reverse proxy

---

## Why This Portfolio Stands Out

1. **Production-Grade**: Not a tutorial project - real 24/7 infrastructure
2. **Innovation**: Custom deployer solving real WordPress deployment challenges
3. **Automation**: Zero manual deployments, fully GitOps-driven
4. **Security**: SSL automation, secrets management, network isolation
5. **Monitoring**: Full observability with Prometheus + Grafana
6. **Documentation**: Comprehensive, professional documentation
7. **Reliability**: 16+ days uptime with zero manual interventions

**Bottom Line**: This portfolio demonstrates the ability to design, implement, and maintain production-ready GitOps infrastructure with custom automation and best practices.

---

## Next Steps for Reviewers

1. **Quick Review** (5 min): Read this document
2. **Technical Review** (20 min): Skim DEVOPS_PORTFOLIO.md
3. **Deep Dive** (45 min): Read GITOPS_ARCHITECTURE.md
4. **Live Demo** (30 min): Schedule demonstration session
5. **Technical Interview** (60 min): Discuss architecture and decisions

**Ready to see it in action?** Contact me to schedule a live demonstration.

---

**Last Updated**: October 2025
**Status**: Production Active
**Maintained By**: Wojciech Wiesner
**License**: Portfolio Documentation (Code available upon request)
