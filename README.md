# Lakesideview University Student Booking System

A comprehensive resource visibility and booking dashboard designed to help students at Lakesideview University efficiently manage their study time and campus resources.

## 🚀 About The Project

This application solves the common problem of finding available study spaces on campus. It provides real-time data on the occupancy of study rooms, computer labs, and conference rooms, allowing students to book resources in advance and view historical usage trends to avoid peak hours.

## ✨ Key Features

- **Real-Time Dashboard**: Instantly view the availability status of all campus resources.
    - 🟢 **Available**: < 70% occupancy
    - 🟡 **Busy**: 70-99% occupancy
    - 🔴 **Full**: 100% occupancy
- **Resource Booking**: Reserve specific rooms or labs for your study sessions.
- **Analytics & Insights**:
    - **Snapshot Analytics**: Check occupancy for specific dates and times.
    - **Peak Times**: View average occupancy by hour and day to find the quietest times to study.
    - **Top Resources**: See which rooms are most popular.
- **My Bookings**: A dedicated section to manage your active, upcoming, and past reservations.
- **Detailed Resource Views**: See features, location, and historical usage patterns for individual rooms.

## 🛠️ Technology Stack

- **Frontend**: React (TypeScript)
- **Styling**: Tailwind CSS
- **Charts/Visualization**: Recharts
- **Icons**: Lucide React
- **Backend/Database**: Supabase

## 📖 How It Works

1.  **Login**: Students sign in using their university credentials (or demo accounts).
2.  **Browse**: The dashboard shows a list of resources with live occupancy bars.
3.  **Analyze**: Students can check the "Peak Booking Times" or "Analytics" pages to decide when to visit.
4.  **Book**: Click on a resource to view details and make a reservation.
5.  **Manage**: View and cancel bookings in the "My Bookings" tab.

## 🎓 How It Helps Students

- **Saves Time**: Eliminates the need to physically wander between buildings searching for an empty seat.
- **Better Planning**: Allows students to secure study spots during exam seasons or group projects.
- **Avoid Crowds**: Data visualization helps students identify off-peak hours for a quieter study environment.

## 💻 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🔐 Demo Credentials

For testing purposes, you can use the Quick Login feature on the login page, or use the following credentials:

- **User ID**: `USR-001` (or `User 1`)
- **Password**: `u1@lakeside.edu`