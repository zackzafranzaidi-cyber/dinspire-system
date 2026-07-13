module.exports = {
  apps: [
    {
      name: 'dinspire-api',
      script: './server.js',
      instances: 'max', // Guna semua teras (cores) CPU yang ada
      exec_mode: 'cluster', // Mode kluster untuk Load Balancing
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
};
