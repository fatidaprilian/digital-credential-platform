
# Digital Credential Platform

A blockchain-based platform that enables institutions to issue verifiable digital credentials as NFTs. The platform provides a complete ecosystem for credential issuance, verification, and management with support for multiple user roles including credential holders, institutional issuers, and platform administrators.

## 🏗️ Architecture

The platform uses a multi-tier containerized architecture with the following components:

- **Frontend**: Next.js application with Web3Auth integration (Port 3000)
- **Backend**: NestJS API with JWT authentication (Port 3001)
- **Database**: PostgreSQL with Prisma ORM (Port 5432)
- **Cache**: Redis for session management (Port 6379)
- **Blockchain**: Hardhat development node + Polygon Amoy testnet integration

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd digital-credential-platform
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

## 📁 Project Structure

```
digital-credential-platform/
├── frontend/           # Next.js frontend application
├── backend/           # NestJS backend API
├── smart-contract/    # Hardhat blockchain contracts
├── docker-compose.yml # Container orchestration
└── README.md         # This file
```

## 🛠️ Development

### Backend Development

The NestJS backend includes comprehensive features for credential management:

```bash
cd backend
npm run start:dev    # Development with hot reload
npm run build       # Production build
npm run test        # Run tests
```

Key backend dependencies include:
- **Blockchain**: ethers@6.15.0 for Ethereum/Polygon interactions
- **Storage**: pinata@2.4.9 for IPFS integration
- **Image Processing**: canvas@3.1.2, sharp@0.34.3 for credential generation
- **Authentication**: JWT with bcrypt password hashing
- **Database**: Prisma ORM with PostgreSQL

### Frontend Development

The Next.js frontend provides role-based interfaces:

```bash
cd frontend
npm run dev         # Development server
npm run build      # Production build
```

## 🔐 User Roles & Features

### Credential Holders (`/holder/*`)
- Web3Auth wallet authentication
- View credential gallery
- Share verifiable credentials
- Profile management

### Institutional Issuers (`/issuer/*`)
- JWT-based authentication
- Create credential templates
- Issue credentials to recipients
- Manage issuance history
- Credit-based billing system

### Platform Administrators (`/admin/*`)
- Institution approval workflow
- System monitoring
- User management

### Public Verification (`/verify`)
- Verify credential authenticity
- No authentication required

## 🔧 Key Technologies

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Web3Auth
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **Blockchain**: Ethereum/Polygon, Hardhat, ethers.js
- **Storage**: IPFS (Pinata), Local file storage
- **Authentication**: JWT, Web3Auth, bcrypt
- **Containerization**: Docker, Docker Compose

## 📊 Database Schema

The platform uses Prisma ORM with PostgreSQL, implementing a relational schema supporting:
- Multi-tenant institutions
- User role management
- Credential templates with IPFS storage
- Issuance logging and transaction history

## 🌐 Blockchain Integration

- **Development**: Local Hardhat node
- **Production**: Polygon Amoy testnet
- **Smart Contracts**: NFT-based credential issuance
- **Metadata Storage**: IPFS for decentralized credential data

## 🔄 Development Workflow

1. **Database Migrations**: Automatically handled via Prisma during container startup
2. **Hot Reload**: Both frontend and backend support live reloading
3. **Testing**: Comprehensive test suites for backend services
4. **Linting**: ESLint configuration for code quality

## 📝 API Documentation

The backend exposes RESTful APIs for:
- Authentication and user management
- Credential template creation
- Credential issuance and verification
- Institution management
- Payment processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License

Copyright (c) 2025 Tim VeritasID

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🆘 Support

For issues and questions:
- Review the API endpoints in the backend service
- Examine the frontend components for UI implementation details