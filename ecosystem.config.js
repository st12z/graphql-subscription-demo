module.exports = {
  apps: [
    {
      name: "server",                 // tên app
      script: "./server.js",          // file chạy
      instances: 1,                   // số instance (cluster mode)
      exec_mode: "cluster",           // chạy cluster
      env: {
        NODE_ENV: "production",
        PORT: 4000,                   // tất cả instance cùng listen cổng 4000 (PM2 cluster sẽ load balance)
        MONGO_URI: "mongodb+srv://acmilan2k4:0tchdSwIaMaiGnjf@cluster0.nm5xt.mongodb.net/LTM_PROJECT",
        JWT_SECRET: "123456789"
      }
    }
  ]
};
