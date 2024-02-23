"use strict";
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");

fluid.defaults("maxwell.runningHeaderUpdater", {
    modelListeners: {
        "updateRunningHeader": {
            path: "activeSection",
            funcName: "maxwell.updateRunningHeader",
            args: ["{that}", "{change}.value"]
        }
    }
});

maxwell.updateRunningHeader = function (scrollyPage, activeSection) {
    const sectionHolder = scrollyPage.sectionHolders[activeSection];
    const heading = sectionHolder.section.querySelector("h2");
    const headingText = heading.innerHTML;
    const runningHeader = document.querySelector(".running-header");
    runningHeader.innerHTML = headingText;
};

fluid.defaults("maxwell.xetthecumEcologicalPane", {
    // add in "maxwell.withNativeLegend" when there is one
    gradeNames: ["maxwell.leafletPaneHandler", "maxwell.scrollyVizBinder"],
    members: {
        // Move the DOM binder up one level so that we can reach into the data pane to look for the tabs
        dom: "@expand:fluid.createDomBinder({that}.options.parentContainer, {that}.options.selectors)"
    },
    selectors: {
        tabs: ".nav-tabs"
    },
    events: {
        mapLoaded: null
    },
    mergePolicy: {
        checklistRanks: "replace"
    },
    checklistRanks: ["phylum"],
    nativeDataOnly: true,
    components: {
        map: {
            options: {
                listeners: {
                    mapLoaded: {
                        namespace: "toPaneHandler",
                        func: "{xetthecumEcologicalPane}.events.mapLoaded.fire"
                    }
                }
            }
        },
        tabs: {
            type: "maxwell.bootstrapTabs",
            // Map needs to be drawn so we can sort its paths for any initial selection found in the tabs markup
            createOnEvent: "mapLoaded",
            container: "{that}.dom.tabs",
            options: {
                model: {
                    selectedTab: "{paneHandler}.model.selectedRegion"
                },
                invokers: {
                    selectTab: "{paneHandler}.triggerRegionSelection({arguments}.0)"
                }
            }
        }
    },
    regionStyles: {
        unselectedOpacity: 0.5
    }
});

// Attested at https://getbootstrap.com/docs/5.0/getting-started/javascript/#no-conflict-only-if-you-use-jquery
// Need to prevent bootstrap's tooltip plugin (which is force-loaded by quarto) from conflicting with jQuery's which
// is in use in the viz
maxwell.revertTooltip = function () {
    console.log("Reverting ", $.fn.tooltip);
    const bootstrapTooltip = $.fn.tooltip.noConflict(); // return $.fn.button to previously assigned value
    $.fn.bootstrapTooltip = bootstrapTooltip; // give $().bootstrapBtn the Bootstrap functionality
};

document.addEventListener("DOMContentLoaded", maxwell.revertTooltip);
