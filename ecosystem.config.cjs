// PM2 config for the mayhem-tracker server (:3001).
// Start:         pm2 start ecosystem.config.cjs && pm2 save
// After changes: pm2 reload ecosystem.config.cjs --update-env && pm2 save

module.exports = {
  apps: [
    {
      name: "mayhem-tracker",
      cwd: __dirname,
      script: "npm",
      args: "run start -w @mayhem-tracker/server",
      env: {
        // The real SQLite DB lives on the data disk. Without this the server
        // silently creates an empty DB in packages/server/data/.
        DATA_DIR: "/mnt/data/mayhem-tracker",
      },
    },
  ],
};
