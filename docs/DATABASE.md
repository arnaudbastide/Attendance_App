# Database Schema Documentation

## Overview

The Roc4Tech Attendance system uses PostgreSQL as the primary database with Sequelize ORM. The database schema is designed to support multi-tenant attendance tracking with comprehensive audit trails.

## Database Schema

### Users Table

Stores user account information and profile data.

```sql
CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) DEFAULT 'employee',
    "department" VARCHAR(50),
    "position" VARCHAR(100),
    "phone" VARCHAR(20),
    "profileImage" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP,
    "managerId" UUID REFERENCES "Users"("id"),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `email` (unique)
- `managerId`
- `role`
- `department`

### Attendance Table

Stores attendance records with clock in/out times.

```sql
CREATE TABLE "Attendances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "clockIn" TIMESTAMP NOT NULL,
    "clockOut" TIMESTAMP,
    "date" DATE NOT NULL,
    "locationIn" JSONB,
    "locationOut" JSONB,
    "status" VARCHAR(20) DEFAULT 'present',
    "totalHours" DECIMAL(10,2),
    "overtimeHours" DECIMAL(10,2) DEFAULT 0,
    "notes" TEXT,
    "approvedBy" UUID REFERENCES "Users"("id"),
    "isApproved" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `userId`
- `date`
- `status`
- `userId, date` (composite)

### Leave Table

Manages leave requests and approvals.

```sql
CREATE TABLE "Leaves" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "leaveType" VARCHAR(20) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending',
    "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP,
    "approvedBy" UUID REFERENCES "Users"("id"),
    "comments" TEXT,
    "attachment" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `userId`
- `status`
- `startDate, endDate` (composite)
- `userId, status` (composite)

### Break Table

Tracks employee breaks during work hours.

```sql
CREATE TABLE "Breaks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "attendanceId" UUID NOT NULL REFERENCES "Attendances"("id") ON DELETE CASCADE,
    "breakStart" TIMESTAMP NOT NULL,
    "breakEnd" TIMESTAMP,
    "breakType" VARCHAR(20) DEFAULT 'lunch',
    "totalBreakTime" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `userId`
- `attendanceId`
- `userId, attendanceId` (composite)

## Relationships

### User Relationships
- **Self-referential**: Users can have managers (`managerId` → `Users.id`)
- **One-to-many**: User has many attendance records
- **One-to-many**: User has many leave requests
- **One-to-many**: User has many breaks

### Attendance Relationships
- **Many-to-one**: Attendance belongs to user
- **One-to-many**: Attendance has many breaks

### Leave Relationships
- **Many-to-one**: Leave belongs to user
- **Many-to-one**: Leave approved by user (nullable)

### Break Relationships
- **Many-to-one**: Break belongs to user
- **Many-to-one**: Break belongs to attendance

## Data Types and Constraints

### User Roles
- `admin` - System administrator
- `manager` - Department manager
- `employee` - Regular employee

### Attendance Status
- `present` - Employee was present
- `absent` - Employee was absent
- `late` - Employee arrived late
- `early_leave` - Employee left early
- `on_leave` - Employee was on approved leave

### Leave Types
- `annual` - Annual vacation leave
- `sick` - Sick leave
- `personal` - Personal leave
- `maternity` - Maternity leave
- `paternity` - Paternity leave
- `bereavement` - Bereavement leave
- `unpaid` - Unpaid leave

### Leave Status
- `pending` - Awaiting approval
- `approved` - Approved by manager
- `rejected` - Rejected by manager
- `cancelled` - Cancelled by employee

### Break Types
- `lunch` - Lunch break
- `coffee` - Coffee break
- `personal` - Personal break
- `meeting` - Meeting break

## Database Functions

