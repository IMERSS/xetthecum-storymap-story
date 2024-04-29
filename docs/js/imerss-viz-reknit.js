"use strict";

/* global effect, Plotly */

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

// A pane holding some kind of viz from imerss-viz - now just a simple template loader
fluid.defaults("maxwell.storyVizPane", {
    gradeNames: ["maxwell.templatePaneHandler"],
    resourceBase: ".",
    //
    resourceOptions: {
        terms: {
            resourceBase: "{that}.options.resourceBase"
        }
    },
    styles: {
        paneClass: "mxcw-viz-pane"
    },
    invokers: {
        find: {
            args: ["{that}.options.parentContainer", "{that}.options.selectors", "{arguments}.0"],
            func: (parentContainer, selectors, selectorName) => parentContainer[0].querySelector(selectors[selectorName])
        },
        findAll: {
            args: ["{that}.options.parentContainer", "{that}.options.selectors", "{arguments}.0"],
            func: (parentContainer, selectors, selectorName) => [...parentContainer[0].querySelectorAll(selectors[selectorName])]
        }
    },
    resources: {
        template: {
            url: "{that}.options.markupTemplate",
            dataType: "text"
        }
    },
    model: {
    },
    listeners: {
        "onCreate.paneClass": {
            func: (parentContainer, clazz) => parentContainer[0].classList.add(clazz),
            args: ["{that}.options.parentContainer", "{that}.options.styles.paneClass"]
        }
    }
});

// Grade applied to the base storyPage routing a taxon selection to selectedTaxonId signal in a pane
fluid.defaults("maxwell.storyPage.withPaneTaxon", {
    members: {
        taxaByName: "@expand:fluid.computed(hortis.taxaByName, {vizLoader}.taxaRows)"
    },
    modelListeners: {
        listenTaxonHash: {
            priority: "first",
            path: "{hashManager}.model",
            funcName: "maxwell.listenTaxonHash",
            args: ["{storyPage}", "{change}.value", "{storyPage}.taxaByName.value"]
        }
    }
});

hortis.taxaByName = function (taxaRows) {
    const taxaByName = {};
    taxaRows.forEach(row => taxaByName[row.iNaturalistTaxonName] = row);
    return taxaByName;
};

// Listen to this first so that taxon pane is ready before we make it visible
maxwell.listenTaxonHash = function (storyPage, hashModel, taxaByName) {
    const paneHandler = maxwell.paneHandlerForName(storyPage, hashModel.pane);
    if (paneHandler?.selectedTaxonId) {
        const row = taxaByName[hashModel?.taxon];
        const taxonId = row?.id;
        // Put in null explicitly to avoid censoring by fluid.effect
        paneHandler.selectedTaxonId.value = taxonId || null;
    }
};

maxwell.updateTaxonHash = function (hashManager, taxaById, selectedTaxonId, isVisible) {
    if (isVisible) {
        const taxonName = taxaById[selectedTaxonId]?.iNaturalistTaxonName;
        hashManager.applier.change("taxon", taxonName);
    }
};

fluid.registerNamespace("maxwell.legendKey");

maxwell.legendKey.rowTemplate = "<div class=\"imerss-legend-row %rowClass\">" +
    "<span class=\"imerss-legend-icon\"></span>" +
    "<span class=\"imerss-legend-preview %previewClass\" style=\"%previewStyle\"></span>" +
    "<span class=\"imerss-legend-label\">%keyLabel</span>" +
    "</div>";

// Improved version which deals with status|cell style regions seen in Marine Atlas
// TODO: Do we need this any more?
hortis.normaliseToClass = function (str) {
    return str.toLowerCase().replace(/[| ]/g, "-");
};

maxwell.legendKey.renderMarkup = function (markup, regionInfo, regionName) {
    const backColour = regionInfo.fillColor || regionInfo.color;
    const normal = hortis.normaliseToClass(regionName);
    return fluid.stringTemplate(markup, {
        rowClass: "imerss-legend-row-" + normal,
        previewClass: "imerss-region-" + normal,
        previewStyle: (regionInfo.fillPatternUrl ? `background-image: url(${regionInfo.fillPatternUrl});\n` : "") + "background-color: " + backColour,
        keyLabel: regionName
    });
};

// cf. Xetthecum's hortis.legendKey.drawLegend in leafletMapWithRegions.js - it has a block template and also makes
// a fire to selectRegion with two arguments.
maxwell.legendKey.addLegendControl = function (map, regionRows) {
    const control = maxwell.legendKey.drawLegend(map, regionRows);
    control.onAdd = () => control.container;
    control.onRemove = () => control.cleanup();

    map.map.addControl(control, "bottom-right");

    return control;
};

maxwell.indexRegionRows = function (regionRows) {
    return Object.fromEntries(regionRows.map(row => [row.Layer, row]));
};

