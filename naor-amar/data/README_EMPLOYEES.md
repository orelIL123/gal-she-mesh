# Employee Seed Data

This file contains the initial employee data for Naor Amar barbershop.

## File: employeeSeedData.json

Contains:
- Business name
- Total number of employees
- Employee details including:
  - Name
  - Phone number
  - Specialization
  - Experience (years)
  - Main barber status
  - Availability status
  - Barber ID (for database)
  - User ID (for authentication)

## Usage

Use this data to initialize the Firebase database with the seed script:

```bash
node scripts/seedData.js
```

Or manually add to Firestore through the Firebase Console.