### Calculate Total Hours
```sql
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."clockOut" IS NOT NULL THEN
        NEW."totalHours" := EXTRACT(EPOCH FROM (NEW."clockOut" - NEW."clockIn")) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Update Attendance Status
```sql
CREATE OR REPLACE FUNCTION update_attendance_status()
RETURNS TRIGGER AS $$
DECLARE
    work_start TIME := '09:00:00';
    work_end TIME := '17:00:00';
    late_threshold INTEGER := 15;
    early_threshold INTEGER := 15;
BEGIN
    -- Calculate status based on clock in time
    IF NEW."clockIn"::TIME > (work_start + INTERVAL '15 minutes') THEN
        NEW."status" := 'late';
    END IF;
    
    -- Calculate status based on clock out time
    IF NEW."clockOut" IS NOT NULL AND NEW."clockOut"::TIME < (work_end - INTERVAL '15 minutes') THEN
        NEW."status" := 'early_leave';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Attendance Triggers
```sql
-- Calculate total hours
CREATE TRIGGER calculate_attendance_hours
    BEFORE UPDATE ON "Attendances"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_hours();

-- Update attendance status
CREATE TRIGGER update_attendance_status
    BEFORE INSERT OR UPDATE ON "Attendances"
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();
```

### Leave Triggers
```sql
-- Calculate total days
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW."totalDays" := (NEW."endDate" - NEW."startDate") + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_leave_total_days
    BEFORE INSERT OR UPDATE ON "Leaves"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_days();
```

### Break Triggers
```sql
-- Calculate break duration
CREATE OR REPLACE FUNCTION calculate_break_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."breakEnd" IS NOT NULL THEN
        NEW."totalBreakTime" := EXTRACT(EPOCH FROM (NEW."breakEnd" - NEW."breakStart")) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_break_time
    BEFORE UPDATE ON "Breaks"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_break_duration();
```

## Views

### Attendance Summary View
```sql
CREATE VIEW attendance_summary AS
SELECT 
    a."userId",
    u."name" as employee_name,
    u."department",
    a."date",
    a."clockIn",
    a."clockOut",
    a."totalHours",
    a."status",
    a."isApproved",
    COUNT(b.id) as break_count,
    SUM(b."totalBreakTime") as total_break_time
FROM "Attendances" a
JOIN "Users" u ON a."userId" = u.id
LEFT JOIN "Breaks" b ON a.id = b."attendanceId"
GROUP BY a.id, u.id;
```

### Leave Balance View
```sql
CREATE VIEW leave_balance AS
SELECT 
    u.id as "userId",
    u."name",
    u."department",
    21 as annual_leave_total,
    10 as sick_leave_total,
    5 as personal_leave_total,
    
    -- Calculate used leaves
    (SELECT COALESCE(SUM("totalDays"), 0) 
     FROM "Leaves" 
     WHERE "userId" = u.id 
     AND "leaveType" = 'annual' 
     AND "status" = 'approved' 
     AND EXTRACT(YEAR FROM "startDate") = EXTRACT(YEAR FROM CURRENT_DATE)
    ) as annual_leave_used,
    
    (SELECT COALESCE(SUM("totalDays"), 0) 
     FROM "Leaves" 
     WHERE "userId" = u.id 
     AND "leaveType" = 'sick' 
     AND "status" = 'approved' 
     AND EXTRACT(YEAR FROM "startDate") = EXTRACT(YEAR FROM CURRENT_DATE)
    ) as sick_leave_used,
    
    (SELECT COALESCE(SUM("totalDays"), 0) 
     FROM "Leaves" 
     WHERE "userId" = u.id 
     AND "leaveType" = 'personal' 
     AND "status" = 'approved' 
     AND EXTRACT(YEAR FROM "startDate") = EXTRACT(YEAR FROM CURRENT_DATE)
    ) as personal_leave_used
    
FROM "Users" u
WHERE u."isActive" = true;
```

## Indexes

