/* eslint-env node */

"use strict";

const fs = require("fs-extra"),
    glob = require("glob"),
    path = require("path"),
    linkedom = require("linkedom"),
    fluid = require("infusion");

const maxwell = fluid.registerNamespace("maxwell");

fluid.setLogging(true);

require("./utils.js");

/** Parse an HTML document supplied as a symbolic reference into a linkedom DOM document
 * @param {String} path - A possibly module-qualified path reference, e.g. "%maxwell/src/html/template.html"
 * @return {Document} The document parsed into a DOM representation
 */
maxwell.parseDocument = function (path) {
    const resolved = fluid.module.resolvePath(path);
    const stats = fs.statSync(resolved);
    fluid.log("Read " + stats.size + " bytes from " + resolved);
    const text = fs.readFileSync(resolved, "utf8");
    const now = Date.now();
    const togo = linkedom.parseHTML(text).document;
    fluid.log("Parsed in " + (Date.now() - now) + " ms");
    return togo;
};

maxwell.writeFile = function (filename, data) {
    fs.writeFileSync(filename, data, "utf8");
    const stats = fs.statSync(filename);
    fluid.log("Written " + stats.size + " bytes to " + filename);
};

/** Compute figures to move to data pane, by searching for selector `.data-pane`, and if any parent is found
 * with class `figure`, widening the scope to that
 * @param {Element} container - The DOM container to be searched for elements to move
 * @return {Element[]} - An array of DOM elements to be moved to the data pane
 */
maxwell.figuresToMove = function (container) {
    const toMoves = [...container.querySelectorAll(".data-pane")];
    const widened = toMoves.map(function (toMove) {
        const figure = toMove.closest(".figure");
        return figure || toMove;
    });
    return widened;
};

// No longer done after abolition of scrollytelling - data pane no longer exists
/** Move plotly widgets which have siblings which are maps into children of the .mxcw-data pane
 * @param {Document} template - The document for the template structure into which markup is being integrated
 * @param {Element[]} sections - The array of section elements found holding leaflet maps
 * @param {Element} container - The container node with class `.main-container` found in the original knitted markup
 * @return {Element[]} An array of data panes corresponding to the input section nodes
 */
maxwell.movePlotlyWidgets = function (template, sections, container) {
    const data = template.querySelector(".mxcw-data");
    if (!data) {
        throw "Error in template structure - data pane not found with class mxcw-data";
    }
    const dataDivs = sections.map(() => {
        const div = template.createElement("div");
        div.setAttribute("class", "mxcw-widgetPane");
        data.appendChild(div);
        return div;
    });

    const plotlys = [...container.querySelectorAll(".html-widget.plotly")];
    console.log("Found " + plotlys.length + " Plotly widgets in " + sections.length + " heading sections");
    const toDatas = maxwell.figuresToMove(container);
    console.log("Found " + toDatas.length + " elements to move to data pane");
    const toMoves = [...plotlys, ...toDatas];
    toMoves.forEach(function (toMove, i) {
        const closest = toMove.closest(".section.level2");
        const index = sections.indexOf(closest);
        console.log("Found section for plotly widget at index " + index);
        if (index !== -1) {
            toMove.setAttribute("data-section-index", "" + index);
            dataDivs[index].prepend(toMove);
        } else {
            fluid.log("Ignoring widget at index " + i + " since it has no sibling map");
        }
    });
    return dataDivs;
};

fluid.delete = function (root, path) {
    const segs = fluid.model.pathToSegments(path);
    // TODO: Refactor away this silly interface too
    const pen = fluid.model.traverseSimple(root, segs, 0, null, 1);
    delete pen[fluid.peek(segs)];
};

maxwell.censorMapbox = function (data) {
    // TODO: Implement immutable applier
    const copy = fluid.copy(data);
    fluid.delete(copy, "x.layout.mapbox.style.sources");
    fluid.delete(copy, "x.layout.mapbox.style.layers");
    return copy;
};

maxwell.sortLayers = function (layers) {
    layers.sort((a, b) =>
        (+a.id.endsWith("-highlight") - (+b.id.endsWith("-highlight")))
    );
};

