# DFMRT Medicine Tracker

A comprehensive medication and equipment management system for Mountain Rescue Teams, specifically designed for the Duddon and Furness Mountain Rescue Team.

## 🏔️ Project Overview

DFMRT Medicine Tracker is a web-based application that helps Mountain Rescue Teams manage their medical supplies, track expiry dates, monitor stock levels, and organize equipment across different response vehicles and kits. The system is built with modern web technologies and provides a user-friendly interface for managing critical medical resources.

### Key Features

- **📊 Real-time Dashboard** - Overview of expiring items, low stock alerts, and key metrics
- **💊 Inventory Management** - Complete medicine tracking with batch management
- **🎒 Kit Organization** - Hierarchical organization of equipment across vehicles and kits
- **📈 Stock Operations** - Receive, transfer, and manage stock levels
- **📋 Reports & Analytics** - Generate reports and export data
- **🔍 Search & Filter** - Advanced search and filtering capabilities
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/danielkinguk/dfmrt-medicine-tracker.git
cd dfmrt-medicine-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Technology Stack

- **Frontend**: React 18.3.1 + TypeScript 5.6.2
- **Build Tool**: Vite 5.4.10
- **Styling**: TailwindCSS 3.4.17
- **Database**: IndexedDB (via Dexie.js 4.2.0)
- **Routing**: React Router DOM 6.30.1
- **Icons**: Lucide React 0.542.0

## 📊 Current Status

### ✅ Completed Features
- Core application infrastructure
- Dashboard with real-time metrics
- Inventory management interface
- Kit organization system
- Stock operations forms
- Database with MREW formulary data
- Responsive UI design
- Search and filtering capabilities

### 🟦 In Progress
- Enhanced error handling for different environments
- Debug tools for troubleshooting
- Additional stock operation workflows

### 📋 Planned Features
- PDF report generation
- Multi-device synchronization
- Advanced analytics
- Backup/restore functionality

## 🗄️ Data Structure

The application manages the following entities:

- **Medicines**: 21 items from MREW formulary
- **Batches**: Lot tracking with expiry dates
- **Items**: Individual units with location tracking
- **Locations**: Hierarchical structure (Base → Vehicle → Kit → Pouch)
- **Movements**: Stock transfer history
- **Users**: Access control and audit trails

### Location Hierarchy
```
Base (Duddon and Furness MRT)
├── Drug Safe
├── Store
├── DM 1
│   ├── DM 1 Red Bag
│   └── DM 1 Blue Bag
└── DM 2
    ├── DM 2 Red Bag
    └── DM 2 Blue Bag
```

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # Business logic and data access
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Database Management

The application uses IndexedDB for local storage. To reset the database:

1. Click "Reset Data" in the navigation bar
2. Confirm the action
3. The database will be cleared and reseeded with fresh data

## 🐛 Debugging

A debug panel is available in the application (red "Debug" button in bottom-right corner) that provides:

- Environment information
- Database connection status
- Browser capabilities
- Storage availability

This is particularly useful for troubleshooting issues in different environments like CodeSandbox.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and intended for use by the Duddon and Furness Mountain Rescue Team.

## 🤝 Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Version**: 0.1.17  
**Last Updated**: 2025-08-30  
**Status**: Active Development  
**Team**: Duddon and Furness Mountain Rescue Team