### Performance Indexes
```sql
-- User indexes
CREATE INDEX idx_users_email ON "Users"("email");
CREATE INDEX idx_users_manager ON "Users"("managerId");
CREATE INDEX idx_users_role ON "Users"("role");
CREATE INDEX idx_users_department ON "Users"("department");
CREATE INDEX idx_users_active ON "Users"("isActive");

-- Attendance indexes
CREATE INDEX idx_attendance_user ON "Attendances"("userId");
CREATE INDEX idx_attendance_date ON "Attendances"("date");
CREATE INDEX idx_attendance_status ON "Attendances"("status");
CREATE INDEX idx_attendance_user_date ON "Attendances"("userId", "date");

-- Leave indexes
CREATE INDEX idx_leaves_user ON "Leaves"("userId");
CREATE INDEX idx_leaves_status ON "Leaves"("status");
CREATE INDEX idx_leaves_dates ON "Leaves"("startDate", "endDate");
CREATE INDEX idx_leaves_user_status ON "Leaves"("userId", "status");

-- Break indexes
CREATE INDEX idx_breaks_user ON "Breaks"("userId");
CREATE INDEX idx_breaks_attendance ON "Breaks"("attendanceId");
CREATE INDEX idx_breaks_user_attendance ON "Breaks"("userId", "attendanceId");
```

## Backup and Recovery

### Backup Strategy
```sql
-- Full database backup
pg_dump -U postgres -d roc4tech_attendance > backup_$(date +%Y%m%d).sql

-- Schema-only backup
pg_dump -U postgres -d roc4tech_attendance -s > schema_backup.sql

-- Data-only backup
pg_dump -U postgres -d roc4tech_attendance -a > data_backup.sql
```

### Restore Strategy
```sql
-- Restore from backup
psql -U postgres -d roc4tech_attendance < backup_20231201.sql
```

## Monitoring and Maintenance

### Database Statistics
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Performance Monitoring
```sql
-- Slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Connection monitoring
SELECT 
    count(*) as connections,
    state
FROM pg_stat_activity
GROUP BY state;
```

## Migration Guide

### Version 1.0 to 1.1
```sql
-- Add new column
ALTER TABLE "Users" ADD COLUMN "employeeId" VARCHAR(50);

-- Create index
CREATE INDEX idx_users_employee_id ON "Users"("employeeId");

-- Update existing records
UPDATE "Users" SET "employeeId" = 'EMP' || LPAD(id::text, 6, '0') WHERE "employeeId" IS NULL;
```

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE "Attendances" ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own attendance
CREATE POLICY user_attendance_policy ON "Attendances"
    FOR ALL
    TO application_user
    USING ("userId" = current_setting('app.current_user_id')::UUID);

-- Create policy for managers to see their team's attendance
CREATE POLICY manager_attendance_policy ON "Attendances"
    FOR ALL
    TO application_user
    USING ("userId" IN (
        SELECT id FROM "Users" WHERE "managerId" = current_setting('app.current_user_id')::UUID
    ));
```

### Data Encryption
```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt phone numbers
UPDATE "Users" 
SET "phone" = crypt("phone", gen_salt('bf')) 
WHERE "phone" IS NOT NULL;
```

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Create appropriate indexes** for frequently queried columns
3. **Use transactions** for multiple related operations
4. **Implement soft deletes** for audit trails
5. **Regular database maintenance** including vacuum and analyze
6. **Monitor query performance** and optimize slow queries
7. **Use connection pooling** for better performance
8. **Implement proper error handling** and logging

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check PostgreSQL service status
   - Verify connection credentials
   - Check firewall settings

2. **Performance Issues**
   - Check for missing indexes
   - Analyze slow queries
   - Monitor database statistics

3. **Data Integrity Issues**
   - Check foreign key constraints
   - Verify trigger functionality
   - Review application logic

### Debug Queries

```sql
-- Check current connections
SELECT * FROM pg_stat_activity;

-- Check for locks
SELECT * FROM pg_locks;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Support

For database-related issues:
- Check the troubleshooting guide
- Review PostgreSQL logs
- Contact database administrator
- Create GitHub issues for schema-related bugs