# 🔍 Roc4Tech Attendance Management System - Master Debug Strategy

## 📋 System Context
You are debugging a full-stack attendance management system with:
- **Backend**: Node.js + Express + PostgreSQL + Sequelize ORM + Socket.IO
- **Frontend**: React.js Admin Dashboard + React Native Mobile App
- **Auth**: JWT-based with roles (admin, manager, employee)
- **Deployment**: Docker Compose with Nginx reverse proxy

---

## 🎯 DEBUG METHODOLOGY

### Phase 1: Problem Identification (5 minutes)
**Ask these questions in order:**

1. **What is the exact error message?**
   - Copy the full error stack trace
   - Note the HTTP status code (200, 403, 404, 500)
   - Identify if it's frontend or backend error

2. **What action triggered the error?**
   - User clicked what button?
   - What page are they on?
   - What role is the user (admin/manager/employee)?

3. **What was expected vs. what happened?**
   - Expected: Data should load
   - Actual: "Failed to load" or empty screen

4. **Is this a new bug or regression?**
   - Did this work before?
   - What changed recently? (code, environment, data)

---

### Phase 2: Evidence Collection (10 minutes)

#### A. Browser Console (Frontend)
```javascript
// Open DevTools (F12) → Console tab
// Look for:
- Red error messages
- 403 Forbidden / 401 Unauthorized
- Network errors (CORS, timeout)
- "undefined is not a function"
```

#### B. Network Tab (API Calls)
```
1. Open DevTools → Network tab
2. Filter: XHR/Fetch
3. Click the failed request
4. Check:
   - Request URL (correct endpoint?)
   - Request Headers (Authorization: Bearer token present?)
   - Request Payload (correct data format?)
   - Response Status (200, 403, 500?)
   - Response Body (error message)
```

#### C. Backend Logs (Server)
```bash
# Terminal running backend
# Look for:
- "Error:" messages
- Database connection errors
- "UnauthorizedError"
- Stack traces
```

---

### Phase 3: Root Cause Analysis (Systematic Checklist)

#### 🔐 Authentication Issues
**Symptoms**: 403 Forbidden, 401 Unauthorized, "Invalid token"

**Check:**
```javascript
// 1. Is user logged in?
localStorage.getItem('token') // Should exist

// 2. Is token valid?
// Backend: Check JWT_SECRET in .env matches
// Frontend: Token not expired (check JWT payload)

// 3. Does API include auth header?
// axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

**Common Fixes:**
- User needs to logout and login again (token invalidated after backend restart)
- Check `.env` file: JWT_SECRET must be 32+ chars
- Verify auth middleware is applied to route

---

#### 🛣️ Missing Routes/Endpoints
**Symptoms**: 404 Not Found, "Cannot GET /api/..."

**Check:**
```javascript
// 1. Does the route exist in backend?
// File: backend/routes/*.js
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);

// 2. Is controller function defined?
// File: backend/controllers/*Controller.js
const getTeamAttendance = async (req, res, next) => { ... }

// 3. Is route registered in server.js?
app.use('/api/attendance', attendanceRoutes);

// 4. Does frontend call correct URL?
// File: admin-dashboard/src/services/authService.js
const response = await api.get('/attendance/team');
```

**Common Fixes:**
- Create missing controller function
- Add route to routes file
- Import and export controller function
- Restart backend server

---

#### 🗄️ Database Issues
**Symptoms**: "Relation does not exist", null data, empty arrays

**Check:**
```sql
-- 1. Does table exist?
\dt  -- In PostgreSQL shell

-- 2. Are there records?
SELECT * FROM "Attendances" LIMIT 5;
SELECT * FROM "Leaves" WHERE status = 'pending';

-- 3. Are relationships correct?
-- Check: models/associations.js or models/index.js
```

**Common Fixes:**
- Run migrations: `npm run migrate`
- Seed data: `npm run seed`
- Check Sequelize model definitions
- Verify foreign key relationships

---

#### 🔄 Frontend State Issues
**Symptoms**: Component not updating, stale data, infinite loops

**Check:**
```javascript
// 1. Is data fetched in useEffect?
useEffect(() => {
  fetchData();
}, []); // Empty array = run once

// 2. Is loading state managed?
const [loading, setLoading] = useState(false);

// 3. Is error handled?
try {
  const response = await api.get('/endpoint');
  setData(response.data);
} catch (error) {
  setError(error.message);
}

