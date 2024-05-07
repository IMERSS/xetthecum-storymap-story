"use strict";

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");

// Pane info widgets which appear immediately below map

fluid.defaults("maxwell.paneInfo", {
    gradeNames:  "fluid.templateRenderingView",
    parentContainer: "{paneHandler}.options.parentContainer",
    resources: {
        template: {
            url: "html/pane-info.html"
        }
    },
    injectionType: "prepend" // So it appears earlier than the viz markup, which uses "append"
});


// Used in Howe with "distribution" model, not currently used in bioblitz since it has more concrete grades bioblitz.js side
fluid.defaults("maxwell.withPaneInfo", {
    // paneInfoGrades: []
    components: {
        paneInfo: {
            type: "maxwell.paneInfo",
            options: {
                gradeNames: "{withPaneInfo}.options.paneInfoGrades"
            }
        }
    }
});

fluid.defaults("maxwell.paneInfoBinder", {
    gradeNames: "fluid.newViewComponent",
    markup: {
        infoText: "Selected biogeoclimatic region: %region"
    },
    selectors: {
        infoText: ".imerss-region"
    },
    invokers: {
        renderPaneInfoText: "maxwell.renderRegionName({that}.dom.infoText, {that}.options.markup.infoText, {arguments}.0)"
    },
    modelListeners: {
        renderInfoText: {
            path: "infoSource",
            listener: "{maxwell.paneInfoBinder}.renderPaneInfoText",
            args: "{change}.value"
        }
    }
});

maxwell.renderRegionName = function (target, template, region) {
    const text = fluid.stringTemplate(template, {region: region || "None"});
    target.text(text);
};

fluid.defaults("maxwell.withRegionPaneInfo", {
    gradeNames: "maxwell.withPaneInfo",
    // regionBinderGrades
    // regionInfoText
    distributeOptions: {
        regionBinderGrades: {
            source: "{that}.options.regionBinderGrades",
            target: "{that > paneInfo > regionBinder}.options.gradeNames"
        },
        // TODO: This distribution doesn't work, would need to get debuggable Infusion build
        regionInfoText: {
            source: "{that}.options.regionInfoText",
            target: "{that > paneInfo > regionBinder}.options.markup.infoText"
        }
    },
    components: {
        paneInfo: {
            type: "maxwell.regionPaneInfo",
            options: {
                // TODO: Necessary because of broken distribution
                components: {
                    regionBinder: {
                        options: {
                            markup: {
                                infoText: "{withPaneInfo}.options.regionInfoText"
                            }
                        }
                    }
                }
            }
        }
    }
});

// Mix in to a paneInfoBinder which is already a regionBinder for more refined region name including label
fluid.defaults("maxwell.withLabelledRegionName", {
    markup: {
        infoText: "Selected biogeoclimatic region: <span class=\"imerss-region-key\">%region</span> %regionLabel"
    },
    invokers: {
        renderPaneInfoText: "maxwell.renderLabelledRegionName({that}.dom.infoText, {that}.options.markup.infoText, {paneHandler}.options.regionLabels, {arguments}.0)"
    }
});

maxwell.renderLabelledRegionName = function (target, template, regionLabels, region) {
    const text = fluid.stringTemplate(template, {
        region: region || "None",
        regionLabel: region && regionLabels ? "(" + regionLabels[region] + ")" : ""
    });
    target.html(text);
};

/* Thie one gets used in Howe, together with maxwell.labelledRegionPaneInfo supplied as regionBinderGrades*/
fluid.defaults("maxwell.regionPaneInfo", {
    gradeNames: ["maxwell.paneInfo", "maxwell.withMapTitle", "maxwell.withDownloadLink"],
    components: {
        regionBinder: {
            type: "maxwell.paneInfoBinder",
            options: {
                container: "{paneInfo}.container",
                markup: {
                    infoText: "Selected biogeoclimatic region: %region"
                },
                selectors: {
                    infoText: ".imerss-region"
                },
                model: {
                    infoSource: "{paneHandler}.model.selectedRegion"
                }
            }
        }
    }
});

fluid.defaults("maxwell.labelledRegionPaneInfo", {
    components: {
        regionBinder: {
            options: {
                gradeNames: "maxwell.withLabelledRegionName"
            }
        }
    }
});

/** This one gets used in Marine Atlas as well as Status in Howe Sound */
fluid.defaults("maxwell.statusCellPaneInfo", {
    gradeNames: ["maxwell.paneInfo", "maxwell.withMapTitle", "maxwell.withDownloadLink"],
    components: {
        statusBinder: {
            type: "maxwell.paneInfoBinder",
            options: {
                container: "{paneInfo}.container",
                markup: {
                    infoText: "Selected status: %region"
                },
                selectors: { // Call it "region" so we don't need a whole new template - port back to bioblitz and rename
                    infoDisplay: ".imerss-region"
                },
                model: { // Note that Howe code calls this "selectedRegion" whereas bioblitz calls it "selectedStatus"
                    infoSource: "{paneHandler}.model.selectedRegion"
                }
            }
        }/*, // AS decided we don't want, keep it in reserve - selectedCell gets relayed in from code in bioblitz.js
        cellBinder: {
            type: "maxwell.regionNameBinder",
            options: {
                container: "{paneInfo}.container",
                markup: {
                    region: "Selected cell: %region"
                },
                selectors: {
                    regionDisplay: ".imerss-cell"
                },
                model: {
                    region: "{paneHandler}.model.selectedCell"
                }
            }
        }*/
    }
});

fluid.defaults("maxwell.withMapTitle", {
    selectors: {
        mapTitle: ".imerss-map-title"
    },
    listeners: {
        "onCreate.renderMapTitle": "maxwell.renderMapTitle({that}.dom.mapTitle, {paneHandler}.options.mapTitle)"
    }
});

maxwell.renderMapTitle = function (element, text) {
    element.text(text);
};