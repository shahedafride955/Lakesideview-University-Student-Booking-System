# Supabase Setup Instructions

This document describes the database schema and data you need to populate in Supabase for the Lakeside University Resource Dashboard to work properly.

## Database Schema

The schema is already defined in your Supabase database:

### Tables

1. **resources** - Stores campus resources (study rooms, computer labs, equipment, meeting rooms)
2. **users** - Stores user accounts
3. **bookings** - Stores resource reservations
4. **historical_usage** - Stores occupancy data over time

## Required Data

### 1. Users Table

You need at least 3 users matching the login page quick-login options:

```sql
INSERT INTO users (id, name, email) VALUES
('USR-001', 'Sarah Johnson', 'sarah.johnson@lakeside.edu'),
('USR-002', 'John Smith', 'john.smith@lakeside.edu'),
('USR-003', 'Emily Davis', 'emily.davis@lakeside.edu');
```

**Login Credentials:**
- User ID field: Can use `name` (e.g., "Sarah Johnson") or `id` (e.g., "USR-001")
- Password field: User's `email` (e.g., "sarah.johnson@lakeside.edu")

### 2. Resources Table

You need to add campus resources. Here's an example:

```sql
INSERT INTO resources (id, name, type, capacity, building, floor, features, image_url, is_active) VALUES
('RES-001', 'Study Room 101', 'study-room', 6, 'Library West', '1st Floor', '{Whiteboard, TV Display, Power Outlets}', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', true),
('RES-002', 'Computer Lab A', 'computer-lab', 30, 'Tech Center', '3rd Floor', '{High-Performance PCs, Dual Monitors, Printing Available}', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', true),
('RES-003', 'VR Equipment Set', 'equipment', 3, 'Tech Center', '1st Floor', '{VR Headsets, Controllers, Laptop}', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800', true),
('RES-004', 'Conference Room A', 'meeting-room', 12, 'Student Union', '4th Floor', '{Video Conferencing, Whiteboard, Projector}', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800', true);
```

**Resource Types:** `study-room`, `computer-lab`, `equipment`, `meeting-room`

**Features Format:** PostgreSQL array syntax `{Feature1, Feature2, Feature3}`

### 3. Historical Usage Data

To display charts and analytics, add historical occupancy data:

```sql
-- Example: Add occupancy data for the past 7 days
-- You'll need to generate data for each resource at different hours
INSERT INTO historical_usage (id, resource_id, recorded_at, occupancy_count) VALUES
('H-0001', 'RES-001', '2026-02-11 09:00:00+00', 2),
('H-0002', 'RES-001', '2026-02-11 10:00:00+00', 4),
('H-0003', 'RES-001', '2026-02-11 14:00:00+00', 6),
-- Add more entries for different times and resources
...
```

**Tips for Historical Data:**
- Add entries for hours 8-22 (8 AM - 10 PM)
- Add data for the past 7 days
- Vary occupancy throughout the day (higher during 2-6 PM)
- Keep occupancy_count <= resource capacity

### 4. Bookings (Optional Initial Data)

You can add some test bookings:

```sql
INSERT INTO bookings (id, resource_id, user_id, start_time, end_time, status) VALUES
('B-0001', 'RES-001', 'USR-001', '2026-02-13 14:00:00+00', '2026-02-13 16:00:00+00', 'confirmed'),
('B-0002', 'RES-002', 'USR-002', '2026-02-14 10:00:00+00', '2026-02-14 12:00:00+00', 'confirmed');
```

## Environment Variables

The `.env` file has been created with your Supabase credentials:

```
VITE_SUPABASE_URL=https://tplqxqjexqxixertwpvt.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_uppmHqGxBYJku1m8qQapmQ_9CH6Bh9j
```

## Application Features

Once data is populated:

1. **Login** - Users can log in using name/ID + email
2. **Dashboard** - Shows all resources with real-time availability
3. **Resource Details** - Click any resource to see details and book
4. **Analytics** - View usage patterns and statistics
5. **My Bookings** - User-specific booking management

## Data Flow

- **Real-time Occupancy**: Fetched from the most recent `historical_usage` entry
- **Bookings**: Created via the booking modal, stored in `bookings` table
- **Analytics**: Calculated from `historical_usage` data over the past 7 days

## Quick Start

1. Populate `users` table with at least 3 users
2. Add at least 5-10 resources to `resources` table
3. Generate historical usage data for charts to display
4. (Optional) Add some sample bookings
5. Log in with any user credentials and test the app!
