# TableRewards - Manual Test Checklist

## Pre-Test Setup
- [ ] Ensure development server is running (`npm run dev`)
- [ ] Verify environment variables are set in `.env.local`
- [ ] Check that Supabase database is accessible
- [ ] Open browser developer tools for error monitoring

## 1. Environment & Configuration Tests

### ✅ Environment Variables
- [ ] Check that `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set  
- [ ] Check that `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Verify no "Missing Supabase environment variables" errors in console

### ✅ Application Startup
- [ ] Application starts without compilation errors
- [ ] No TypeScript errors in terminal
- [ ] No webpack cache errors
- [ ] Main page loads successfully at `http://localhost:3000`

## 2. Type Safety & Validation Tests

### ✅ Form Validation
- [ ] Email validation works (try invalid emails)
- [ ] Password validation enforces minimum length
- [ ] Date validation prevents past dates for bookings
- [ ] Party size validation (1-20 people)
- [ ] Special requests character limit (500 chars)

### ✅ Input Sanitization
- [ ] XSS attempts are blocked (try `<script>alert('xss')</script>`)
- [ ] HTML tags are stripped from inputs
- [ ] SQL injection attempts fail safely

## 3. Authentication Flow Tests

### ✅ Registration
- [ ] Valid registration creates new user
- [ ] Invalid email shows error message
- [ ] Short password shows error message
- [ ] Duplicate email shows appropriate error
- [ ] Success message appears after registration

### ✅ Login
- [ ] Valid credentials log user in successfully
- [ ] Invalid credentials show error message
- [ ] Empty fields show validation errors
- [ ] User state updates correctly after login
- [ ] Points display correctly in header

### ✅ Logout
- [ ] Logout button works
- [ ] User state clears after logout
- [ ] Redirected appropriately after logout
- [ ] Protected routes become inaccessible

### ✅ Protected Routes
- [ ] `/account` requires authentication
- [ ] `/admin` requires authentication
- [ ] API routes return 401 when not authenticated
- [ ] Booking creation requires authentication

## 4. Restaurant & Booking Tests

### ✅ Restaurant Browsing
- [ ] Restaurant list loads on homepage
- [ ] Restaurant cards display correctly
- [ ] Filtering by cuisine works
- [ ] Filtering by location works
- [ ] Search functionality works
- [ ] Restaurant detail pages load

### ✅ Booking Process
- [ ] Booking form loads for authenticated users
- [ ] Date picker works and validates dates
- [ ] Time slot selection works
- [ ] Party size selection works
- [ ] Special requests field accepts input
- [ ] Form submission creates booking
- [ ] Success message appears after booking
- [ ] User redirected to account page

### ✅ Booking Management
- [ ] User can view their bookings in account page
- [ ] Booking status displays correctly
- [ ] User can modify pending bookings
- [ ] User can cancel bookings
- [ ] Changes reflect immediately in UI

## 5. Admin Dashboard Tests

### ✅ Admin Access
- [ ] Admin users can access `/admin`
- [ ] Non-admin users cannot access admin features
- [ ] Restaurant managers see only their restaurants
- [ ] Admin dashboard loads without errors

### ✅ Booking Management
- [ ] Admin can view all bookings for their restaurants
- [ ] Bookings are organized by status (pending, confirmed, cancelled)
- [ ] Admin can confirm pending bookings
- [ ] Admin can cancel bookings
- [ ] Status changes reflect immediately

## 6. Rewards System Tests

### ✅ Points Earning
- [ ] Users start with 0 points
- [ ] Points are awarded when bookings are confirmed (10 points)
- [ ] Points display correctly in user profile
- [ ] Rewards history shows point transactions
- [ ] Monthly points calculation is correct

### ✅ Rewards Display
- [ ] Total points show in header when logged in
- [ ] Rewards history page loads correctly
- [ ] Point transactions have proper descriptions
- [ ] Monthly summary calculates correctly

## 7. Error Handling Tests

### ✅ Network Errors
- [ ] Graceful handling when server is unreachable
- [ ] Timeout errors show user-friendly messages
- [ ] Retry mechanisms work where appropriate
- [ ] Loading states show during requests

### ✅ Validation Errors
- [ ] Form validation errors are clear and helpful
- [ ] API validation errors display properly
- [ ] Multiple validation errors show correctly
- [ ] Error messages are user-friendly

### ✅ Database Errors
- [ ] Database connection errors handled gracefully
- [ ] Constraint violations show appropriate messages
- [ ] Transaction failures are handled properly
- [ ] Data consistency maintained during errors

## 8. UI/UX Tests

### ✅ Responsive Design
- [ ] Layout works on mobile devices
- [ ] Navigation is accessible on small screens
- [ ] Forms are usable on mobile
- [ ] Tables/lists scroll properly on mobile

### ✅ Loading States
- [ ] Loading spinners show during API calls
- [ ] Buttons disable during form submission
- [ ] Skeleton loaders show where appropriate
- [ ] Progress indicators work correctly

### ✅ Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Form labels are properly associated
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets accessibility standards
- [ ] Focus indicators are visible

## 9. Performance Tests

### ✅ Page Load Times
- [ ] Homepage loads in under 3 seconds
- [ ] Restaurant pages load quickly
- [ ] Account page loads efficiently
- [ ] Admin dashboard loads reasonably fast

### ✅ API Response Times
- [ ] Restaurant list API responds quickly
- [ ] Booking creation is fast
- [ ] Authentication is responsive
- [ ] Search results appear quickly

## 10. Security Tests

### ✅ Input Security
- [ ] XSS attempts are blocked
- [ ] SQL injection attempts fail
- [ ] File upload restrictions work (if applicable)
- [ ] CSRF protection is active

### ✅ Authentication Security
- [ ] Passwords are properly hashed
- [ ] Sessions expire appropriately
- [ ] JWT tokens are secure
- [ ] Role-based access control works

### ✅ API Security
- [ ] Rate limiting prevents abuse
- [ ] Sensitive data is not exposed in responses
- [ ] Error messages don't leak system information
- [ ] CORS is properly configured

## Test Results Summary

### Passed Tests: ___/___
### Failed Tests: ___/___
### Critical Issues Found:
- [ ] Issue 1: ________________________________
- [ ] Issue 2: ________________________________
- [ ] Issue 3: ________________________________

### Minor Issues Found:
- [ ] Issue 1: ________________________________
- [ ] Issue 2: ________________________________
- [ ] Issue 3: ________________________________

### Notes:
_Add any additional observations or recommendations here_

---

## Quick Test Commands

```bash
# Start development server
npm run dev

# Run database operations
npm run supabase:restaurant:list
npm run supabase:booking:list
npm run supabase:user:list

# Check database stats
npm run supabase:db:stats

# Test email notifications
npm run supabase:email:list
```

## Browser Console Commands for Testing

```javascript
// Test API endpoints
fetch('/api/restaurants').then(r => r.json()).then(console.log)
fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: 'test', password: 'test'})}).then(r => r.json()).then(console.log)

// Test validation
console.log('Email validation:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com'))

// Test error handling
fetch('/api/nonexistent').then(r => console.log('Status:', r.status))
```