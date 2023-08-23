const spawn = require("child_process").spawn;
const ls = spawn("ls", ["-al"]);

// 输出相关的数据
ls.stdout.on("data", function (data) {
  console.log("data from child: " + data);
});

// 错误的输出
ls.stderr.on("data", function (data) {
  console.log("error from child: " + data);
});

// 子进程结束时输出
ls.on("close", function (code) {
  console.log("child exists with code: " + code);
});
