"use strict";
/* global Plotly */

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

maxwell.legendKey.rowTemplate = `
<div class="imerss-legend-row %rowClass">
    <span class="imerss-legend-icon"></span>
    <span class="imerss-legend-preview %previewClass" style="%previewStyle"></span>
    <span class="imerss-legend-label">%keyLabel</span>
</div>`;

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
maxwell.legendKey.addLegendControl = function (map, regionRowsSignal, isVisibleSignal) {
    const control = maxwell.legendKey.drawLegend(map, regionRowsSignal, isVisibleSignal);
    control.onAdd = () => control.container;
    control.onRemove = () => {
        console.log("Cleaning up legend attached to ", control.container);
        control.cleanup();
    };

    map.map.addControl(control, "bottom-right");

    return control;
};

maxwell.indexRegionRows = function (regionRows) {
    return Object.fromEntries(regionRows.map(row => [row.Layer, row]));
};

maxwell.legendKey.drawLegend = function (map, regionRowsSignal, isVisibleSignal) {
    const container = document.createElement("div");
    container.classList.add("mxcw-legend");

    const f = regionName => {
        const rowSel = ".imerss-legend-row-" + hortis.normaliseToClass(regionName);
        return container.querySelector(rowSel);
    };

    const renderLegend = function (regionRows) {
        console.log("Rendering legend since " + regionRows.length + " rows have arrived");

        // TODO: Do this in the map
        regionRows.forEach(row => {
            if (row.fillPattern) {
                row.fillPatternUrl = map.urlForFillPattern(row.fillPattern);
            }
        });
        const regionIndex = maxwell.indexRegionRows(regionRows);

        const selectableRegions = map.options.selectableRegions;

        const regionMarkupRows = selectableRegions.map(function (regionName) {
            return maxwell.legendKey.renderMarkup(maxwell.legendKey.rowTemplate, regionIndex[regionName], regionName);
        });
        const markup = regionMarkupRows.join("\n");
        container.innerHTML = markup;

        selectableRegions.forEach(function (regionName) {
            f(regionName).addEventListener("click", function () {
                map.selectedRegion.value = regionName;
            });
        });

        fluid.effect(function (selectedRegion) {
            selectableRegions.forEach(selectableRegion => {
                maxwell.toggleClass(f(selectableRegion), "imerss-selected", selectedRegion === selectableRegion);
            });
        }, map.selectedRegion.value);

    };

    fluid.effect(renderLegend, regionRowsSignal);
    fluid.effect(isVisible => maxwell.toggleClass(container, "mxcw-hidden", !isVisible), isVisibleSignal);

    return {container};
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


maxwell.addToVizColumn = function (parentContainer, jNode) {
    const target = parentContainer.find(".mxcw-vizColumn");
    target.append(jNode);
};

fluid.defaults("hortis.taxonDisplay.withClose", {
    selectors: {
        close: ".imerss-taxonDisplay-close"
    },
    markup: { /** TODO: This should probably be in a snippet/resource */
        taxonDisplayHeader:
            `<div class="imerss-taxonDisplay-close">
                <div>close</div>
                <div class="imerss-taxonDisplay-x">
                    <svg width="20" height="20">
                        <use href="#close-x" />
                    </svg>
                </div>
            </div>`
    },
    listeners: {
        "onCreate.bindClose": {
            args: ["{that}.container", "{that}.options.selectors.close", "{that}.selectedTaxonId"],
            /* TODO: Materialise all delegates! */
            func: (container, close, selectedTaxonId) => container.on("click", close, () => selectedTaxonId.value = null)
        }
    }
});

// Abstractish base grade common between those which can display info on a taxon in toggleable panel
fluid.defaults("maxwell.paneWithTaxonDisplay", {
    selectors: {
        taxonDisplay: ".imerss-taxonDisplay",
        panels: ".imerss-panel",
        sectionInner: ".mxcw-sectionInner",
        legends: ".imerss-map-legend"
    },
    // defaultPanel
    members: {
        selectedTaxonId: "@expand:signal(null)",
        panelHash: "@expand:maxwell.panelsToHash({that}.dom.panels)",
        paneSelect: "@expand:fluid.effect(maxwell.taxonToPanel, {that}.options.defaultPanel, {that}.panelHash, {that}.selectedTaxonId)",
        updateTaxonHash: "@expand:fluid.effect(maxwell.updateTaxonHash, {hashManager}, {vizLoader}.taxa.rowById, {that}.selectedTaxonId, {that}.isVisible)",
        rewriteTaxonLinks: `@expand:fluid.effect(maxwell.rewriteTaxonLinks, {that}.options.parentContainer,
             {that}.options.paneKey, {storyPage}.taxaByName, {that}.regionTaxa, {vizLoader}.resourcesLoaded)`,
        instantiateLegends: `@expand:fluid.effect(maxwell.paneHandler.instantiateLegends, {that}, {map}, {vizLoader}.regionLoader,
             {vizLoader}.resourcesLoaded)`
    },
    invokers: {
        // override from fluid.containerRenderingView
        addToParent: "maxwell.addToVizColumn({that}.options.parentContainer, {arguments}.0)"
    },
    components: {
        taxonDisplay: {
            type: "hortis.taxonDisplay",
            container: "{that}.dom.taxonDisplay",
            options: {
                gradeNames: "hortis.taxonDisplay.withClose",
                culturalValues: true,
                members: {
                    obsRows: "{vizLoader}.obsRows",
                    taxaById: "{vizLoader}.taxa.rowById",
                    selectedTaxonId: "{paneHandler}.selectedTaxonId"
                }
            }
        }
    }
});