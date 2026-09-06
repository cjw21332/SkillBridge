module.exports = {
  apps: [
    {
      name: "skillbridge-api",
      script: "dist/server.js",
      cwd: "./apps/api",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
