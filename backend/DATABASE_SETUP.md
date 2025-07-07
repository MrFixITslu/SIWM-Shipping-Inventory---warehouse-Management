# Database Setup for Stock Analysis

This document explains how to set up the database for the enhanced stock analysis functionality.

## Prerequisites

- PostgreSQL database running
- Environment variables configured (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT)

## Setup Steps

1. **Run the database setup script:**

```bash
cd backend
node setup-database.js
```

This script will:
- Create the `system_settings` table for storing run rate configuration
- Add `safety_stock` column to `inventory_items` table
- Add `primary_vendor_id` column to `inventory_items` table with foreign key constraint
- Add `lead_time_days` column to `vendors` table
- Set default safety stock values for existing inventory items

## New Database Schema

### system_settings table
- `id`: Primary key
- `setting_key`: Unique setting identifier (e.g., 'run_rate')
- `weekly_installs`: Number of weekly installations (default: 66)
- `last_updated`: Timestamp of last update
- `source`: Source of the setting ('default', 'manual', 'dispatch_data')
- `created_at`: Creation timestamp

### inventory_items table (new columns)
- `safety_stock`: Minimum stock level before reorder (default: 20% of reorder_point or 10, whichever is higher)
- `primary_vendor_id`: Foreign key to vendors table for lead time lookup

### vendors table (new column)
- `lead_time_days`: Average lead time in days (default: 14)

## Stock Analysis Features

The enhanced dashboard now includes:

1. **Items Below Reorder Point**: Shows items with current quantity below their reorder point
2. **Items at Risk of Stock-Out**: Projects 6-month demand and identifies items at risk
3. **Run Rate Configuration**: Allows manual adjustment of weekly installation rate
4. **Lead Time Integration**: Uses vendor lead times for accurate stock-out projections

## Default Values

- Weekly run rate: 66 installs/week (11 installs/day × 6 days/week)
- Safety stock: 20% of reorder point or 10 units, whichever is higher
- Lead time: 14 days (if vendor doesn't specify)
- Demand variability: ±10%

## Usage

After setup, the dashboard will automatically:
- Calculate items below reorder point
- Project 6-month demand based on run rate
- Show stock-out risk with variability ranges
- Allow run rate updates through the UI 