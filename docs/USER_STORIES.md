## **Epics & User Stories**

### **Epic 1: User Authentication & Authorization**
- **US-01**: As a user, I can register with username, email and password
- **US-02**: As a user, I can login to the system using email and password
- **US-03**: As a user, I can logout from the system
- **US-04**: As a user, I can recover my password if I forget it

### **Epic 2: Ticket Management**
- **US-05**: As a user, I can create a ticket with title, description, priority, status, and optional image
- **US-06**: As a user, I can view all tickets I've created
- **US-07**: As a user, I can view details of a specific ticket I created
- **US-08**: As an admin, I can modify the ticket's status

### **Epic 3: Comment System**
- **US-09**: As a user, I can add comments to my existing tickets
- **US-10**: As a user, I can view all comments on my tickets
- **US-11**: As an admin, I can comment on any ticket uploaded to the system

### **Epic 4: Admin Management**
- **US-12**: As an admin, I can perform CRUD operations on users
- **US-13**: As an admin, I can perform CRUD operations on all tickets
- **US-14**: As an admin, I can perform CRUD operations on all comments

### **Epic 5: Notifications**
- **US-015**: As an user, I can see notifications of comments and changed status over my tickets
- **US-016**: As an admin, I can see notifications of creation and comments over any ticket uploaded to the system

### **Epic 5: DevOps & Infrastructure**
- **US-017**: As a DevOps engineer, I can build and containerize the application
- **US-018**: As a DevOps engineer, I can monitor application health and logs
- **US-019**: As a DevOps engineer, I can deploy using CI/CD pipelines
- **US-020**: As a DevOps engineer, I can manage database migrations and backups

## Additional considerations
- Frontend: Vite + React + TypeScript + React Router + Tailwind CSS + Iconify + Toastify
- Backend: NestJS + JWT + PrismaORM
- Database: PostgreSQL
- DevOps: Docker + Makefile + Terraform + Ansible + Github Actions + AWS + Prometheus + Grafana
- Consider proposing libraries/dependencies/tools if required
- Kubernetes is not required, so isn't considered into this project