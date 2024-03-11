"use strict";
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

fluid.defaults("maxwell.xetthecumEcologicalPane", {
    // add in "maxwell.withNativeLegend" when there is one
    gradeNames: ["maxwell.leafletPaneHandler", "maxwell.scrollyVizBinder"],
    events: {
        mapLoaded: null
    },
    mergePolicy: {
        checklistRanks: "replace"
    },
    checklistRanks: ["phylum"],
    nativeDataOnly: true,
    regionStyles: {
        unselectedOpacity: 0.5
    },
    modelListeners: {
        "paneToRegionSort": {
            // Duplicate of definition in maxwell.bareRegionsExtra imerss-viz-reknit ensuring that we display highlighted regions correctly
            path: "isVisible",
            funcName: "maxwell.regionsFromPane",
            args: ["{paneHandler}", "{scrollyPage}", "{change}.value"]
        }
    },
    components: {
        map: {
            options: {
                noClearSelection: true,
                listeners: {
                    "mapLoaded.selectRegion": "{paneHandler}.triggerRegionSelection({paneHandler}.options.selectRegion)"
                }
            }
        }
    }
});

maxwell.regionsFromPane = function (paneHandler, scrollyPage, isVisible) {
    if (isVisible) {
        hortis.leafletMap.showSelectedRegions(paneHandler.map, paneHandler.map.model.selectedRegions);
        maxwell.scrollyViz.sortRegions(paneHandler, scrollyPage);
    }
};

// Attested at https://getbootstrap.com/docs/5.0/getting-started/javascript/#no-conflict-only-if-you-use-jquery
// Need to prevent bootstrap's tooltip plugin (which is force-loaded by quarto) from conflicting with jQuery's which
// is in use in the viz
maxwell.revertTooltip = function () {
    console.log("Reverting ", $.fn.tooltip);
    const bootstrapTooltip = $.fn.tooltip.noConflict(); // return $.fn.button to previously assigned value
    $.fn.bootstrapTooltip = bootstrapTooltip; // give $().bootstrapBtn the Bootstrap functionality
};

document.addEventListener("DOMContentLoaded", maxwell.revertTooltip);
