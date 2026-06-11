import { verifyInfrastructure, api } from './utils';

async function testSSE() {
  await verifyInfrastructure();

  console.log('📡 Triggering SSE Broadcast Event...\n');

  // Login as Authority (using credentials from seed.ts)
  const authData = await api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone_number: '+910000000000', password: 'adminpassword' })
  });
  api.setToken(authData.access_token);

  // Trigger a Mass Broadcast targeting the general Pune bounding box
  await api.request('/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      message: '🚨 CRITICAL: Immediate evacuation ordered for low-lying areas near Mutha river.',
      severity: 5,
      target_polygon: [[[73.8, 18.5], [73.9, 18.5], [73.9, 18.6], [73.8, 18.6], [73.8, 18.5]]]
    })
  });

  console.log('✅ Broadcast sent! Check your React PWA (it should appear via SSE instantly).');
}

testSSE().catch(console.error);
