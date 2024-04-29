"use strict";
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");
// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

fluid.defaults("maxwell.paneWithTaxonDisplay", {
    selectors: {
        taxonDisplay: ".imerss-taxonDisplay",
        panels: ".imerss-panel",
        sectionInner: ".mxcw-sectionInner",
        legends: ".imerss-map-legend"
    },
    // defaultPanel
    members: {
        selectedTaxonId: "@expand:signal()",
        panelHash: "@expand:maxwell.panelsToHash({that}.dom.panels)",
        paneSelect: "@expand:fluid.effect(maxwell.taxonToPanel, {that}.options.defaultPanel, {that}.panelHash, {that}.selectedTaxonId)",
        updateTaxonHash: "@expand:fluid.effect(maxwell.updateTaxonHash, {hashManager}, {vizLoader}.taxa.rowById, {that}.selectedTaxonId, {that}.isVisible)",
        rewriteTaxonLinks: `@expand:fluid.effect(maxwell.rewriteTaxonLinks, {that}.options.parentContainer,
             {that}.options.paneKey, {storyPage}.taxaByName, {that}.regionTaxa, {vizLoader}.resourcesLoaded)`,
        instantiateLegends: `@expand:fluid.effect(maxwell.paneHandler.instantiateLegends, {that}, {map}, {vizLoader}.regionLoader,
             {vizLoader}.resourcesLoaded)`
    },
    invokers: {
        addToParent: "maxwell.addToSectionInner({that}.options.parentContainer, {arguments}.0)"
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

// TODO: Make general purpose widget instantiator
maxwell.paneHandler.instantiateLegends = function (paneHandler, map, regionLoader) {
    const containers = paneHandler.findAll("legends");
    containers.forEach(target => {
        const control = maxwell.legendKey.drawLegend(map, regionLoader.rows.value);
        fluid.spliceContainer(target, control.container, true);
    });
};

fluid.defaults("maxwell.taxonDisplayPane", {
    gradeNames: ["maxwell.storyVizPane", "maxwell.paneWithTaxonDisplay"],
    markupTemplate: "%resourceBase/html/imerss-viz-story-taxon.html",
    members: {
        regionTaxa: "@expand:fluid.computed(fluid.identity, {vizLoader}.taxa.rowById, fluid.identity)"
    },
    selectors: {
        dataPanel: ".imerss-panel-dataPanel"
    },
    listeners: {
        "onCreate.slingDataPane": "maxwell.paneHandler.slingDataPane({that})"
    },
    defaultPanel: "dataPanel"
});

maxwell.paneHandler.slingDataPane = function (that) {
    const panel = that.find("dataPanel");
    const inner = that.find("sectionInner");
    const toDataPanes = [...inner.querySelectorAll(".data-pane")];
    toDataPanes.forEach(toDataPane => panel.appendChild(toDataPane));
};

maxwell.accessRowCommonPhyla = function (row) {
    return row.rank === "phylum" ? {
        scientificName: row.commonName
    } : hortis.accessRowHulq(row);
};

fluid.defaults("maxwell.xetthecumEcologicalPane", {
    // add in "maxwell.withNativeLegend" when there is one
    gradeNames: ["maxwell.storyVizPane", "maxwell.paneWithTaxonDisplay"],
    markupTemplate: "%resourceBase/html/imerss-viz-story-checklist.html",
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
        checklist: ".imerss-simple-checklist-holder",
        checklistLabel: ".imerss-checklist-label"
    },
    defaultPanel: "checklist",
    markup: {
        checklistLabel: "%paneKey Community Species List"
    },

    listeners: {
        // Implementing this simple label was every bit as irritating as we imagined it would be
        "onCreate.renderChecklistLabel": {
            args: ["{that}.dom.checklistLabel.0", "{that}.options.markup.checklistLabel", "{that}.options.paneKey"],
            func: (node, template, paneKey) => node.innerHTML = fluid.stringTemplate(template, {paneKey})
        }
    },
    members: {
        regionToPane: "@expand:fluid.effect(maxwell.regionToPane, {storyPage}.map.selectedRegion, {paneHandler}, {storyPage})",
        regionObs: "@expand:fluid.computed(maxwell.filterRegionObs, {vizLoader}.obsRows, {that}.options.selectRegion)",
        regionTaxa: "@expand:fluid.computed(maxwell.nativeTaxaFromObs, {that}.regionObs, {vizLoader}.taxa.rowById, {that}.options.nativeDataOnly)",

        // TODO: Needs to be done at any time a hovered element gets hidden
        clearTooltips: "@expand:fluid.effect(hortis.clearAllTooltips, {that}.checklist, {that}.selectedTaxonId)",
        scrollVizToTop: "@expand:fluid.effect(maxwell.scrollVizToTop, {that}.container, {that}.selectedTaxonId)"
    },
    components: {
        checklist: {
            type: "hortis.checklist.withHolder",
            container: "{that}.dom.checklist",
            options: {
                gradeNames: "hortis.checklist.inLoader",
                rootId: 48460,
                filterRanks: "{paneHandler}.options.checklistRanks",
                invokers: {
                    accessRow: {
                        funcName: "maxwell.accessRowCommonPhyla"
                    }
                },
                members: {
                    rowById: "{vizLoader}.taxa.rowById",
                    // Perhaps eventually the map will allow interaction with obs
                    rowFocus: "{paneHandler}.regionTaxa",
                    allRowFocus: "{paneHandler}.regionTaxa",
                    selectedId: "{paneHandler}.selectedTaxonId"
                },
                listeners: {
                    "taxonSelect.selectTaxon": {
                        args: ["{paneHandler}.selectedTaxonId", "{arguments}.0"],
                        func: (selectedTaxonId, id) => selectedTaxonId.value = id
                    }
                }
            }
        }
    }
});

fluid.defaults("maxwell.storyPage.withSplitNavigation", {
    members: {
        splitRanges: "@expand:maxwell.storyPage.constructRanges({that})"
    }
    //listeners: {
    //    "onCreate.constructRanges": "maxwell.storyPage.constructRanges"
    //}
});

maxwell.storyPage.constructRanges = function (storyPage) {
    const storyPanes = fluid.queryIoCSelector(storyPage, "maxwell.taxonDisplayPane", true);
    const regionPanes = fluid.queryIoCSelector(storyPage, "maxwell.xetthecumEcologicalPane", true);

    const toIndex = paneHandler => maxwell.paneKeyToIndex(paneHandler, storyPage);

    const storyIndices = storyPanes.map(toIndex);
    const regionIndices = regionPanes.map(toIndex);

    const navRanges = [storyIndices, regionIndices];
    const indexToRange = [];
    storyIndices.forEach(index => indexToRange[index] = 0);
    regionIndices.forEach(index => indexToRange[index] = 1);

    return {navRanges, indexToRange};
};

maxwell.addToSectionInner = function (parentContainer, jNode) {
    const target = parentContainer.find(".mxcw-sectionInner");
    target.append(jNode);
};

maxwell.rewriteTaxonLinks = function (parentContainer, paneKey, taxaByName, regionTaxa) {
    const target = parentContainer.find(".mxcw-sectionInner")[0];
    const links = [...target.querySelectorAll("a")];
    links.forEach(link => {
        const hash = link.hash;
        if (hash.startsWith("#taxon:")) {
            const newHash = `#pane:${paneKey}&` + hash.substring("#".length);
            link.hash = newHash;
            const taxon = decodeURIComponent(hash.substring("#taxon:".length));
            const row = taxaByName[taxon];
            if (!row) {
                console.log(`Taxon ${taxon} linked in pane ${paneKey} not found`);
            } else if (!regionTaxa[row.id]) {
                console.log(`Taxon ${taxon} linked in pane ${paneKey} was not found for this region`);
            }
        }
    });
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
                    <svg width="23" height="23">
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

maxwell.panelsToHash = function (panels) {
    const togo = {};
    [...panels].forEach(panel => {
        [...panel.classList].forEach(clazz => {
            if (clazz.startsWith("imerss-panel-")) {
                const suffix = clazz.substring("imerss-panel-".length);
                togo[suffix] = panel;
            }
        });
    });
    return togo;
};

maxwell.taxonToPanel = function (defaultPanel, panelHash, selectedTaxonId) {
    // TODO: Proper tabbed panel impl, perhaps wrapping jQuery tabs? Certainly not bootstrap's!
    if (selectedTaxonId) {
        panelHash[defaultPanel].classList.remove("imerss-activePanel");
        panelHash.taxonDisplay.classList.add("imerss-activePanel");
    } else {
        panelHash[defaultPanel].classList.add("imerss-activePanel");
        panelHash.taxonDisplay.classList.remove("imerss-activePanel");
    }
};

maxwell.scrollVizToTop = function (container) {
    container[0].scrollTop = 0;
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
