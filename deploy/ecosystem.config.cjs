module.exports = {
  apps: [
    {
      name: "mayhem-tracker",
      script: "npm",
      args: "run start -w @mayhem-tracker/server",
      cwd: "/mnt/apps/mayhem-tracker",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        DATA_DIR: "/mnt/data/mayhem-tracker",
      },
    },
  ],
};
