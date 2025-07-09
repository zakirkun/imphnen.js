// Test client for making HTTP requests to the framework

const API_BASE = 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

async function testEndpoint(method: string, path: string, body?: any): Promise<TestResult> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body && { 'Authorization': 'Bearer test-token' })
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    return {
      endpoint: path,
      method,
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      endpoint: path,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test suite
async function runTests() {
  console.log('🧪 Running test client...\n');

  const tests = [
    () => testEndpoint('GET', '/'),
    () => testEndpoint('GET', '/users/123'),
    () => testEndpoint('POST', '/users', { name: 'Test User', email: 'test@example.com' }),
    () => testEndpoint('GET', '/search?q=test&limit=5')
  ];

  for (const test of tests) {
    const result = await test();
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method} ${result.endpoint} - ${result.status}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    console.log('');
  }
}

// Export for programmatic use
export { testEndpoint, runTests };

// Run if called directly
if (import.meta.main) {
  await runTests();
} 