maxwell.parseMapboxWidgets = function (container) {
    const widgets = [...container.querySelectorAll(".html-widget.plotly")];
    let rootMap;
    const mapWidgets = {};
    const sources = {};
    const layerHash = {};
    const layersByPaneId = {};
    const fillPatterns = {};
    widgets.forEach(widget => {
        const widgetId = widget.id;
        const dataNode = widgetId ? container.querySelector("[data-for=\"" + widgetId + "\"]") : null;
        //        console.log("Got data node ", dataNode);
        const data = dataNode ? JSON.parse(dataNode.innerHTML) : null;
        //        console.log("Got data ", data);
        const mapbox = fluid.get(data, "x.layout.mapbox");
        if (mapbox) {
            const paneId = mapbox.style.id;

            // Deduplicate all sources
            Object.entries(mapbox.style.sources).forEach(([key, value]) => {
                sources[key] = value;
            });
            mapbox.style.layers.forEach((layer) => {
                const key = layer.id;
                layerHash[key] = layer;
                fluid.set(layersByPaneId, [paneId, key], 1);
                const fillPattern = layer["mx-fill-pattern"];
                if (fillPattern) {
                    fillPatterns[fillPattern] = 1;
                    layer.paint["fill-pattern"] = fillPattern;
                }
            });
            if (!rootMap) {
                rootMap = data;
            }
            mapWidgets[paneId] = maxwell.censorMapbox(data);

            const parent = widget.parentNode;
            // Remove original widget and data nodes from document and replace by marker span connecting DOM node to pane name
            widget.remove();
            dataNode.remove();
            const span = parent.ownerDocument.createElement("span");
            span.setAttribute("class", `mxcw-mapPane mxcw-paneName-${paneId}`);
            parent.appendChild(span);
        }
    });
    rootMap = rootMap || {};
    const layers = Object.values(layerHash);
    maxwell.sortLayers(layers);
    fluid.set(rootMap, "x.layout.mapbox.style.sources", sources);
    fluid.set(rootMap, "x.layout.mapbox.style.layers", layers);
    fluid.log("Parsed " + Object.keys(mapWidgets).length + " mapbox widgets from " + widgets.length + " plotly widgets");
    return {rootMap, layersByPaneId, mapWidgets, fillPatterns};
};

maxwell.makeCreateElement = function (dokkument) {
    return (tagName, props) => {
        const element = dokkument.createElement(tagName);
        Object.entries(props).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    };
};

// Move all children other than the heading itself into nested "sectionInner" node to enable 2-column layout
maxwell.encloseSections = function (container, vizColumn) {
    const h = maxwell.makeCreateElement(container.ownerDocument);
    const sections = [...container.querySelectorAll(".section.level2")];
    sections.forEach(function (section) {
        const children = [...section.childNodes].filter(node => node.tagName !== "H2");
        const inner = h("div", {"class": "mxcw-sectionInner"});
        section.appendChild(inner);
        // Move to inner column - perhaps optional behaviour
        const innerColumn = h("div", {"class": "mxcw-sectionColumn"});
        inner.appendChild(innerColumn);
        children.forEach(child => innerColumn.appendChild(child));
        if (vizColumn === "right") {
            const vizColumn = h("div", {"class": "mxcw-sectionColumn mxcw-vizColumn"});
            inner.appendChild(vizColumn);
        }
    });
};

// Transfer the content referenced by the supplied selector from container into template, removing it from container
maxwell.transferNodeContent = function (container, template, selector) {
    const containerNode = container.querySelector(selector);
    const templateNode = template.querySelector(selector);
    if (templateNode) {
        templateNode.innerHTML = containerNode.innerHTML;
        containerNode.remove();
    }
};

// Read any plotData file and merge information in it into the grade information for the associated paneHandler
maxwell.integratePaneHandler = function (paneHandler, key) {
    const plotDataFile = "%maxwell/viz_data/" + key + "-plotData.json";
    let plotData;
    const resolved = fluid.module.resolvePath(plotDataFile);
    if (fs.existsSync(resolved)) {
        plotData = maxwell.loadJSON5File(resolved);
    } else {
        fluid.log("plotData file for pane " + key + " not found");
    }
    const toMerge = fluid.censorKeys(plotData, ["palette", "taxa"]);
    return {...paneHandler, ...toMerge};
};

maxwell.makeRootLinkage = function (targetGrade, options) {
    // cf. fluid.makeGradeLinkage
    const linkageName = targetGrade + "-maxwellRoot";
    const optionsText = JSON.stringify(options);
    return `
    fluid.defaults("${linkageName}", {
        gradeNames: "fluid.component",
        distributeOptions: {
            record: ${optionsText},
            target: "{/ ${targetGrade}}.options"
        }
    });
    fluid.constructSingle([], "${linkageName}");
    `;
};

