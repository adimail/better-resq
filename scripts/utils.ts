import { execSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

// 1. Parse backend .env manually (No dotenv dependency)
const parseEnv = () => {
  const envPath = path.resolve(process.cwd(), 'backend/.env');
  if (!fs.existsSync(envPath)) return {};

  return fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .reduce((acc, line) => {
      const match = line.match(/^([^#]+?)=(.+)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/["']/g, '').trim().split(' #')[0]; // Strip quotes and inline comments
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
};

export const env = parseEnv();
const API_URL = env.API_BASE_URL || 'http://localhost:8080/v1';

// 2. Docker & Service Health Checks
export const checkDocker = () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
    console.log('✅ Docker is running.');
  } catch {
    console.error('❌ Docker is not running. Please start Docker.');
    process.exit(1);
  }
};

export const checkPort = (port: number, host = 'localhost'): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
};

export const verifyInfrastructure = async () => {
  console.log('🔍 Verifying infrastructure...');
  checkDocker();

  // Extract ports from URLs (e.g., redis://localhost:6379/0 -> 6379)
  const dbPort = parseInt(env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || '5432', 10);
  const redisPort = parseInt(env.REDIS_URL?.match(/:(\d+)\//)?.[1] || '6379', 10);
  const apiPort = parseInt(env.PORT || '8080', 10);

  const [dbUp, redisUp, apiUp] = await Promise.all([
    checkPort(dbPort),
    checkPort(redisPort),
    checkPort(apiPort)
  ]);

  if (!dbUp) throw new Error(`Postgres is down on port ${dbPort}. Run 'make services-up'`);
  if (!redisUp) throw new Error(`Redis is down on port ${redisPort}. Run 'make services-up'`);
  if (!apiUp) throw new Error(`API is down on port ${apiPort}. Run 'make dev-api'`);

  console.log('✅ All services are up and responding.\n');
};

// 3. Native Fetch API Client
export const api = {
  token: '',
  setToken: (t: string) => { api.token = t; },
  request: async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (api.token) headers['Authorization'] = `Bearer ${api.token}`;
    if (options.method === 'POST') headers['Idempotency-Key'] = crypto.randomUUID();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}] at ${endpoint}: ${errorText}`);
    }

    return response.status !== 204 ? response.json() : null;
  }
};
