const express = require("express");
const app = express();
app.get("/home", (req, res) => {
  const data = {
    message: "Hello, world!",
    timestamp: Date.now(),
  };
  res.json(data);
  //  console.log( );
});
app.listen(3000, () => {
  console.log("服务已经启动, 端口监听为 3000...");
});
