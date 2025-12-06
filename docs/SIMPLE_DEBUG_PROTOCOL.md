# 🎯 SIMPLE DEBUG PROTOCOL - Roc4Tech Attendance System

## ⚠️ STOP AND READ THIS FIRST

**You are debugging a working system that has specific patterns. DON'T OVERTHINK IT.**

---

## 🔴 THE 3-STEP DEBUG METHOD

### STEP 1: WHAT BROKE? (30 seconds)
Answer these 3 questions:

1. **What error do you see?** (Copy exact message)
2. **What page/action caused it?** (Click what button?)
3. **What HTTP status code?** (Check Network tab: 200, 403, 404, 500?)

**Example:**
- Error: "Failed to load attendance data"
- Action: Opened Attendance page
- Status: 403 Forbidden on `/api/attendance/team`

---

### STEP 2: FIND THE PATTERN (2 minutes)

Your system has **ONLY 5 types of bugs**. Which one is it?

#### 🔑 Pattern #1: 403 Forbidden Error
**Symptoms:** Any 403 error after backend restart  
**Fix:** User must logout and login again  
**Why:** JWT token invalidated  
**Action:** Tell user to logout → login → try again  

#### 🚫 Pattern #2: 404 Not Found / Endpoint Missing
**Symptoms:** "Cannot GET /api/...", Network shows 404  
**Fix in this order:**
```javascript
// 1. Create controller function (backend/controllers/XController.js)
const functionName = async (req, res, next) => {
  try {
    // Your logic here
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 2. Export it
module.exports = { existingFn, functionName };

// 3. Add route (backend/routes/X.js)
router.get('/endpoint', authorize('role'), functionName);

// 4. Import in routes
const { existingFn, functionName } = require('../controllers/XController');
```

#### 📊 Pattern #3: Data Shows Empty (But DB Has Data)
**Symptoms:** "No data found" but dashboard shows count  
**Check:**
```javascript
// Is frontend accessing correct property?
// API returns: { success: true, attendances: [...] }
// Frontend should use: response.data.attendances
// NOT: response.data

// Fix:
setData(response.data.attendances); // ✅ Correct
// NOT: setData(response.data);      // ❌ Wrong
```

#### 🔍 Pattern #4: Filter Not Working
**Symptoms:** Filter button does nothing, always shows same data  
**Fix:**
```javascript
// Backend controller - BEFORE (broken):
let whereClause = { status: 'pending' }; // Hardcoded!

// Backend controller - AFTER (fixed):
const { status } = req.query;
let whereClause = {};
if (status && status !== '') {
  whereClause.status = status;
}
```

#### 💥 Pattern #5: "Absent" Shows Nothing
**Symptoms:** Absent filter returns empty  
**Why:** Absent employees have NO database records  
**Fix:** Must generate "virtual" records for users without attendance  
**See:** Document section "7. Fixed Absent Filter Logic"

---

### STEP 3: FIX IT (5 minutes)

**Match your bug to a pattern above → Copy the fix → Test immediately**

---

## 🚨 EMERGENCY CHECKLIST

Try these FIRST before coding anything:

```bash
☐ User logged out and back in? (Fixes 80% of 403 errors)
☐ Backend server running? (Check terminal)
☐ Database has data? (Check docker logs)
☐ .env file exists? (Check backend/.env)
☐ Route registered in server.js? (Check app.use statements)
```

---

## 📋 EXACT FIXES FROM YOUR HISTORY

### Fix #1: Leave Requests Not Visible (403 Error)
**File:** `backend/controllers/leaveController.js`
```javascript
// CHANGE THIS:
let whereClause = { status: 'pending' };

// TO THIS:
const { status = 'pending' } = req.query;
let whereClause = {};
if (status && status !== '') {
  whereClause.status = status;
}
```

### Fix #2: Attendance Team Endpoint Missing (404 Error)
**Step 1:** Add to `backend/controllers/attendanceController.js`:
```javascript
const getTeamAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, department, status } = req.query;
    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    }
    if (status) whereClause.status = status;
    
    let userWhereClause = {};
    if (department) userWhereClause.department = department;
    if (req.user.role === 'manager') {
      userWhereClause.managerId = req.user.id;
    }
    
    const attendances = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined
      }],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });
    
    res.json({ success: true, attendances: attendances.rows });
  } catch (error) {
    next(error);
  }
};
```

**Step 2:** Export in same file:
```javascript
module.exports = { clockIn, clockOut, getMyAttendance, getTeamAttendance };
```

**Step 3:** Add to `backend/routes/attendance.js`:
```javascript
const { getTeamAttendance } = require('../controllers/attendanceController');
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);
```

### Fix #3: Report Export Crashes (Directory Missing)
**File:** `backend/controllers/reportController.js`
```javascript
// Add at top of any function that creates files:
const fs = require('fs');
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
```

### Fix #4: Dashboard Stats Wrong
**File:** `backend/controllers/reportController.js`
```javascript
// Count as "Present" if status is ANY of these:
const presentCount = await Attendance.count({
  where: {
    date: today,
    status: {
      [Op.in]: ['present', 'late', 'early_leave'] // Not just 'present'
    }
  }
});
```

### Fix #5: Absent Filter Shows Nothing
**File:** `backend/controllers/attendanceController.js`
```javascript
// When status === 'absent':
const allUsers = await User.findAll({ where: { isActive: true } });
const presentIds = await Attendance.findAll({
  where: { date: today },
  attributes: ['userId']
});
const absentUsers = allUsers.filter(user => 
  !presentIds.some(att => att.userId === user.id)
);
// Generate virtual attendance records for absent users
const virtualRecords = absentUsers.map(user => ({
  id: `absent-${user.id}`,
  userId: user.id,
  user: user,
  date: today,
  status: 'absent',
  clockIn: null,
  clockOut: null
}));
return virtualRecords;
```

---

## 🎯 TESTING CHECKLIST

After EVERY fix:

```bash
1. ☐ Restart backend if you changed backend code
2. ☐ User logout → login (if auth-related)
3. ☐ Hard refresh browser (Ctrl+Shift+R)
4. ☐ Test the exact action that failed before
5. ☐ Check Network tab shows 200 OK
6. ☐ Check Console has no red errors
```

---

## 💬 HOW TO ASK FOR HELP

If still stuck, provide:

```
1. Error message: [paste exact error]
2. What I tried: [list what you did]
3. Network tab screenshot: [URL, status code, response]
4. Which pattern it matches: [#1, #2, #3, #4, or #5]
```

---

## 🏆 SUCCESS = NO ERRORS

You're done when:
- ✅ No red errors in browser console
- ✅ Network tab shows all 200 OK
- ✅ Data loads correctly
- ✅ User can complete their task

**Don't overthink it. Match pattern → Copy fix → Test → Done.**