maxwell.reknitFile = async function (infile, outfile, options, config) {
    const document = maxwell.parseDocument(fluid.module.resolvePath(infile));
    const container = document.querySelector(".main-container");
    const mapboxData = maxwell.parseMapboxWidgets(container);
    maxwell.encloseSections(container, options.vizColumn);
    maxwell.writeJSONSync("mapboxData.json", mapboxData);
    const mapboxDataVar = "maxwell.mapboxData = " + JSON.stringify(mapboxData) + ";\n";

    const template = maxwell.parseDocument(fluid.module.resolvePath(options.template));
    // maxwell.movePlotlyWidgets(template, sections, container);

    maxwell.transferNodeContent(document, template, "h1");
    maxwell.transferNodeContent(document, template, "title");

    const transforms = (config.transforms || []).concat(options.transforms || []);

    await maxwell.asyncForEach(transforms || [], async (rec) => {
        const file = require(fluid.module.resolvePath(rec.file));
        const transform = file[rec.func];
        fluid.log("Applying transform ", rec.func, " from file ", rec.file);
        await transform(document, container, template, {infile, outfile, options}, config);
        fluid.log("Transform applied");
    });
    const target = template.querySelector(".mxcw-content");
    target.appendChild(container);
    const paneHandlers = options.paneHandlers;
    if (paneHandlers) {
        const integratedHandlers = fluid.transform(paneHandlers, function (paneHandler, key) {
            // TODO: Allow prefix to be contributed representing entire page, e.g. "Mollusca-"
            return maxwell.integratePaneHandler(paneHandler, key);
        });
        const rawPaneHandlers = "maxwell.rawPaneHandlers = " + JSON.stringify(integratedHandlers) + ";\n";
        const storyPageOptions = options.storyPageOptions || {};
        if (options.components) {
            const unflattened = maxwell.unflattenOptions(options.components);
            storyPageOptions.components = unflattened;
        }
        const storyPageLinkage = maxwell.makeRootLinkage("maxwell.storyPage", storyPageOptions);
        const scriptNode = template.createElement("script");
        scriptNode.innerHTML = mapboxDataVar + rawPaneHandlers + storyPageLinkage;
        const head = template.querySelector("head");
        head.appendChild(scriptNode);
    }
    const outMarkup = "<!DOCTYPE html>" + template.documentElement.outerHTML;
    maxwell.writeFile(fluid.module.resolvePath(outfile), outMarkup);
};

const copyGlob = function (sourcePattern, targetDir) {
    const fileNames = glob.sync(sourcePattern);
    fileNames.forEach(filePath => {
        const fileName = path.basename(filePath);
        const destinationPath = path.join(targetDir, fileName);

        fs.ensureDirSync(path.dirname(destinationPath));
        fs.copyFileSync(filePath, destinationPath);
        fluid.log(`Copied file: ${destinationPath}`);
    });
};

/** Copy dependencies into docs directory for GitHub pages **/

const copyDep = function (source, target, replaceSource, replaceTarget) {
    const targetPath = fluid.module.resolvePath(target);
    const sourceModule = fluid.module.refToModuleName(source);
    if (sourceModule && sourceModule !== "maxwell") {
        require(sourceModule);
    }
    const sourcePath = fluid.module.resolvePath(source);
    if (replaceSource) {
        const text = fs.readFileSync(sourcePath, "utf8");
        const replaced = text.replace(replaceSource, replaceTarget);
        fs.writeFileSync(targetPath, replaced, "utf8");
        fluid.log(`Copied file: ${targetPath}`);
    } else if (sourcePath.includes("*")) {
        copyGlob(sourcePath, targetPath);
    } else {
        fs.ensureDirSync(path.dirname(targetPath));
        fs.copySync(sourcePath, targetPath);
        fluid.log(`Copied file: ${targetPath}`);
    }
};

/*
// Currently unused - otherwise we can't load unknitted files
const clearNonMedia = function () {
    const directory = "docs";
    const files = fs.readdirSync(directory, { withFileTypes: true });

    files.forEach((file) => {
        const filePath = path.join(directory, file.name);

        if (file.isDirectory()) {
            if (file.name !== "media") {
                fs.rmSync(filePath, { recursive: true });
            }
        }
    });
};
*/

const reknit = async function () {
    const config = maxwell.loadJSON5File("%maxwell/config.json5");
    await maxwell.asyncForEach(config.reknitJobs, async (rec) => maxwell.reknitFile(rec.infile, rec.outfile, rec.options, config));

    config.copyJobs.forEach(function (dep) {
        copyDep(dep.source, dep.target, dep.replaceSource, dep.replaceTarget);
    });
};

reknit().then();
