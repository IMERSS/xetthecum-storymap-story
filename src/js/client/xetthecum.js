"use strict";
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

fluid.defaults("maxwell.xetthecumEcologicalPane", {
    // add in "maxwell.withNativeLegend" when there is one
    gradeNames: ["maxwell.storyVizBinder"],
    events: {
        mapLoaded: null
    },
    mergePolicy: {
        checklistRanks: "replace"
    },
    // selectRegion from config
    checklistRanks: ["phylum"],
    nativeDataOnly: true,
    regionStyles: {
        unselectedOpacity: 0.5
    },
    selectors: {
        checklist: ".fl-imerss-checklist-holder"
    },
    members: {
        regionToPane: "@expand:fluid.effect(maxwell.regionToPane, {storyPage}.map.selectedRegion, {paneHandler}, {storyPage})",
        regionObs: "@expand:fluid.computed(maxwell.filterRegionObs, {vizLoader}.obsRows, {that}.options.selectRegion)",
        regionTaxa: "@expand:fluid.computed(maxwell.nativeTaxaFromObs, {that}.regionObs, {vizLoader}.taxa.rowById, {that}.options.nativeDataOnly)"
    },

    components: {
        checklist: {
            type: "hortis.checklist.withHolder",
            container: "{that}.dom.checklist",
            options: {
                gradeNames: "hortis.checklist.inLoader",
                rootId: 1,
                filterRanks: "{paneHandler}.options.checklistRanks",
                members: {
                    rowById: "{vizLoader}.taxa.rowById",
                    // Perhaps eventually the map will allow interaction with obs
                    rowFocus: "{paneHandler}.regionTaxa",
                    allRowFocus: "{paneHandler}.regionTaxa"
                }
            }
        }
    }
});

maxwell.filterRegionObs = function (obsRows, region) {
    return obsRows.filter(row => row.Community === region);
};

// cf. hortis.taxaFromObs - more efficient to just munge this all together, vive la concrescence
maxwell.nativeTaxaFromObs = function (obsRows, rowById, nativeDataOnly) {
    const taxonIds = {};
    obsRows.forEach(row => {
        const id = row["iNaturalist taxon ID"];
        const taxon = rowById[id];
        if (taxon["Hulquminum Name"] || !nativeDataOnly) {
            taxonIds[id] = true;
        }
    });
    return hortis.closeParentTaxa(taxonIds, rowById);
};


// When a region is selected directly, update the active section + pane to this one
maxwell.regionToPane = function (selectedRegion, paneHandler, storyPage) {
    if (selectedRegion === paneHandler.options.selectRegion) {
        const index = storyPage.paneKeyToIndex[selectedRegion];
        storyPage.applier.change("activeSection", index);
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