// 4. Is state updated correctly?
setAttendances(response.data.attendances); // Not response.data
```

**Common Fixes:**
- Add error boundaries
- Check API response structure
- Verify state setter is called
- Add loading indicators

---

#### 🚫 Authorization Issues
**Symptoms**: Wrong user sees wrong data, managers see all data

**Check:**
```javascript
// Backend: Is role checked?
if (req.user.role === 'manager') {
  userWhereClause.managerId = req.user.id;
}

// Frontend: Is role-based rendering working?
{user.role === 'admin' && <AdminButton />}

// Middleware: Is authorize() correct?
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);
```

**Common Fixes:**
- Add role checks in controller
- Filter data by user/team
- Update authorize middleware
- Check req.user is populated

---

### Phase 4: Fix Implementation (The Right Way)

#### 🎯 Fix Pattern for Missing Endpoints
```javascript
// Step 1: Create Controller Function
// File: backend/controllers/attendanceController.js
const getTeamAttendance = async (req, res, next) => {
  try {
    // Role-based filtering
    let whereClause = {};
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    }
    
    const data = await Model.findAll({ where: whereClause });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Step 2: Export function
module.exports = { clockIn, clockOut, getTeamAttendance };

// Step 3: Add Route
// File: backend/routes/attendance.js
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);

// Step 4: Test
// Terminal: curl http://localhost:5000/api/attendance/team \
//   -H "Authorization: Bearer YOUR_TOKEN"
```

#### 🎯 Fix Pattern for Data Not Loading
```javascript
// Step 1: Check API response structure
console.log('API Response:', response.data);
// Example: { success: true, attendances: [...], pagination: {...} }

// Step 2: Update state correctly
setAttendances(response.data.attendances); // Not response.data

// Step 3: Add null checks
{attendances && attendances.length > 0 ? (
  attendances.map(att => <AttendanceRow key={att.id} />)
) : (
  <p>No data found</p>
)}

// Step 4: Handle errors
.catch(error => {
  setError(error.response?.data?.message || 'Failed to load');
  setLoading(false);
});
```

---

### Phase 5: Verification (Must Do!)

#### ✅ Backend Verification
```bash
# 1. Check server is running
curl http://localhost:5000/health

# 2. Test endpoint with curl
curl -X GET http://localhost:5000/api/attendance/team \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 3. Check database
docker exec -it attendance_app-db-1 psql -U roc4tech_user -d roc4tech_attendance
SELECT * FROM "Attendances" LIMIT 5;
```

#### ✅ Frontend Verification
```javascript
// 1. Clear cache and refresh
localStorage.clear();
// Reload page (Ctrl+Shift+R)

// 2. Re-login
// Logout → Login with correct credentials

// 3. Test in Console
fetch('http://localhost:5000/api/attendance/team', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)

// 4. Check Network tab
// Look for 200 OK responses
```

---

## 🚨 COMMON BUG PATTERNS (From Your System)

### Bug Pattern #1: 403 Forbidden After Backend Restart
**Cause**: JWT token invalidated when backend restarts  
**Fix**: User must logout and login again  
**Prevention**: Use refresh tokens or session storage

### Bug Pattern #2: Empty Data Despite Records Existing
**Cause**: Frontend accessing wrong property (response.data vs response.data.attendances)  
**Fix**: Check API response structure and update state setters  
**Prevention**: Use TypeScript or prop-types

### Bug Pattern #3: Missing Route Endpoint
**Cause**: Frontend calls endpoint that doesn't exist in backend  
**Fix**: Create controller function → Export → Add route → Register in server.js  
**Prevention**: Document all endpoints in README

### Bug Pattern #4: Status Filter Ignored
**Cause**: Controller hardcodes status='pending' and ignores query params  
**Fix**: Extract status from req.query and build dynamic where clause  
**Prevention**: Always use dynamic filters from query params

### Bug Pattern #5: File Upload/Export Crashes
**Cause**: Directory doesn't exist (uploads/, reports/)  
**Fix**: Add `fs.mkdirSync('./uploads', { recursive: true })` before file operations  
**Prevention**: Create directories in initialization script

---

## 🎓 DEBUG DECISION TREE

```
START: Error occurred
│
├─ Is there an error message?
│  ├─ YES → Read the error stack trace
│  │        ├─ "403 Forbidden" → Check authentication/authorization
│  │        ├─ "404 Not Found" → Check route exists
│  │        ├─ "500 Server Error" → Check backend logs
│  │        └─ "undefined/null" → Check data structure
│  │
│  └─ NO → Data just doesn't appear
│           ├─ Check Network tab for failed requests
│           ├─ Check Console for warnings
│           └─ Check if data exists in database
│
├─ Does the route/endpoint exist?
│  ├─ NO → Create controller → Add route → Export
│  └─ YES → Continue
│
├─ Is authentication working?
│  ├─ NO → User logout/login → Check JWT_SECRET → Check middleware
│  └─ YES → Continue
│
├─ Does database have data?
│  ├─ NO → Run seed script → Check migrations
│  └─ YES → Continue
│
├─ Is data being fetched correctly?
│  ├─ NO → Check API call → Check response structure → Update state
│  └─ YES → Continue
│
└─ Is data being rendered correctly?
   ├─ NO → Check state updates → Add null checks → Verify component props
   └─ YES → Bug fixed! ✅
