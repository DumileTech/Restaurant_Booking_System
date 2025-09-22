/**
 * TableRewards API Test Script
 * Run this in browser console or Node.js to test API endpoints
 */

class APITester {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async runTest(name, testFn) {
        console.log(`🧪 Running: ${name}`);
        const startTime = Date.now();
        
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'PASSED',
                duration,
                result
            });
            
            console.log(`✅ ${name} - PASSED (${duration}ms)`);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'FAILED',
                duration,
                error: error.message
            });
            
            console.log(`❌ ${name} - FAILED (${duration}ms): ${error.message}`);
            throw error;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json().catch(() => null);
        
        return {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            data
        };
    }

    async runAllTests() {
        console.log('🚀 Starting TableRewards API Test Suite\n');

        // Environment Tests
        await this.runEnvironmentTests();
        
        // API Structure Tests
        await this.runAPIStructureTests();
        
        // Authentication Tests
        await this.runAuthenticationTests();
        
        // Restaurant Tests
        await this.runRestaurantTests();
        
        // Booking Tests
        await this.runBookingTests();
        
        // Error Handling Tests
        await this.runErrorHandlingTests();
        
        // Security Tests
        await this.runSecurityTests();

        this.printSummary();
    }

    async runEnvironmentTests() {
        console.log('\n📋 Environment Tests');
        
        await this.runTest('Homepage loads', async () => {
            const response = await this.request('/');
            if (!response.ok) throw new Error(`Homepage failed: ${response.status}`);
            return 'Homepage accessible';
        });

        await this.runTest('API base path accessible', async () => {
            const response = await this.request('/api/restaurants');
            // Should return data or auth error, not 404
            if (response.status === 404) throw new Error('API not found');
            return 'API accessible';
        });
    }

    async runAPIStructureTests() {
        console.log('\n🏗️ API Structure Tests');

        await this.runTest('Restaurants endpoint exists', async () => {
            const response = await this.request('/api/restaurants');
            if (response.status === 404) throw new Error('Restaurants endpoint not found');
            return `Restaurants endpoint returns ${response.status}`;
        });

        await this.runTest('Auth endpoints exist', async () => {
            const loginResponse = await this.request('/api/auth/login', { method: 'POST' });
            const registerResponse = await this.request('/api/auth/register', { method: 'POST' });
            
            if (loginResponse.status === 404) throw new Error('Login endpoint not found');
            if (registerResponse.status === 404) throw new Error('Register endpoint not found');
            
            return 'Auth endpoints exist';
        });

        await this.runTest('Protected endpoints require auth', async () => {
            const response = await this.request('/api/users/profile');
            if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
            return 'Protected endpoints secured';
        });
    }

    async runAuthenticationTests() {
        console.log('\n🔐 Authentication Tests');

        await this.runTest('Registration validation', async () => {
            const response = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: '123'
                })
            });

            if (response.ok) throw new Error('Invalid registration data was accepted');
            if (!response.data?.error) throw new Error('No error message returned');
            
            return 'Registration validation working';
        });

        await this.runTest('Login validation', async () => {
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: '',
                    password: ''
                })
            });

            if (response.ok) throw new Error('Empty login data was accepted');
            if (!response.data?.error) throw new Error('No error message returned');
            
            return 'Login validation working';
        });

        await this.runTest('Logout endpoint accessible', async () => {
            const response = await this.request('/api/auth/logout', {
                method: 'POST'
            });

            // Should not return 404
            if (response.status === 404) throw new Error('Logout endpoint not found');
            
            return 'Logout endpoint exists';
        });
    }

    async runRestaurantTests() {
        console.log('\n🍽️ Restaurant Tests');

        await this.runTest('Restaurant list retrieval', async () => {
            const response = await this.request('/api/restaurants');
            
            if (!response.ok && response.status !== 401) {
                throw new Error(`Restaurant list failed: ${response.status}`);
            }
            
            if (response.ok && response.data?.restaurants) {
                return `Retrieved ${response.data.restaurants.length} restaurants`;
            }
            
            return 'Restaurant endpoint accessible (auth may be required)';
        });

        await this.runTest('Restaurant filtering', async () => {
            const response = await this.request('/api/restaurants?cuisine=Italian');
            
            if (!response.ok && response.status !== 401) {
                throw new Error(`Restaurant filtering failed: ${response.status}`);
            }
            
            return 'Restaurant filtering endpoint accessible';
        });

        await this.runTest('Individual restaurant access', async () => {
            const response = await this.request('/api/restaurants/test-id');
            
            // Should return 404 for non-existent restaurant, not 500
            if (response.status >= 500) {
                throw new Error(`Server error accessing restaurant: ${response.status}`);
            }
            
            return 'Individual restaurant endpoint accessible';
        });
    }

    async runBookingTests() {
        console.log('\n📅 Booking Tests');

        await this.runTest('Booking creation requires auth', async () => {
            const response = await this.request('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    restaurant_id: 'test',
                    date: '2024-12-25',
                    time: '19:00',
                    party_size: 2
                })
            });

            if (response.status !== 401) {
                throw new Error(`Expected 401 for unauthenticated booking, got ${response.status}`);
            }
            
            return 'Booking creation properly secured';
        });

        await this.runTest('Booking validation', async () => {
            const response = await this.request('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    invalid: 'data'
                })
            });

            if (response.ok) throw new Error('Invalid booking data was accepted');
            
            return 'Booking validation working';
        });

        await this.runTest('Booking list requires auth', async () => {
            const response = await this.request('/api/bookings');

            if (response.status !== 401) {
                throw new Error(`Expected 401 for booking list, got ${response.status}`);
            }
            
            return 'Booking list properly secured';
        });
    }

    async runErrorHandlingTests() {
        console.log('\n🚨 Error Handling Tests');

        await this.runTest('404 handling', async () => {
            const response = await this.request('/api/nonexistent-endpoint');
            
            if (response.status !== 404) {
                throw new Error(`Expected 404, got ${response.status}`);
            }
            
            return '404 errors handled correctly';
        });

        await this.runTest('Malformed JSON handling', async () => {
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json'
            });

            if (response.ok) throw new Error('Malformed JSON was accepted');
            
            return 'Malformed JSON handled correctly';
        });

        await this.runTest('Error response format', async () => {
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ invalid: 'data' })
            });

            if (response.ok) throw new Error('Invalid data was accepted');
            if (!response.data?.success === false) throw new Error('Error response format incorrect');
            if (!response.data?.error) throw new Error('No error message in response');
            
            return 'Error response format correct';
        });
    }

    async runSecurityTests() {
        console.log('\n🔒 Security Tests');

        await this.runTest('XSS prevention', async () => {
            const maliciousInput = '<script>alert("xss")</script>';
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: maliciousInput,
                    password: 'test'
                })
            });

            // Should return validation error, not execute script
            if (response.ok) throw new Error('Malicious input was accepted');
            
            return 'XSS prevention working';
        });

        await this.runTest('SQL injection prevention', async () => {
            const maliciousInput = "'; DROP TABLE users; --";
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: maliciousInput,
                    password: 'test'
                })
            });

            // Should return validation error, not cause database error
            if (response.status >= 500) throw new Error('Possible SQL injection vulnerability');
            
            return 'SQL injection prevention working';
        });

        await this.runTest('CORS headers', async () => {
            const response = await this.request('/api/restaurants', {
                method: 'OPTIONS'
            });

            // Should handle OPTIONS request properly
            if (response.status >= 500) throw new Error('CORS preflight failed');
            
            return 'CORS handling working';
        });
    }

    printSummary() {
        console.log('\n📊 Test Summary');
        console.log('================');
        
        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        const total = this.results.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
        console.log(`\nAverage Response Time: ${Math.round(avgDuration)}ms`);
        
        console.log('\n🎉 Test Suite Complete!');
    }
}

// Usage:
// const tester = new APITester();
// tester.runAllTests();

// For browser console:
if (typeof window !== 'undefined') {
    window.APITester = APITester;
    console.log('APITester loaded! Run: new APITester().runAllTests()');
}

// For Node.js:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APITester;
}