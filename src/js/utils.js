/* eslint-env node */

"use strict";

const JSON5 = require("json5"),
    fs = require("fs"),
    fluid = require("infusion");

const maxwell = fluid.registerNamespace("maxwell");

require("../../index.js");

// Taken from https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
maxwell.asyncForEach = async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

maxwell.unflattenOptions = function (records) {
    return fluid.transform(records, record => ({
        type: record.type,
        options: fluid.censorKeys(record, ["type"])
    }));
};

maxwell.loadJSON5File = function (path) {
    const resolved = fluid.module.resolvePath(path);
    try {
        const text = fs.readFileSync(resolved, "utf8");
        return JSON5.parse(text);
    } catch (e) {
        e.message = "Error reading JSON5 file " + resolved + "\n" + e.message;
        throw e;
    }
};

maxwell.writeJSONSync = function (inFilename, doc) {
    const filename = fluid.module.resolvePath(inFilename);
    const formatted = JSON.stringify(doc, null, 4) + "\n";
    fs.writeFileSync(filename, formatted);
    fluid.log("Written " + formatted.length + " bytes to " + filename);
};

// Monkey-patch this utility from Fluid module.js to ensure we don't overwrite an override definition or indeed any other
fluid.module.register = function (name, baseDir, moduleRequire) {
    const existing = fluid.module.modules[name];
    if (!existing || !existing.override) {
        fluid.log(fluid.logLevel.WARN, "Registering module " + name + " from path " + baseDir);
        fluid.module.modules[name] = {
            baseDir: fluid.module.canonPath(baseDir),
            require: moduleRequire
        };
    }
};

maxwell.applyModuleOverrides = function () {
    const resolved = fluid.module.resolvePath("%maxwell/moduleOverrides.json5");
    if (fs.existsSync(resolved)) {
        fluid.log("Applying module overrides from path ", resolved);
        const moduleOverrides = maxwell.loadJSON5File(resolved);
        moduleOverrides.forEach(override => {
            fluid.module.modules[override.moduleName] = {...override, override: true};
            fluid.log(`Overriding base path for module ${override.moduleName} with ${override.baseDir}`);
        });
    }
};

maxwell.applyModuleOverrides();
