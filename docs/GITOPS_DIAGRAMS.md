# GitOps Architecture Diagrams

This document contains visual diagrams of the GitOps infrastructure using Mermaid diagram syntax.

---

## 1. Infrastructure Architecture Overview

```mermaid
graph TB
    subgraph Internet
        Users[Users/Clients]
    end

    subgraph "Host Machine (borg.tools)"
        NginxProxy[nginx-proxy<br/>Docker Container<br/>:80, :443]

        subgraph "Docker Services"
            Portainer[Portainer<br/>:9000]
            Prometheus[Prometheus<br/>:9091]
            Grafana[Grafana<br/>:3000]
            Guacamole[Guacamole<br/>:8080]
            AgentZero[Agent-Zero<br/>:50001]
        end

        subgraph "Minikube Kubernetes Cluster"
            IngressController[ingress-nginx<br/>NodePort 32546/32648]

            subgraph "argocd Namespace"
                ArgoCD[ArgoCD Server]
                ArgoDex[Dex OAuth]
                ArgoRepo[Repo Server]
                ArgoRedis[Redis Cache]
                ArgoController[Application Controller]
            end

            subgraph "cert-manager Namespace"
                CertManager[cert-manager]
                CertWebhook[cert-manager-webhook]
                CertInjector[cert-manager-cainjector]
            end

            subgraph "default Namespace"
                WordPress[WordPress Pod<br/>InitContainer + App]
                MariaDB[MariaDB Pod]
                Nginx[Nginx Static]
            end

            subgraph "deployer Namespace"
                Deployer[Plugin Deployer<br/>FastAPI App]
            end

            subgraph "gitops-system Namespace"
                GitDaemon[Git Daemon<br/>Internal Git Server]
            end
        end
    end

    subgraph "External Services"
        LetsEncrypt[Let's Encrypt<br/>ACME Server]
        GitHub[GitHub<br/>Plugin Repositories]
    end

    Users -->|HTTPS :443| NginxProxy
    NginxProxy -->|:32648| IngressController

    IngressController -->|argocd.borg.tools| ArgoCD
    IngressController -->|borg.tools| Nginx
    IngressController -->|transcriptor.borg.tools| WordPress

    WordPress --> MariaDB
    WordPress -.->|Clone plugins| GitHub

    ArgoCD -->|Poll Git| GitDaemon
    Deployer -->|Update GitOps| GitDaemon

    CertManager -->|ACME HTTP-01| LetsEncrypt
    CertManager -->|Inject certs| IngressController

    ArgoController -->|Reconcile| WordPress
    ArgoController -->|Reconcile| Deployer

    Prometheus -.->|Scrape metrics| ArgoCD
    Prometheus -.->|Scrape metrics| CertManager
    Grafana -->|Query| Prometheus

    style ArgoCD fill:#326CE5
    style WordPress fill:#21759B
    style CertManager fill:#FF6B6B
    style Deployer fill:#4CAF50
    style GitDaemon fill:#F05032
```

---

## 2. GitOps Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitOps Repository
    participant ArgoCD as ArgoCD Controller
    participant K8s as Kubernetes API
    participant Pod as Application Pod

    Dev->>Git: 1. Commit manifest change
    Dev->>Git: 2. Push to main branch

    loop Every 3 minutes
        ArgoCD->>Git: 3. Poll for changes
    end

    ArgoCD->>Git: 4. Detect new commit
    ArgoCD->>ArgoCD: 5. Compare desired vs actual state

    alt Out of Sync
        ArgoCD->>K8s: 6. Apply manifest changes
        K8s->>Pod: 7. Create/Update pods
        Pod->>Pod: 8. Health checks
        Pod-->>K8s: 9. Ready
        K8s-->>ArgoCD: 10. Status: Healthy
        ArgoCD->>ArgoCD: 11. Mark as Synced
    else Already Synced
        ArgoCD->>ArgoCD: No action needed
    end

    Note over ArgoCD,Pod: Self-Healing Enabled

    alt Manual Change Detected
        K8s->>ArgoCD: Drift detected
        ArgoCD->>K8s: Revert to Git state
    end
