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
