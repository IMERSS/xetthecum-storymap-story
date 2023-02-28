/* eslint-env node */

"use strict";

const {resolvePath, asyncForEach, loadJSON5File} = require("./utils.js");

const fs = require("fs-extra"),
    linkedom = require("linkedom");

const parseDocument = function (path) {
    const text = fs.readFileSync(path, "utf8");
    return linkedom.parseHTML(text).document;
};

const writeFile = function (filename, data) {
    fs.writeFileSync(filename, data, "utf8");
    const stats = fs.statSync(filename);
    console.log("Written " + stats.size + " bytes to " + filename);
};

// Hide the divs which host the original leaflet maps and return their respective section headers
const hideLeafletWidgets = function (container) {
    const widgets = [...container.querySelectorAll(".html-widget.leaflet")];
    widgets.forEach(function (widget) {
        widget.removeAttribute("style");
    });
    const sections = widgets.map(widget => widget.closest(".section.level2"));
    return sections;
};

// Move plotly widgets which have siblings which are maps into children of the .mxcw-data pane
const movePlotlyWidgets = function (template, sections, container) {
    const data = template.querySelector(".mxcw-data");
    if (!data) {
        throw "Error in template structure - data pane not found with class mxcw-data";
    }
    const divs = sections.map(() => {
        const div = template.createElement("div");
        div.setAttribute("class", "mxcw-widgetPane");
        data.appendChild(div);
        return div;
    });

    const others = [...container.querySelectorAll(".html-widget.plotly")];
    console.log("Found " + others.length + " Plotly widgets in " + sections.length + " heading sections");
    others.forEach(function (other, i) {
        const closest = other.closest(".section.level2");
        const index = sections.indexOf(closest);
        console.log("Found section at index " + index);
        if (index !== -1) {
            other.setAttribute("data-section-index", "" + index);
            divs[index].appendChild(other);
        } else {
            console.log("Ignoring widget at index " + i + " since it has no sibling map");
        }
    });
    return divs;
};

const removeImageMaps = function (container) {
    // Remove old image maps which haven't yet been converted - these stick out
    const images = container.querySelectorAll("img");
    images.forEach(image => image.remove());
};

const reweaveFile = async function (infile, outfile, options) {
    const document = parseDocument(resolvePath(infile));
    const container = document.querySelector(".main-container");
    const sections = hideLeafletWidgets(container);
    removeImageMaps(container);
    const template = parseDocument(resolvePath(options.template));
    movePlotlyWidgets(template, sections, container);
    container.querySelector("h1").remove();
    await asyncForEach(options.transforms || [], async (rec) => {
        const file = require(resolvePath(rec.file));
        const transform = file[rec.func];
        await transform(document, container);
    });
    const target = template.querySelector(".mxcw-content");
    target.appendChild(container);
    const outMarkup = "<!DOCTYPE html>" + template.documentElement.outerHTML;
    writeFile(resolvePath(outfile), outMarkup);
};

/** Copy dependencies into docs directory for GitHub pages **/

const copyDep = function (source, target) {
    const targetPath = resolvePath(target);
    fs.copySync(resolvePath(source), resolvePath(target));
    fs.chmodSync(targetPath, "644");
};

const reknit = async function () {
    const config = loadJSON5File("%maxwell/config.json5");
    await asyncForEach(config.reknitJobs, async (rec) => reweaveFile(rec.infile, rec.outfile, rec.options));

    config.copyJobs.forEach(function (dep) {
        copyDep(dep.source, dep.target);
    });
};

reknit().then();


