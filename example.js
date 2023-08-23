#!node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { log } = require("console");
//分析依赖
function traverseDependencies(
  packagePath,
  result = {},
  depth = Infinity,
  parentDependencies = []
) {
  const packageJson = require(packagePath);
  const packageName = packageJson.name;
  // Check for circular dependencies
  if (parentDependencies.includes(packageName)) {
    throw new Error(`Circular dependency found: ${packageName}`);
  }
  if (packageJson.dependencies && depth > 0) {
    const dependencies = packageJson.dependencies;
    console.log('result1', result)
    result[packageName] = packageJson.dependencies;
    console.log('result2', result)
    // if (packageJson.dependencies[packageName]) {
    //   result[packageName] = packageJson.dependencies[packageName];
    // }

    for (const dependency in dependencies) {
      const dependencyPackage = dees[dependency];
      const dependencyPath = path.join(
        process.cwd(),
        "node_modules",
        dependency,
        "package.json"
      );
      if (fs.existsSync(dependencyPath)) {
        result[packageName][dependency] = traverseDependencies(
          dependencyPath,
          {},
          depth - 1,
          [...parentDependencies, packageName]
        )[dependency]
      } else {
        console.log("我是聪明");
        result = packageJson.dependencies;
        console.log("看看我",result);
      }
    }
  }
  return result;
}
//检查冲突版本
function checkMultipleVersions(dependencyGraph) {
  const versionsMap = new Map();

  for (const packageName in dependencyGraph) {
    const dependencies = dependencyGraph[packageName];
    for (const dependency in dependencies) {
      if (!versionsMap.has(dependency)) {
        versionsMap.set(dependency, new Set());
      }
      const version = dependencies[dependency];
      versionsMap.get(dependency).add(version);
    }
  }

  const multipleVersions = [];
  for (const [dependency, versions] of versionsMap.entries()) {
    if (versions.size > 1) {
      multipleVersions.push({ dependency, versions: Array.from(versions) });
    }
  }

  return multipleVersions;
}
//设置保存依赖表
function saveDependencyGraph(dependencyGraph, filePath) {
  const json = JSON.stringify(dependencyGraph, null, 2);
  fs.writeFileSync(filePath, json);
  console.log(`Dependency graph saved to ${filePath}`);
}
//写入分析结果
function saveAnalysisResults(results, filePath) {
  const json = JSON.stringify(results, null, 2);
  fs.writeFileSync(filePath, json);
  console.log(`Analysis results saved to ${filePath}`);
}
//拿到package.json的路径(递归)
function getPackageJsonPath() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("No package.json found in the current directory.");
  }
  return packageJsonPath;
}
//主执行函数
function main() {
  try {
    const packageJsonPath = getPackageJsonPath();
    const depthArg = process.argv.find((arg) => arg.startsWith("--depth="));
    const depth = depthArg ? parseInt(depthArg.split("=")[1]) : Infinity;
    //遍历依赖
    const dependencyGraph = traverseDependencies(packageJsonPath, {}, depth);
    console.log('dependencyGraph', dependencyGraph); 
    const jsonFilePath = process.argv.find((arg) => arg.startsWith("--json="));
    const isAnalyze = process.argv.find((arg) => arg.startsWith("analyze"));
    if (jsonFilePath) {
      const filePath = path.resolve(process.cwd(), jsonFilePath.split("=")[1]);
      saveDependencyGraph(dependencyGraph, filePath);
    } else if (isAnalyze) {
      console.log(JSON.stringify(dependencyGraph, null, 2));
    } else {
      console.log("忘记带上参数了");
    }

    const circularDependencies = [];
    const multipleVersions = checkMultipleVersions(dependencyGraph);

    if (circularDependencies.length > 0 || multipleVersions.length > 0) {
      const analysisResults = { circularDependencies, multipleVersions };

      const analysisFilePath = process.argv.find((arg) =>
        arg.startsWith("--analysis=")
      );
      if (analysisFilePath) {
        const filePath = path.resolve(
          process.cwd(),
          analysisFilePath.split("=")[1]
        );
        saveAnalysisResults(analysisResults, filePath);
      } else {
        console.log(JSON.stringify(analysisResults, null, 2));
      }
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
  }
}

main();
