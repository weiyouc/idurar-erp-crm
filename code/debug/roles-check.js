const apiUrl = process.env.API_URL || 'http://localhost:8888/api';
const authToken = process.env.AUTH_TOKEN;

if (!authToken) {
  console.error('Missing AUTH_TOKEN env var. Example:');
  console.error('AUTH_TOKEN="your-jwt" API_URL="http://localhost:8888/api" node code/debug/roles-check.js');
  process.exit(1);
}

const requestUrl = apiUrl.replace(/\/$/, '') + '/roles';

async function run() {
  console.log(`Checking ${requestUrl}`);
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);

  try {
    const json = JSON.parse(text);
    console.log('Body:', JSON.stringify(json, null, 2));
  } catch {
    console.log('Body:', text);
  }
}

run().catch((error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});
