# @resq/api-client

The central communication layer for the ResQ ecosystem.

## Features
- **Axios Singleton**: Pre-configured with interceptors for JWT injection.
- **Token Rotation**: Automated Refresh Token handling on 401 errors.
- **SSE Wrapper**: Specialized `ResQStream` class for Geohash-sharded events.
- **Typed Services**: Logic-separated modules (auth, sos, map) mapping to backend modules.