```

---

## 3. Plugin Deployment Workflow

```mermaid
sequenceDiagram
    participant User as User (Web UI)
    participant Deployer as Deployer FastAPI
    participant GitHub as GitHub Repository
    participant GitOps as GitOps Repo (Git Daemon)
    participant ArgoCD as ArgoCD
    participant K8s as Kubernetes
    participant WP as WordPress Pod

    User->>Deployer: 1. Submit deployment form<br/>(repo, path, branch)

    Deployer->>GitHub: 2. Clone repository
    GitHub-->>Deployer: Repository files

    Deployer->>Deployer: 3. Validate plugin path exists

    alt Plugin not found
        Deployer-->>User: Error: Plugin path invalid
    else Plugin found
        Deployer->>GitOps: 4. Clone GitOps repo
        Deployer->>GitOps: 5. Update plugin-config.yaml
        Deployer->>GitOps: 6. Git commit + push

        Deployer-->>User: Success: Deployment queued

        Note over ArgoCD: Poll interval (max 3 min)

        ArgoCD->>GitOps: 7. Detect ConfigMap change
        ArgoCD->>K8s: 8. Update ConfigMap
        ArgoCD->>K8s: 9. Trigger pod restart

        K8s->>WP: 10. Terminate old pod
        K8s->>WP: 11. Create new pod

        WP->>WP: 12. Run InitContainer
        WP->>GitHub: 13. Clone plugin
        GitHub-->>WP: Plugin files
        WP->>WP: 14. Copy to /wp-content/plugins/

        WP->>WP: 15. Start WordPress container
        WP->>WP: 16. Health check passed

        WP-->>K8s: Ready
        K8s-->>ArgoCD: Sync complete
    end
```

---

## 4. ArgoCD Application Hierarchy

```mermaid
graph TD
    subgraph "ArgoCD Projects"
        DefaultProject[Default Project]
        WordPressProject[WordPress Project]
        PlatformProject[Platform Project]
    end

    subgraph "ArgoCD Applications"
        WordPressApp[wordpress Application]
        DeployerApp[plugin-deployer Application]
    end

    subgraph "GitOps Repository Structure"
        BaseDir[base/<br/>wordpress-stack.yaml<br/>plugin-config.yaml]
        EnvDir[environments/minikube/<br/>kustomization.yaml<br/>patches.yaml]
        AppsDir[apps/deployer/<br/>deployment.yaml<br/>service.yaml]
    end

    subgraph "Kubernetes Resources"
        subgraph "default namespace"
            WP[WordPress Deployment]
            MariaDB[MariaDB Deployment]
            WPService[WordPress Service]
            WPIngress[WordPress Ingress]
            WPConfig[Plugin ConfigMap]
        end

        subgraph "deployer namespace"
            DeployerDeploy[Deployer Deployment]
            DeployerService[Deployer Service]
        end
    end

    WordPressProject --> WordPressApp
    PlatformProject --> DeployerApp

    WordPressApp -->|source: environments/minikube| EnvDir
    EnvDir -->|base| BaseDir

    DeployerApp -->|source: apps/deployer| AppsDir

    WordPressApp -->|manages| WP
    WordPressApp -->|manages| MariaDB
    WordPressApp -->|manages| WPService
    WordPressApp -->|manages| WPIngress
    WordPressApp -->|manages| WPConfig

    DeployerApp -->|manages| DeployerDeploy
    DeployerApp -->|manages| DeployerService

    style WordPressApp fill:#326CE5
    style DeployerApp fill:#4CAF50
    style BaseDir fill:#FFE066
    style EnvDir fill:#FFB84D
