const path=require("path");
const dependencyPath = path.join(
    path.dirname("./node_modules/npm-package-arg"),
    "node_modules",
    /* dependency,
    "package.json" */
  );
  console.log(dependencyPath);