```

---

## 📝 DEBUG LOG TEMPLATE

Copy this for each bug:

```markdown
## Bug Report: [Short Description]

**Date**: [YYYY-MM-DD]
**Reporter**: [Name]
**Severity**: Critical / High / Medium / Low

### 1. Symptoms
- What the user sees: [Description]
- Where it occurs: [Page/Component]
- User role: [admin/manager/employee]
- Error message: [Exact message]

### 2. Evidence
- Browser console error: [Error]
- Network request: [URL, Status, Response]
- Backend log: [Log output]

### 3. Root Cause
[What caused the bug]

### 4. Files Changed
- `backend/controllers/XController.js` - [What changed]
- `backend/routes/X.js` - [What changed]
- `admin-dashboard/src/pages/XPage.js` - [What changed]

### 5. Fix Applied
```javascript
// Code changes
```

### 6. Verification
- [ ] Backend tested with curl
- [ ] Frontend tested in browser
- [ ] Database checked
- [ ] User tested end-to-end
- [ ] No new bugs introduced

### 7. Prevention
[How to prevent this in future]
```

---

## 🔥 EMERGENCY DEBUGGING COMMANDS

```bash
# System is completely broken? Run these:

# 1. Restart everything
docker-compose down
docker-compose up --build

# 2. Reset database
docker-compose down -v  # Delete volumes
docker-compose up

# 3. Check all services
docker-compose ps
docker-compose logs backend
docker-compose logs db

# 4. Access database directly
docker exec -it attendance_app-db-1 psql -U roc4tech_user -d roc4tech_attendance

# 5. Check environment variables
cat backend/.env

# 6. Clear frontend cache
# Browser: Ctrl+Shift+Delete → Clear cache
localStorage.clear()
```

---

## 🎯 SUCCESS CRITERIA

Your debugging is complete when:

- ✅ No console errors in browser
- ✅ All API calls return 200 OK
- ✅ Data loads correctly for each role
- ✅ User can complete their task (clock in, approve leave, etc.)
- ✅ No database errors
- ✅ System behaves as documented
- ✅ Changes are committed with clear messages

---

## 💡 PRO TIPS

1. **Always read the full error message** - Don't assume, read every word
2. **Check the obvious first** - Is the server running? Is user logged in?
3. **One change at a time** - Don't fix 5 things at once
4. **Test immediately** - After each change, test before moving on
5. **Document your fixes** - Future you will thank you
6. **Use console.log liberally** - But remove them after debugging
7. **When stuck, check the docs** - Sequelize, Express, React docs
8. **Compare with working code** - Look at similar endpoints that work

---

## 🚀 QUICK WIN CHECKLIST

Before diving deep, try these quick fixes (80% of bugs):

- [ ] Logout and login again (token refresh)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Restart backend server
- [ ] Check .env file exists and has correct values
- [ ] Check database has data (run seed script)
- [ ] Check user has correct role
- [ ] Check route is registered in server.js
- [ ] Check import/export statements match
- [ ] Check API URL in frontend matches backend route
- [ ] Check Authorization header is included in request

---

## 📚 REFERENCE: Key Files to Know

```
Backend Issues:
- backend/server.js → Route registration
- backend/routes/*.js → API endpoints
- backend/controllers/*.js → Business logic
- backend/middleware/auth.js → Authentication
- backend/models/*.js → Database models

Frontend Issues:
- admin-dashboard/src/services/*.js → API calls
- admin-dashboard/src/pages/*.js → Page components
- admin-dashboard/src/context/AuthContext.js → Auth state

Database Issues:
- backend/config/database.js → DB connection
- backend/scripts/seed.js → Sample data
- docker-compose.yml → DB configuration
```

---

## 🎬 FINAL WORDS

Debugging is a systematic process, not guesswork. Follow the phases, collect evidence, analyze patterns, fix methodically, and verify thoroughly. Every bug teaches you something about the system.

**When stuck**: Take a 5-minute break, explain the problem to a rubber duck, or start from Phase 1 again with fresh eyes.

**Remember**: The bug is not personal. The code is not perfect. The system is learnable. You've got this! 💪
