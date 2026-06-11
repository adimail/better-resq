import { execSync } from 'node:child_process';
import { verifyInfrastructure, api } from './utils';

async function seed() {
  await verifyInfrastructure();

  const phone = '+910000000000';
  const password = 'adminpassword';

  try {
    await api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phone,
        password: password,
        full_name: 'Super Admin'
      })
    });
  } catch (e: any) {
  }

  try {
    execSync(`docker compose exec -T postgres psql -U resq -d resq_dev -c "UPDATE users SET role='AUTHORITY' WHERE phone_number='${phone}';"`);
  } catch (e) {
    process.exit(1);
  }

  const authData = await api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phone, password: password })
  });
  api.setToken(authData.access_token);

  await api.request('/danger-zones', {
    method: 'POST',
    body: JSON.stringify({
      disaster_type: 'flood',
      severity_level: 4,
      boundary_polygon: [[[73.8446, 18.5314], [73.8546, 18.5314], [73.8546, 18.5414], [73.8446, 18.5414], [73.8446, 18.5314]]]
    })
  });

  await api.request('/camps', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Central Relief Center',
      camp_type: 'medical',
      location: { lat: 18.5310, lng: 73.8588 }
    })
  });

  console.log('\n✅ Database successfully seeded with Admin user, Danger Zones, and Camps.');
  console.log('👤 Admin Phone: ' + phone);
  console.log('🔑 Admin Password: ' + password + '\n');
}

seed().catch(console.error);