```

---

## 5. SSL Certificate Automation Flow

```mermaid
sequenceDiagram
    participant Ingress as Ingress Resource
    participant CertManager as cert-manager
    participant ACME as Let's Encrypt ACME
    participant IngressCtrl as ingress-nginx
    participant Secret as Kubernetes Secret

    Note over Ingress: Ingress created with<br/>cert-manager.io/cluster-issuer annotation

    Ingress->>CertManager: 1. Ingress event detected
    CertManager->>CertManager: 2. Parse annotations
    CertManager->>CertManager: 3. Create Certificate resource

    CertManager->>ACME: 4. Request certificate<br/>(HTTP-01 challenge)
    ACME-->>CertManager: Challenge details

    CertManager->>IngressCtrl: 5. Create challenge ingress<br/>/.well-known/acme-challenge/

    ACME->>IngressCtrl: 6. Verify challenge URL
    IngressCtrl-->>ACME: Challenge response

    alt Challenge Success
        ACME->>ACME: Validate domain ownership
        ACME-->>CertManager: Certificate issued

        CertManager->>Secret: 7. Store cert in Secret<br/>(tls.crt, tls.key)
        CertManager->>Ingress: 8. Update ingress status

        IngressCtrl->>Secret: 9. Read TLS certificate
        IngressCtrl->>IngressCtrl: 10. Configure SSL

        Note over IngressCtrl: HTTPS now active
    else Challenge Failed
        ACME-->>CertManager: Challenge failed
        CertManager->>CertManager: Retry with backoff
    end

    Note over CertManager: Certificate renewal<br/>(30 days before expiry)

    loop Every 12 hours
        CertManager->>Secret: Check certificate expiry
        alt Expiring soon
            CertManager->>ACME: Renew certificate
        end
    end
```

---

## 6. Network Traffic Flow

```mermaid
graph LR
    subgraph "Internet"
        Client[Web Client]
    end

    subgraph "Host Network (borg.tools)"
        HostIP[Public IP<br/>borg.tools]
        NginxProxy[nginx-proxy<br/>:80, :443]
    end

    subgraph "Minikube VM"
        MinikubeIP[Minikube IP<br/>192.168.49.2]

        subgraph "NodePort Services"
            NodePort80[NodePort :32546<br/>HTTP]
            NodePort443[NodePort :32648<br/>HTTPS]
        end

        subgraph "ingress-nginx"
            IngressCtrl[Ingress Controller<br/>Service: ClusterIP]
            IngressPod[Ingress Pod<br/>nginx process]
        end

        subgraph "Services"
            ArgoService[argocd-server<br/>ClusterIP :80]
            WPService[wordpress<br/>ClusterIP :80]
            NginxService[nginx-service<br/>ClusterIP :80]
        end

        subgraph "Pods"
            ArgoPod[argocd-server Pod<br/>:8080]
            WPPod[wordpress Pod<br/>:80]
            NginxPod[nginx Pod<br/>:80]
        end
    end

    Client -->|1. HTTPS :443| HostIP
    HostIP --> NginxProxy
    NginxProxy -->|2. Forward :443| MinikubeIP
    MinikubeIP --> NodePort443
    NodePort443 -->|3. Route| IngressCtrl
    IngressCtrl --> IngressPod

    IngressPod -->|4. Host: argocd.borg.tools| ArgoService
    IngressPod -->|4. Host: transcriptor.borg.tools| WPService
    IngressPod -->|4. Host: borg.tools| NginxService

    ArgoService -->|5. Proxy| ArgoPod
    WPService -->|5. Proxy| WPPod
    NginxService -->|5. Proxy| NginxPod

    style Client fill:#E8F5E9
    style NginxProxy fill:#FFF3E0
    style IngressPod fill:#E3F2FD
    style ArgoPod fill:#326CE5,color:#fff
    style WPPod fill:#21759B,color:#fff
