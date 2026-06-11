import { execSync } from 'node:child_process';
import { checkDocker, checkPort, env } from './utils';

async function prune() {
  console.log('🧹 Preparing to prune database...');
  checkDocker();

  const dbPort = parseInt(env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || '5432', 10);
  const dbUp = await checkPort(dbPort);

  if (!dbUp) {
    console.error('❌ Postgres is down. Cannot prune.');
    process.exit(1);
  }

  console.log('⚠️  Resetting database via Goose migrations...');
  try {
    // Run the make commands defined in your root Makefile
    execSync('make db-reset', { stdio: 'inherit' });
    console.log('🏗️  Re-applying migrations...');
    execSync('make db-up', { stdio: 'inherit' });

    console.log('\n✅ Database pruned and re-initialized successfully.');
  } catch (error) {
    console.error('\n❌ Failed to prune database. Make sure Goose is installed and accessible.');
  }
}

prune().catch(console.error);
