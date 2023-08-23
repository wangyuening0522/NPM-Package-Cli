#!node
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var fs = require("fs");

var path = require("path");

var _require = require("child_process"),
    execSync = _require.execSync;

var _require2 = require("console"),
    log = _require2.log; //分析依赖


function traverseDependencies(packagePath) {
  var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
  var parentDependencies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  var packageJson = require(packagePath);

  var packageName = packageJson.name; // Check for circular dependencies

  if (parentDependencies.includes(packageName)) {
    throw new Error("Circular dependency found: ".concat(packageName));
  }

  if (packageJson.dependencies && depth > 0) {
    var dependencies = packageJson.dependencies;
    console.log('result1', result);
    result[packageName] = packageJson.dependencies;
    console.log('result2', result); // if (packageJson.dependencies[packageName]) {
    //   result[packageName] = packageJson.dependencies[packageName];
    // }

    for (var dependency in dependencies) {
      var dependencyPackage = dees[dependency];
      var dependencyPath = path.join(process.cwd(), "node_modules", dependency, "package.json");

      if (fs.existsSync(dependencyPath)) {
        result[packageName][dependency] = traverseDependencies(dependencyPath, {}, depth - 1, [].concat(_toConsumableArray(parentDependencies), [packageName]))[dependency];
      } else {
        console.log("我是聪明");
        result = packageJson.dependencies;
        console.log("看看我", result);
      }
    }
  }

  return result;
} //检查冲突版本


function checkMultipleVersions(dependencyGraph) {
  var versionsMap = new Map();

  for (var packageName in dependencyGraph) {
    var dependencies = dependencyGraph[packageName];

    for (var dependency in dependencies) {
      if (!versionsMap.has(dependency)) {
        versionsMap.set(dependency, new Set());
      }

      var version = dependencies[dependency];
      versionsMap.get(dependency).add(version);
    }
  }

  var multipleVersions = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = versionsMap.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          _dependency = _step$value[0],
          versions = _step$value[1];

      if (versions.size > 1) {
        multipleVersions.push({
          dependency: _dependency,
          versions: Array.from(versions)
        });
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return multipleVersions;
} //设置保存依赖表


function saveDependencyGraph(dependencyGraph, filePath) {
  var json = JSON.stringify(dependencyGraph, null, 2);
  fs.writeFileSync(filePath, json);
  console.log("Dependency graph saved to ".concat(filePath));
} //写入分析结果


function saveAnalysisResults(results, filePath) {
  var json = JSON.stringify(results, null, 2);
  fs.writeFileSync(filePath, json);
  console.log("Analysis results saved to ".concat(filePath));
} //拿到package.json的路径(递归)


function getPackageJsonPath() {
  var packageJsonPath = path.resolve(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("No package.json found in the current directory.");
  }

  return packageJsonPath;
} //主执行函数


function main() {
  try {
    var packageJsonPath = getPackageJsonPath();
    var depthArg = process.argv.find(function (arg) {
      return arg.startsWith("--depth=");
    });
    var depth = depthArg ? parseInt(depthArg.split("=")[1]) : Infinity; //遍历依赖

    var dependencyGraph = traverseDependencies(packageJsonPath, {}, depth);
    console.log('dependencyGraph', dependencyGraph);
    var jsonFilePath = process.argv.find(function (arg) {
      return arg.startsWith("--json=");
    });
    var isAnalyze = process.argv.find(function (arg) {
      return arg.startsWith("analyze");
    });

    if (jsonFilePath) {
      var filePath = path.resolve(process.cwd(), jsonFilePath.split("=")[1]);
      saveDependencyGraph(dependencyGraph, filePath);
    } else if (isAnalyze) {
      console.log(JSON.stringify(dependencyGraph, null, 2));
    } else {
      console.log("忘记带上参数了");
    }

    var circularDependencies = [];
    var multipleVersions = checkMultipleVersions(dependencyGraph);

    if (circularDependencies.length > 0 || multipleVersions.length > 0) {
      var analysisResults = {
        circularDependencies: circularDependencies,
        multipleVersions: multipleVersions
      };
      var analysisFilePath = process.argv.find(function (arg) {
        return arg.startsWith("--analysis=");
      });

      if (analysisFilePath) {
        var _filePath = path.resolve(process.cwd(), analysisFilePath.split("=")[1]);

        saveAnalysisResults(analysisResults, _filePath);
      } else {
        console.log(JSON.stringify(analysisResults, null, 2));
      }
    }
  } catch (error) {
    console.error("An error occurred: ".concat(error.message));
    process.exit(1);
  }
}

main();