"use strict";

/* global L, Plotly */

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

fluid.defaults("maxwell.markupTemplateRenderer", {
    // Bodge the sunburst loader to being a traditional templateRenderingView so that its markup arrives earlier -
    // In practice didn't manage to break the race condition. Port this into core imerss-viz
    rendererTemplateResources: {
        template: false,
        markup: true
    },
    invokers: {
        renderMarkup: "fluid.identity({that}.resources.markup.parsed)"
    }
});

fluid.incrementSignal = function (signal) {
    signal.value = (signal.value || 0) + 1;
};

fluid.decrementSignal = function (signal) {
    --signal.value;
};

// mixin grade which mediates event flow from IMERSS viz (reached via hortis.scrollyMapLoader) to Leaflet pane
// It is both a paneHandler as well as a sunburstLoader, which is defined in core viz leafletMap.js hortis.scrollyMapLoader
fluid.defaults("maxwell.storyVizBinder", {
    // Put these last to continue to override "container" member due to FLUID-5800
    gradeNames: ["maxwell.templatePaneHandler", "maxwell.markupTemplateRenderer"],
    resourceBase: ".",
    // Override this since we need proper ordering of overrides, review why the comment in leafletMap.js refers to FLUID-5836
    mapFlavourGrade: [],
    markupTemplate: "%resourceBase/html/imerss-viz-story.html",
    resourceOptions: {
        terms: {
            resourceBase: "{that}.options.resourceBase"
        }
    },
    styles: {
        paneClass: "mxcw-viz-pane"
    },
    resources: {
        markup: {
            url: "{that}.options.markupTemplate",
            dataType: "text"
        }
    },
    renderMarkup: true,
    model: {
    },
    members: {
        notifyResource: "@expand:fluid.incrementSignal({resourceNotifier}.outstandingResources)"
    },
    listeners: {
        "onCreate.paneClass": {
            func: (parentContainer, clazz) => parentContainer[0].classList.add(clazz),
            args: ["{that}.options.parentContainer", "{that}.options.styles.paneClass"]
        }
    }

});


fluid.registerNamespace("maxwell.legendKey");

maxwell.legendKey.rowTemplate = "<div class=\"fld-imerss-legend-row %rowClass\">" +
    "<span class=\"fld-imerss-legend-icon\"></span>" +
    "<span class=\"fld-imerss-legend-preview %previewClass\" style=\"%previewStyle\"></span>" +
    "<span class=\"fld-imerss-legend-label\">%keyLabel</span>" +
    "</div>";


maxwell.legendKey.renderMarkup = function (markup, clazz, className) {
    const style = hortis.fillColorToStyle(clazz.fillColor || clazz.color);
    const normal = hortis.normaliseToClass(className);
    return fluid.stringTemplate(markup, {
        rowClass: "fld-imerss-legend-row-" + normal,
        previewClass: "fld-imerss-class-" + normal,
        previewStyle: "background-color: " + style.fillColor,
        keyLabel: className
    });
};

// cf. Xetthecum's hortis.legendKey.drawLegend in leafletMapWithRegions.js - it has a block template and also makes
// a fire to selectRegion with two arguments. Also ours is a Leaflet control
maxwell.legendKey.drawLegend = function (map, paneHandler) {
    const regionRows = fluid.transform(map.regions, function (troo, regionName) {
        return maxwell.legendKey.renderMarkup(maxwell.legendKey.rowTemplate, map.regions[regionName], regionName);
    });
    const markup = Object.values(regionRows).join("\n");
    const legend = L.control({position: "bottomright"});
    const container = document.createElement("div");
    container.classList.add("mxcw-legend");
    container.innerHTML = markup;
    legend.onAdd = function () {
        return container;
    };
    legend.addTo(map.map);
    map.clazzToLegendNodes = fluid.transform(map.regions, function (troo, regionName) {
        const rowSel = ".fld-imerss-legend-row-" + hortis.normaliseToClass(regionName);
        const row = container.querySelector(rowSel);
        row.addEventListener("click", function () {
            paneHandler.triggerRegionSelection(regionName);
        });
    });
    return container;
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
    resizableParent: ".fl-imerss-checklist-outer"
});

maxwell.regionSelectionBar.hoist = function (element, that, paneHandler) {
    const target = paneHandler.container[0].querySelector(".fl-imerss-checklist-widgets");
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
                // Should agree with .fld-imerss-selected but seems that plotly cannot be reached via CSS
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


// Fix for horrific members merging bug occurring through lines like regions: "{sunburst}.viz.communities" above
maxwell.fixVizResources = function (sunburst) {
    sunburst.viz.classes = fluid.copyImmutableResource(sunburst.viz.classes);
    sunburst.viz.communities = fluid.copyImmutableResource(sunburst.viz.communities);
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

