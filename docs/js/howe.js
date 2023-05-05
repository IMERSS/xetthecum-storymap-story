"use strict";

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");

fluid.defaults("maxwell.howeVizBinder", {
    gradeNames: "maxwell.withPaneInfo",
    phyloMap: "%resourceBase/json/howePhyloMap.json"
});

/*
We wanted to write
    modelRelay: {
        regionTextDisplay: {
             target: "{that}.model.dom.regionDisplay.text",
            args: ["{that}.options.markup.region", "{map}.model.mapBlockTooltipId"],
            func: (template, selectedRegion) => fluid.stringTemplate(template, selectedRegion || "None")
        }
    }

But got a circular model evaluation in evaluateContainers - it fires onDomBind immediately after evaluating the
containers and the model is not done yet for some reason - why is it done usually, so that we can materialise
against it?
 */

fluid.defaults("maxwell.howeStatusBinder", {
    listeners: {
        "onCreate.fixLayout": "maxwell.howeStatusBinder.fixLayout"
    }
});

maxwell.howeStatusBinder.fixLayout = function (that) {
    const widgetPane = that.options.parentContainer[0].querySelector(".plotly.html-widget");
    widgetPane.setAttribute("style", "width: 100%");
    // Tell plotly to resize the widgets inside
    window.dispatchEvent(new Event("resize"));
};
