
# 🏢 Ekhaya Intel Trading - Business Management System

A comprehensive enterprise business management platform combining HR operations with customer relationship management capabilities.

## 🌟 Key Features

### 🧑‍💼 Human Resources
- Employee directory and management
- Leave request system with approval workflows
- Performance tracking and reviews
- Payroll processing
- Time tracking and attendance
- Recruitment and onboarding
- Document management

### 🚗 Customer Management
- Customer database and profiles
- Service booking system
- Analytics and reporting
- Customer communication tools
- Loyalty program management

### 💰 Financial Operations
- Daily business reporting
- Receipt generation and tracking
- Expense management
- Financial analytics
- Budget planning

### 🔐 Security Features
- Role-based access control
- Secure authentication
- Data encryption
- Audit trails

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Hervoli25/ekayacrm.git
   cd ekhaya_hr_app/app
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Configure your database connection
   - Set up authentication secrets
   - Configure other required environment variables

4. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Server**:
   ```bash
   yarn dev
   ```

6. **Access Application**:
   - Open [http://localhost:3000](http://localhost:3000)
   - Use the credentials provided after database seeding

## 🛠 Development

### Building for Production
```bash
yarn build
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db reset
```

## 🎨 Features
- Modern responsive design
- Dark/light theme support
- Interactive dashboards
- Real-time notifications
- Progressive Web App capabilities

## 🚀 Deployment

The application can be deployed on various platforms. Ensure your production environment has:
- PostgreSQL database
- Proper environment variables configured
- HTTPS enabled for security

## 📄 License & Copyright

**© 2024 Herve Tshombe (ELK) - All Rights Reserved**

This project is proprietary software developed for Ekhaya Intel Trading. Unauthorized copying, distribution, or modification is strictly prohibited.

---

*Professional business management solution built with modern technologies.*
