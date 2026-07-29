module.exports = {
  apps: [
    {
      name: "dinspire-backend",
      script: "./server.js",
      instances: "max", // Akan menggunakan 100% dari semua CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