maxwell.legendKey.drawLegend = function (map, regionRows) {
    const selectableRegions = map.options.selectableRegions;
    // TODO: Do this in the map
    regionRows.forEach(row => {
        if (row.fillPattern) {
            row.fillPatternUrl = map.urlForFillPattern(row.fillPattern);
        }
    });
    const regionIndex = maxwell.indexRegionRows(regionRows);
    const regionMarkupRows = selectableRegions.map(function (regionName) {
        return maxwell.legendKey.renderMarkup(maxwell.legendKey.rowTemplate, regionIndex[regionName], regionName);
    });
    const markup = regionMarkupRows.join("\n");
    const container = document.createElement("div");
    container.classList.add("mxcw-legend");
    container.innerHTML = markup;
    const f = regionName => {
        const rowSel = ".imerss-legend-row-" + hortis.normaliseToClass(regionName);
        return container.querySelector(rowSel);
    };
    selectableRegions.forEach(function (regionName) {
        f(regionName).addEventListener("click", function () {
            map.selectedRegion.value = regionName;
        });
    });

    const cleanup = effect( () => {
        const selectedRegion = map.selectedRegion.value;
        selectableRegions.forEach(selectableRegion => {
            try {
                maxwell.toggleClass(f(selectableRegion), "imerss-selected", selectedRegion === selectableRegion);
                maxwell.toggleClass(f(selectableRegion), "imerss-unselected", selectedRegion !== selectableRegion);
            } catch {}
        });
    });

    return {cleanup, container};
};


// AS has requested the region selection bar to appear in a special area above the taxonomy
fluid.defaults("maxwell.regionSelectionBar.withHoist", {
    gradeNames: "maxwell.widgetHandler",
    listeners: {
        "bindWidget.hoist": {
            funcName: "maxwell.regionSelectionBar.hoist",
            priority: "before:impl"
        }
    },
    resizableParent: ".imerss-checklist-outer"
});

maxwell.regionSelectionBar.hoist = function (element, that, paneHandler) {
    const target = paneHandler.container[0].querySelector(".imerss-checklist-widgets");
    target.appendChild(element);
};

fluid.defaults("maxwell.regionSelectionBar", {
    gradeNames: ["maxwell.widgetHandler", "maxwell.withResizableWidth"],
    listeners: {
        "bindWidget.impl": "maxwell.regionSelectionBar.bind"
    }
});

maxwell.regionSelectionBar.bind = function (element, that, paneHandler) {
    const bar = element;
    const vizBinder = paneHandler;
    const names = fluid.getMembers(element.data, "name");
    // In theory this should be done via some options distribution, or at the very least, an IoCSS-driven model
    // listener specification
    vizBinder.events.sunburstLoaded.addListener(() => {
        const map = vizBinder.map;
        map.applier.modelChanged.addListener({path: "selectedRegions.*"}, function (selected, oldSelected, segs) {
            const changed = fluid.peek(segs);
            const index = names.indexOf(changed);
            Plotly.restyle(element, {
                // Should agree with .imerss-selected but seems that plotly cannot be reached via CSS
                "marker.line": selected ? {
                    color: "#FCFF63",
                    width: 2
                } : {
                    color: "#000000",
                    width: 0
                }
            }, index);
        });
    }, "plotlyRegion", "after:fluid-componentConstruction");

    bar.on("plotly_click", function (e) {
        const regionName = e.points[0].data.name;
        paneHandler.triggerRegionSelection(regionName);
    });
};

fluid.defaults("maxwell.bareRegionsExtra.withLegend", {
    selectors: {
        // key is from Xetthecum, selector is ours - we don't have "keys", normalise this
        legendKeys: ".mxcw-legend"
    },
    modelListeners: {
        legend: {
            path: "selectedRegions.*",
            func: "hortis.legendKey.selectRegion",
            args: ["{that}", "{change}.value", "{change}.path"]
        },
        legendVisible: {
            path: "{paneHandler}.model.isVisible",
            func: "maxwell.toggleClass",
            args: ["{that}.legendContainer", "mxcw-hidden", "{change}.value", true]
        }
    },
    members: {
        legendContainer: "@expand:maxwell.legendKey.drawLegend({that}, {paneHandler})"
    },
    listeners: {
        // BUG only one of the legendVisible modelListeners fires onCreate! Perhaps because of the namespace?
        "onCreate.legendVisible": {
            path: "{paneHandler}.model.isVisible",
            func: "maxwell.toggleClass",
            args: ["{that}.legendContainer", "mxcw-hidden", "{paneHandler}.model.isVisible", true]
        }
    }
});

// TODO: Monkey-patch of version in checklist.js to ensure we display Barentsia

hortis.acceptChecklistRow = function (row, filterRanks) {
    const acceptBasic = !filterRanks || filterRanks.includes(row.rank) || row.species;
    // Special request from AS - suppress any checklist entry at species level if there are any ssp
    const rejectSpecies = row.rank === "species" && row.children.length > 0;
    // Presumed special request - display Barentsia spp. - perhaps we should display any leaf?
    const acceptGenus = row.genus && row.children.length === 0;
    return acceptBasic && !rejectSpecies || acceptGenus;
};

