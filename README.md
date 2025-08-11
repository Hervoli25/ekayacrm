
# Ekhaya CRM - HR Management System

A comprehensive HR and Finance management web application built with Next.js 14, featuring employee management, leave requests, financial tracking, and role-based access control.

## 🌟 Features

### Core HR Features
- **Employee Directory**: Complete CRUD operations for employee management
- **Leave Management**: Advanced leave request system with approval workflows
- **Role-Based Access Control**: Super Admin, Admin, Manager, and Employee roles
- **Authentication**: Secure login/registration system with NextAuth.js

### Finance Management
- **Daily Business Reports Dashboard**: Track daily business metrics
- **Receipt Management**: Generate and manage business receipts
- **Employee Performance Tracking**: Monitor and evaluate employee performance
- **Expense Management**: Track and approve company expenses
- **Financial Analytics**: Comprehensive financial reporting and analytics

### Technical Features
- Modern responsive UI with Tailwind CSS and shadcn/ui
- PostgreSQL database with Prisma ORM
- TypeScript for type safety
- Server-side rendering with Next.js 14
- Toast notifications for user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

### Installation

1. **Extract and navigate to the project**:
   ```bash
   unzip ekhaya_hr_app_source.zip
   cd ekhaya_hr_app/app
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Set up environment variables**:
   - The `.env` file is already configured with the necessary variables
   - Update `DATABASE_URL` if needed for your PostgreSQL setup

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database with initial data
   npx prisma db seed
   ```

5. **Start the development server**:
   ```bash
   yarn dev
   ```

6. **Access the application**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## 👥 Default Admin Credentials

After seeding the database, you can log in with these super admin credentials:

- **Email**: admin@ekhayaintel.com
- **Password**: EkhayaIntelAdmin2024!

The system also includes 3 additional director accounts with super admin privileges.

## 🏗 Project Structure

```
ekhaya_hr_app/app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── employees/         # Employee management
│   ├── finance/           # Finance management
│   ├── leave-requests/    # Leave management
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── employees/         # Employee components
│   ├── finance/           # Finance components
│   ├── leave-requests/    # Leave request components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
├── prisma/               # Database schema and migrations
├── scripts/              # Database seed scripts
└── types/                # TypeScript type definitions
```

## 🔐 User Roles & Permissions

### Super Admin
- Full system access
- Manage all users and roles
- Access to all finance features
- System administration

### Admin
- Employee management
- Leave request approvals
- Basic finance access
- User management (limited)

### Manager  
- Team employee management
- Leave approvals for team
- Department finance access
- Performance reviews

### Employee
- View own profile
- Submit leave requests
- View personal dashboard
- Submit expense reports

## 🛠 Development

### Building for Production
```bash
yarn build
```

### Running Tests
```bash
yarn lint
```

### Database Management
```bash
# Reset database
npx prisma db reset

# View database in Prisma Studio
npx prisma studio
```

## 📊 Key Components

### Employee Management
- **Employee Directory**: `/employees`
- **Enhanced Employee Modal**: Full CRUD with validation
- **Role-based employee views**: Different access levels

### Leave Management  
- **Leave Request System**: `/leave-requests`
- **Approval Workflow**: Multi-level approval process
- **Leave Analytics**: Track leave patterns

### Finance Management
- **Finance Dashboard**: `/finance`
- **Daily Reports**: `/finance/reports`
- **Receipt Generator**: `/finance/receipts`
- **Expense Tracking**: Integrated expense management

## 🔧 Configuration

### Database Configuration
The application uses PostgreSQL with Prisma ORM. The schema includes:
- User management with roles
- Employee profiles
- Leave requests with approval chains
- Financial records and reporting
- Performance tracking

### Authentication
NextAuth.js handles authentication with:
- Secure password hashing with bcrypt
- Role-based session management
- Protected routes and API endpoints

## 🎨 UI/UX Features
- Modern dark/light theme support
- Responsive design for all devices
- Interactive dashboards with charts
- Form validation with proper error handling
- Toast notifications for user feedback
- Loading states and error boundaries

## 📈 Analytics & Reporting
- Employee performance metrics
- Leave usage analytics  
- Financial reporting dashboards
- Expense tracking and approval workflows
- Daily business activity reports

## 🚀 Deployment

The application is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- DigitalOcean App Platform

Ensure your production environment has:
- PostgreSQL database
- Proper environment variables
- HTTPS enabled for authentication

## 🤝 Support

This is a comprehensive HR and Finance management system built for Ekhaya Intel Trading. The application provides enterprise-level features with a modern, intuitive interface.

For questions or issues, refer to the component documentation or check the API routes for backend functionality.

## 📄 License

This project is built for Ekhaya Intel Trading and contains proprietary business logic and components.
