# TableRewards Test Suite

This directory contains comprehensive testing tools to verify that all applied fixes are working correctly.

## Test Files

### 1. `test-runner.html`
Interactive web-based test runner that performs comprehensive testing of:
- Environment & Configuration
- Type Safety & Validation  
- API Routes
- Authentication Flow
- Database Operations
- Error Handling
- UI Components
- Performance & Security

**Usage:**
1. Start your development server: `npm run dev`
2. Open `tests/test-runner.html` in your browser
3. Click "Run Complete Test Suite" or run individual test categories
4. View detailed results and pass/fail status

### 2. `manual-test-checklist.md`
Comprehensive manual testing checklist covering:
- Pre-test setup requirements
- Step-by-step testing procedures
- Expected behaviors and outcomes
- Common issues to watch for
- Test result tracking

**Usage:**
1. Print or open the checklist
2. Follow each section systematically
3. Check off completed tests
4. Document any issues found

### 3. `api-test-script.js`
Automated API testing script that can run in browser console or Node.js:
- Tests all API endpoints
- Validates error handling
- Checks security measures
- Measures response times
- Provides detailed reporting

**Usage in Browser:**
```javascript
// Open browser console on your app
// Copy and paste the script, then run:
const tester = new APITester();
tester.runAllTests();
```

**Usage in Node.js:**
```bash
node tests/api-test-script.js
```

## Quick Test Commands

### Database Operations
```bash
# List restaurants
npm run supabase:restaurant:list

# List bookings  
npm run supabase:booking:list

# List users
npm run supabase:user:list

# Database statistics
npm run supabase:db:stats
```

### Test Specific Features
```bash
# Test restaurant creation
npx tsx scripts/supabase-cli.ts restaurant create --name "Test Restaurant" --location "Cape Town"

# Test booking creation (requires user_id and restaurant_id)
npx tsx scripts/supabase-cli.ts booking create --user_id "USER_ID" --restaurant_id "RESTAURANT_ID" --date "2024-01-15" --time "19:00"

# Test email notifications
npm run supabase:email:list
```

## Browser Console Tests

Open your browser's developer console and run these commands:

```javascript
// Test API endpoints
fetch('/api/restaurants').then(r => r.json()).then(console.log);

// Test authentication
fetch('/api/auth/login', {
  method: 'POST', 
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({email: 'test@example.com', password: 'password123'})
}).then(r => r.json()).then(console.log);

// Test validation
console.log('Email validation:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com'));

// Test error handling
fetch('/api/nonexistent').then(r => console.log('Status:', r.status));
```

## Expected Test Results

### ✅ All Tests Should Pass
- Environment variables loaded correctly
- No compilation or runtime errors
- All API endpoints accessible
- Authentication flow working
- Database operations successful
- Error handling graceful
- UI components responsive
- Security measures active

### 🚨 Common Issues to Watch For
- Missing environment variables
- Database connection failures
- Authentication token issues
- CORS configuration problems
- Validation bypasses
- Memory leaks
- Slow response times
- Security vulnerabilities

## Test Coverage

The test suite covers:

1. **Environment Setup** (4 tests)
   - Environment variables
   - Next.js configuration
   - TypeScript compilation
   - Supabase initialization

2. **Validation & Security** (8 tests)
   - Input validation
   - XSS prevention
   - SQL injection prevention
   - Data sanitization

3. **API Functionality** (12 tests)
   - All endpoint accessibility
   - Error response formats
   - CORS handling
   - Rate limiting

4. **Authentication** (6 tests)
   - Registration flow
   - Login validation
   - Protected routes
   - Session management

5. **Database Operations** (8 tests)
   - Data retrieval
   - CRUD operations
   - Query validation
   - Error handling

6. **UI/UX** (10 tests)
   - Component rendering
   - Form functionality
   - Responsive design
   - Accessibility

7. **Performance** (6 tests)
   - Response times
   - Memory usage
   - Load testing
   - Optimization

## Reporting Issues

When tests fail, document:
1. **Test name and category**
2. **Expected vs actual behavior**
3. **Error messages or console output**
4. **Steps to reproduce**
5. **Browser/environment details**

## Continuous Testing

Run tests:
- After any code changes
- Before deploying to production
- When adding new features
- After dependency updates
- During debugging sessions

This comprehensive test suite ensures that all applied fixes are working correctly and the application is production-ready.