```

---

## 7. Disaster Recovery Flow

```mermaid
graph TD
    Start[Disaster Detected] --> Type{Failure Type?}

    Type -->|ArgoCD Crash| ArgoRecovery[ArgoCD Recovery]
    Type -->|Cluster Loss| ClusterRecovery[Cluster Recovery]
    Type -->|Git Corruption| GitRecovery[Git Recovery]
    Type -->|Pod Crash| PodRecovery[Pod Recovery]

    ArgoRecovery --> ArgoStep1[Reinstall ArgoCD]
    ArgoStep1 --> ArgoStep2[Apply Application manifests]
    ArgoStep2 --> ArgoStep3[ArgoCD syncs from Git]
    ArgoStep3 --> Verify[Verify Services]

    ClusterRecovery --> ClusterStep1[Provision new Minikube]
    ClusterStep1 --> ClusterStep2[Install cert-manager]
    ClusterStep2 --> ClusterStep3[Install ingress-nginx]
    ClusterStep3 --> ClusterStep4[Install ArgoCD]
    ClusterStep4 --> ClusterStep5[Deploy Git daemon]
    ClusterStep5 --> ClusterStep6[Apply ArgoCD apps]
    ClusterStep6 --> ClusterStep7[Restore PVC data]
    ClusterStep7 --> Verify

    GitRecovery --> GitStep1[Restore from GitHub backup]
    GitStep1 --> GitStep2[Restart Git daemon]
    GitStep2 --> GitStep3[Force ArgoCD sync]
    GitStep3 --> Verify

    PodRecovery --> PodStep1[Check pod logs]
    PodStep1 --> PodStep2{Self-heal enabled?}
    PodStep2 -->|Yes| PodStep3[ArgoCD restarts pod]
    PodStep2 -->|No| PodStep4[Manual kubectl restart]
    PodStep3 --> Verify
    PodStep4 --> Verify

    Verify --> Status{All healthy?}
    Status -->|Yes| Success[Recovery Complete]
    Status -->|No| Debug[Debug & Troubleshoot]
    Debug --> Verify

    style Start fill:#FF6B6B
    style Success fill:#4CAF50,color:#fff
    style Verify fill:#2196F3,color:#fff
```

---

## 8. Kustomize Build Process

```mermaid
graph TD
    subgraph "Developer Action"
        DevCommit[Developer commits to<br/>environments/minikube/]
    end

    subgraph "Kustomize Build Process"
        KustomizeEntry[kustomization.yaml entry point]

        KustomizeEntry --> LoadBase[Load base resources]
        LoadBase --> Base1[wordpress-stack.yaml]
        LoadBase --> Base2[plugin-config.yaml]

        KustomizeEntry --> LoadPatches[Load patches]
        LoadPatches --> Patch1[patches.yaml]

        KustomizeEntry --> LoadTransformations[Load transformations]
        LoadTransformations --> Trans1[commonLabels]
        LoadTransformations --> Trans2[namespace]
        LoadTransformations --> Trans3[replicas]

        Base1 --> Merge[Merge & Transform]
        Base2 --> Merge
        Patch1 --> Merge
        Trans1 --> Merge
        Trans2 --> Merge
        Trans3 --> Merge

        Merge --> Output[Final YAML output]
    end

    subgraph "ArgoCD Application"
        Output --> ArgoApply[ArgoCD applies to cluster]
        ArgoApply --> K8sAPI[Kubernetes API]
        K8sAPI --> Resources[Created/Updated Resources]
    end

    DevCommit --> KustomizeEntry

    style DevCommit fill:#4CAF50,color:#fff
    style Merge fill:#FF9800,color:#fff
    style Output fill:#2196F3,color:#fff
```

---

## 9. Monitoring Architecture

```mermaid
graph TB
    subgraph "Data Sources"
        K8sPods[Kubernetes Pods<br/>Application Metrics]
        ArgoMetrics[ArgoCD Metrics<br/>:8082/metrics]
        CertMetrics[cert-manager Metrics<br/>:9402/metrics]
        IngressMetrics[ingress-nginx Metrics<br/>:10254/metrics]
        NodeExporter[Node Exporter<br/>System Metrics]
    end

    subgraph "Monitoring Stack"
        Prometheus[Prometheus<br/>:9091]
        PromStorage[(TSDB Storage<br/>15 day retention)]

        Grafana[Grafana<br/>:3000]
        GrafanaDB[(SQLite Database<br/>Dashboard configs)]
    end

    subgraph "Visualization"
        Dashboard1[Kubernetes Cluster<br/>Dashboard]
        Dashboard2[ArgoCD Application<br/>Dashboard]
        Dashboard3[SSL Certificates<br/>Dashboard]
    end

    K8sPods -->|Scrape :9090| Prometheus
    ArgoMetrics -->|Scrape| Prometheus
    CertMetrics -->|Scrape| Prometheus
    IngressMetrics -->|Scrape| Prometheus
    NodeExporter -->|Scrape| Prometheus

    Prometheus -->|Write| PromStorage
    PromStorage -->|Read| Prometheus

    Grafana -->|PromQL queries| Prometheus
    Grafana -->|Read/Write| GrafanaDB

    Grafana --> Dashboard1
    Grafana --> Dashboard2
    Grafana --> Dashboard3

    style Prometheus fill:#E6522C,color:#fff
    style Grafana fill:#F46800,color:#fff
```

---

## 10. Security Layers

```mermaid
graph TB
    subgraph "External Threats"
        Internet[Internet Attackers]
    end

    subgraph "Security Layer 1: Network"
        Firewall[Host Firewall<br/>Only :80, :443 open]
        NginxProxy[nginx-proxy<br/>Reverse proxy]
    end

    subgraph "Security Layer 2: Ingress"
        IngressCtrl[ingress-nginx<br/>SSL Termination]
        CertManager[cert-manager<br/>Valid SSL certs]
        ForceHTTPS[Force HTTPS<br/>Redirect]
    end

    subgraph "Security Layer 3: Kubernetes"
        RBAC[Kubernetes RBAC<br/>Namespace isolation]
        NetPol[Network Policies<br/>Future]
        ClusterIP[Services: ClusterIP<br/>Internal only]
    end

    subgraph "Security Layer 4: Application"
        Secrets[Kubernetes Secrets<br/>Not in Git]
        EnvVars[Environment Variables<br/>Sensitive data]
        ArgoDex[ArgoCD Dex<br/>OAuth/SSO]
    end

    subgraph "Security Layer 5: GitOps"
        GitInternal[Git Daemon<br/>Cluster-internal only]
        GitAudit[Git Audit Trail<br/>All changes tracked]
        SelfHeal[ArgoCD Self-Heal<br/>Revert unauthorized changes]
    end

    Internet -->|Attack| Firewall
    Firewall -->|Filter| NginxProxy
    NginxProxy -->|Proxy| IngressCtrl

    IngressCtrl --> CertManager
    IngressCtrl --> ForceHTTPS

    IngressCtrl -->|Authenticated| RBAC
    RBAC --> NetPol
    RBAC --> ClusterIP

    ClusterIP -->|Access| Secrets
    Secrets --> EnvVars
    EnvVars --> ArgoDex

    ArgoDex -->|Deploy| GitInternal
    GitInternal --> GitAudit
    GitAudit --> SelfHeal

    style Internet fill:#FF6B6B
    style Firewall fill:#FFA726,color:#000
    style IngressCtrl fill:#66BB6A,color:#fff
    style RBAC fill:#42A5F5,color:#fff
    style Secrets fill:#AB47BC,color:#fff
    style GitInternal fill:#26A69A,color:#fff
```

---

## Usage Notes

### Viewing These Diagrams

**GitHub/GitLab**: Mermaid diagrams render automatically in markdown files.

**VS Code**: Install "Markdown Preview Mermaid Support" extension.

**Online**: Copy-paste to https://mermaid.live/ for interactive editing.

**Export**: Use Mermaid CLI or online tools to export as PNG/SVG.

### Diagram Types Used

- **Graph TB/LR**: Top-to-Bottom or Left-to-Right flowcharts
- **Sequence Diagram**: Time-based interaction flows
- **Subgraphs**: Logical groupings (namespaces, services)

### Customization

Feel free to:
- Modify colors (fill, color properties)
- Add/remove components
- Adjust layout (TB, LR, RL, BT)
- Export for presentations

---

**Last Updated**: October 2025
**Created By**: Wojciech Wiesner
**Part Of**: GitOps Portfolio Documentation
