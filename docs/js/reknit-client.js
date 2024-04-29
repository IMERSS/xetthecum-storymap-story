"use strict";

/* global HTMLWidgets, maplibregl, Plotly */

// Monkey-patch core framework to support wide range of primitives and JSON initial values
fluid.coerceToPrimitive = function (string) {
    return /^(true|false|null)$/.test(string) || /^[\[{0-9]/.test(string) && !/^{\w/.test(string) ? JSON.parse(string) : string;
};

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var hortis = fluid.registerNamespace("hortis");

maxwell.asyncForEach = async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

/**
 * An integer
 *
 * @typedef {Number} Integer
 */

/**
 * A "call" structure instantiating an HTMLWidget
 *
 * @typedef {Object} HTMLWidgetCall
 * @property {String} method - The name of the method call
 * @property {Object[]} args - The arguments to the call
 */

/**
 * Information about a section element of a storymapping interface
 *
 * @typedef {Object} SectionHolder
 * @property {String} paneName - The name of the paneHandler for this section
 * @property {HTMLElement} section - The section node housing the widget
 * @property {HTMLElement} heading - The heading (currently h2 node) housing the widget
 * @property {String} headingText - The text of the heading node
 */

/**
 * Decoded information about a storymapping map widget
 *
 * @typedef {SectionHolder} MapWidgetInfo
 * @property {HTMLElement} [widget] - The DOM node holding the widget
 * @property {Object} data - The `data` entry associated with the map widget
 * @property {Array} subPanes - Any subpanes to which the widget's calls are allocated
 */

fluid.defaults("maxwell.widgetHandler", {
    gradeNames: "fluid.component",
    widgetKey: "{sourcePath}",
    events: {
        bindWidget: null
    },
    listeners: {
        "bindWidget.first": {
            priority: "first",
            func: "maxwell.widgetHandler.bindFirst"
        }
    }
});

maxwell.widgetHandler.bindFirst = function (element, that) {
    that.element = element;
};

fluid.defaults("maxwell.withResizableWidth", {
    resizableParent: ".mxcw-widgetPane",
    listeners: {
        "bindWidget.makeResizable": {
            func: "maxwell.makeResizableWidth",
            args: ["{arguments}.0", "{paneHandler}", "{that}.options.resizableParent"]
        }
    }
});

maxwell.findPlotlyWidgetId = function (widget) {
    return widget.layout?.meta?.mx_widgetId;
};

maxwell.makeResizableWidth = function (element, paneHandler, selector) {
    // TODO: remove listener on destruction
    window.addEventListener("resize", function () {
        const parent = element.closest(selector);
        const newWidth = parent.clientWidth;
        if (newWidth > 0) {
            Plotly.relayout(element, {width: newWidth});
        }
    });
};

fluid.defaults("maxwell.choroplethSlider", {
    gradeNames: "maxwell.widgetHandler",
    listeners: {
        "bindWidget.impl": "maxwell.choroplethSlider.bind"
    }
});

maxwell.choroplethSlider.bind = function (element, that, paneHandler, storyPage) {
    const slider = element;
    const paneIndex = paneHandler.options.paneIndex;

    slider.on("plotly_sliderchange", function (e) {
        console.log("Slider change ", e);
        storyPage.applier.change(["activeSubPanes", paneIndex], e.slider.active);
        if (that.timer) {
            window.clearInterval(that.timer);
            delete that.timer;
        }
    });
    // Initialises with the assumption that the 0th subpane should be initially active - makes sense for choropleths
    // but what about others?
    storyPage.applier.change(["activeSubPanes", paneIndex], 0);
};

fluid.defaults("maxwell.withSliderAnimation", {
    delay: 1000,
    listeners: {
        "bindWidget.withSliderAnimation": {
            priority: "after:impl",
            funcName: "maxwell.withSliderAnimation.bind"
        }
    }
});

maxwell.withSliderAnimation.bind = function (element, that, paneHandler, storyPage) {
    const limit = element.data.length;
    const paneIndex = paneHandler.options.paneIndex;
    that.timer = window.setInterval(function () {
        const current = storyPage.model.activeSubPanes[paneIndex];
        const next = (current + 1) % limit;
        // This updates the slider position and label, but not the plot
        Plotly.relayout(element, {"sliders.0.active": next});
        // This updates visibility of the plot - unknown why this doesn't happen from the former
        Plotly.restyle(element, {visible: element.layout.sliders[0].steps[next].args[1]});
        storyPage.applier.change(["activeSubPanes", paneIndex], next);
    }, that.options.delay);
};

maxwell.findPlotlyWidgets = function (storyPage, sectionHolders) {
    const widgets = [...document.querySelectorAll(".html-widget.plotly")];
    const sections = fluid.getMembers(sectionHolders, "section");

    console.log("Found " + widgets.length + " plotly widgets");
    widgets.forEach(function (widget) {
        const pane = widget.closest("section");
        const widgetId = maxwell.findPlotlyWidgetId(widget);
        const index = sections.indexOf(pane);

        console.log("Plotly widget's pane index is " + index + " with id " + widgetId);
        const paneName = storyPage.sectionHolders[index].paneName;
        const paneHandler = paneName && maxwell.paneHandlerForName(storyPage, paneName);
        if (widgetId) {
            const handler = maxwell.widgetHandlerForName(paneHandler, widgetId);
            if (handler) {
                handler.events.bindWidget.fire(widget, handler, paneHandler, storyPage, paneHandler);
            } else {
                console.log("No widget handler configured for widget with id ", widgetId);
            }
        } else {
            console.log("Warning: no widget id found for plotly widget ", widget);
        }
    });
};

// From https://gis.stackexchange.com/questions/31951/showing-popup-on-mouse-over-not-on-click-using-leaflet
maxwell.hoverPopup = function (layer, paneOptions) {
    const mouseHandler = function (ev) {
        layer.openPopup(ev.latlng);
        console.log("Open popup for pane " + paneOptions.pane);
    };
    layer.on("mouseover", mouseHandler);
    layer.on("mousemove", mouseHandler);
    layer.on("mouseout", function () {
        this.closePopup();
    });
};

fluid.defaults("maxwell.withNativeLegend", {
    modelListeners: {
        legendVisible: {
            path: "{paneHandler}.model.isVisible",
            func: "maxwell.toggleClass",
            args: ["{that}.legendContainer", "mxcw-hidden", "{change}.value", true]
        }
    }
});

maxwell.decodePaneName = function (node) {
    const nameHolder = [...node.classList].find(clazz => clazz.startsWith("mxcw-paneName-"));
    return nameHolder.substring("mxcw-paneName-".length);
};

// Index the collection of sectionHolder structure by paneHandlerName
maxwell.sectionHoldersToIndex = function (sectionHolders) {
    const togo = {};
    sectionHolders.forEach(function (sectionHolder, index) {
        togo[sectionHolder.paneName] = index;
    });
    return togo;
};

/**
 * Decodes the document structure surrounding an array of DOM nodes representing map widgets
 * @param {maxwell.storyPage} storyPage - The overall storyPage component
 * @return {SectionHolder[]} An array of structures representing the section holders
 */
maxwell.mapSectionHolders = function (storyPage) {
    const sections = storyPage.locate("sections");
    console.log("Found " + sections.length + " sections");
    const togo = [...sections].map(function (section) {
        const heading = section.querySelector("h2");
        const paneNameHolder = section.querySelector(".mxcw-mapPane");
        const paneName = maxwell.decodePaneName(paneNameHolder);
        return {
            section, heading, paneName,
            subPanes: [],
            headingText: heading.innerText
        };
    });
    return togo;
};


// Search through an HTMLWidgets "calls" structure for a method with particular name
maxwell.findCall = function (calls, method) {
    return calls.find(call => call.method === method);
};

maxwell.toggleClass = function (container, clazz, value, inverse) {
    container.classList[value ^ inverse ? "add" : "remove"](clazz);
};

maxwell.toggleActiveClass = function (nodes, clazz, selectedIndex) {
    nodes.forEach(function (node, i) {
        maxwell.toggleClass(node, clazz, i === selectedIndex);
    });
};

maxwell.updateActiveWidgetSubPanes = function (that, effectiveActiveSubpanes) {
    effectiveActiveSubpanes.forEach((subPaneIndex, index) => {
        const subPanes = that.leafletWidgets[index].subPanes.map(paneInfo => paneInfo.pane);
        maxwell.toggleActiveClass(subPanes, "mxcw-activeMapPane", subPaneIndex);
    });
};

maxwell.normaliseBounds = function (bounds) {
    return [+bounds[0], +bounds[1], +bounds[2], +bounds[3]];
};

maxwell.expandBounds = function (bounds, factor) {
    const [lat1, long1, lat2, long2] = maxwell.normaliseBounds(bounds);

    // Calculating the central point of the bounding box
    const centerLat = (lat1 + lat2) / 2;
    const centerLong = (long1 + long2) / 2;

    // Calculating the new dimensions of the bounding box
    const newLat1 = centerLat - (centerLat - lat1) * factor;
    const newLong1 = centerLong - (centerLong - long1) * factor;
    const newLat2 = centerLat + (lat2 - centerLat) * factor;
    const newLong2 = centerLong + (long2 - centerLong) * factor;

    // Creating and returning the expanded bounds array
    return [newLat1, newLong1, newLat2, newLong2];
};

maxwell.paneKeyToIndex = function (handler, storyPage) {
    const key = fluid.getForComponent(handler, "options.paneKey");
    const paneKeyToIndex = fluid.getForComponent(storyPage, "paneKeyToIndex");
    const index = paneKeyToIndex[key];
    if (index === undefined) {
        fluid.fail("Unable to look up section handler with name " + key + " to a data pane index");
    }
    return index;
};

/**
 * Given a paneHandler component, find its section holder
 * @param {maxwell.scrollyPaneHandler} handler - The paneHandler to be looked up
 * @param {maxwell.storyPage} storyPage - The overall storyPage component
 * @return {jQuery} A jQuery-wrapped container node suitable for instantiating a component.
 */
maxwell.sectionForPaneHandler = function (handler, storyPage) {
    const index = maxwell.paneKeyToIndex(handler, storyPage);
    return fluid.container(storyPage.sectionHolders[index].section);
};

maxwell.paneHandlerForRegion = function (storyPage, region) {
    const paneHandlers = fluid.queryIoCSelector(storyPage, "maxwell.paneHandler", true);
    return paneHandlers.find(handler => fluid.getForComponent(handler, "options.selectRegion") === region);
};

maxwell.paneHandlerForName = function (storyPage, paneName) {
    const paneHandlers = fluid.queryIoCSelector(storyPage, "maxwell.paneHandler", true);
    return paneHandlers.find(handler => fluid.getForComponent(handler, "options.paneKey") === paneName);
};

maxwell.paneHandlerForIndex = function (storyPage, paneIndex) {
    const paneHandlers = fluid.queryIoCSelector(storyPage, "maxwell.paneHandler", true);
    return paneHandlers.find(handler => fluid.getForComponent(handler, "options.paneIndex") === paneIndex);
};

maxwell.widgetHandlerForName = function (paneHandler, widgetId) {
    const widgetHandlers = fluid.queryIoCSelector(paneHandler, "maxwell.widgetHandler", true);
    return widgetHandlers.find(handler => fluid.getForComponent(handler, "options.widgetKey") === widgetId);
};

maxwell.unflattenOptions = function (records) {
    return fluid.transform(records, record => ({
        type: record.type,
        options: fluid.censorKeys(record, ["type"])
    }));
};

maxwell.resolvePaneHandlers = function () {
    // Written into the markup by maxwell.reknitFile in reknit.js
    const rawPaneHandlers = maxwell.scrollyPaneHandlers;
    return maxwell.unflattenOptions(rawPaneHandlers);
};

// Basic style: https://github.com/maplibre/maplibre-gl-js/issues/638
fluid.defaults("hortis.libreMap", {
    gradeNames: "fluid.viewComponent",
    mapOptions: {
        style: {
            version: 8,
            layers: [],
            sources: {}
        }
    },
    members: {
        map: "@expand:hortis.libreMap.make({that}.container.0, {that}.options.mapOptions, {that}.mapLoaded, {that}.loadFillPatterns)",
        mapLoaded: "@expand:signal()",
        hasBounds: false,
        selectedRegion: "@expand:signal()"
    },
    invokers: {
        urlForFillPattern: {
            args: ["{that}.options.fillPatternPath", "{arguments}.0"],
            func: (fillPatternPath, fillPattern) => fillPatternPath + fillPattern + ".png"
        },
        loadFillPatterns: "hortis.libreMap.loadFillPatterns({that}, {that}.options.fillPatternPath, {that}.options.fillPatterns)"
    },
    modelListeners: {
        paneToRegion: {
            path: "{storyPage}.model.activePane",
            args: ["{storyPage}", "{map}", "{change}.value"],
            funcName: "maxwell.paneToRegion"
        }
    },
    listeners: {
        "onCreate.bindRegionSelect": "hortis.libreMap.bindRegionSelect({that})"
    }
});

maxwell.paneToRegion = function (storyPage, map, activePane) {
    const paneHandler = maxwell.paneHandlerForIndex(storyPage, activePane);
    const selectRegion = paneHandler?.options.selectRegion;
    map.selectedRegion.value = selectRegion;
};

hortis.libreMap.bindRegionSelect = function (that) {
    const map = that.map;
    that.options.selectableRegions.forEach(selectableRegion => {
        map.on("click", selectableRegion, (e) => {
            console.log("Region ", selectableRegion, " clicked: ", e);
            that.selectedRegion.value = selectableRegion;
        });
        // https://stackoverflow.com/a/59203845
        map.on("mouseenter", selectableRegion, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", selectableRegion, () => {
            map.getCanvas().style.cursor = "";
        });
    });
};

hortis.libreMap.loadFillPatterns = function (map, fillPatternPath, fillPatterns) {
    return maxwell.asyncForEach(Object.keys(fillPatterns || {}), async fillPattern => {
        const url = map.urlForFillPattern(fillPattern);
        const image = await map.map.loadImage(url);
        console.log("Loaded image ", url);
        // Explained in https://github.com/mapbox/mapbox-gl-js/pull/9372
        // Drawn in here: https://github.com/mapbox/mapbox-gl-js/blob/3f1d023894f1fa4d0d2dae0f9ca284a8bab19eaf/js/render/draw_fill.js#L139
        // Or maybe in here, looks very different in libre: https://github.com/maplibre/maplibre-gl-js/blob/main/src/render/draw_fill.ts#L112
        map.map.addImage(fillPattern, image.data, {pixelRatio: 6});
    });
};

hortis.libreMap.make = function (container, mapOptions, mapLoaded, loadFillPatterns) {
    const emptyOptions = fluid.copy(fluid.defaults("hortis.libreMap").mapOptions);
    const map = new maplibregl.Map({container, ...emptyOptions});
    // Very long-standing bugs with mapbox load event: https://github.com/mapbox/mapbox-gl-js/issues/6707
    // and https://github.com/mapbox/mapbox-gl-js/issues/9779
    map.on("load", async function () {
        console.log("Map loaded");
        await loadFillPatterns();
        // Have to do this after fill patterns are loaded otherwise images are not resolved
        map.setStyle(mapOptions.style);
        map.once("styledata", () => {
            mapLoaded.value = 1;
        });
    });
    map.addControl(new maplibregl.NavigationControl({showCompass: false}));
    // disable map rotation using right click + drag
    map.dragRotate.disable();
    // disable map rotation using touch rotation gesture
    map.touchZoomRotate.disableRotation();
    return map;
};

fluid.defaults("hortis.libreMap.inStoryPage", {
    gradeNames: "hortis.libreMap",
    container: "{storyPage}.dom.map",
    zoomDuration: "{storyPage}.options.zoomDuration",
    selectableRegions: "{storyPage}.options.selectableRegions",
    fillPatternPath: "{storyPage}.options.fillPatternPath",
    mapboxData: "@expand:maxwell.resolveMapboxData()",
    fillPatterns: "{that}.options.mapboxData.fillPatterns",
    style: {
        transition: {
            duration: "{that}.options.zoomDuration"
        }
    }
});

fluid.defaults("hortis.libreMap.withRegionLegend", {
    members: {
        instantiateLegends: `@expand:fluid.effect(maxwell.legendKey.addLegendControl, {map}, {vizLoader}.regionLoader.rows,
             {vizLoader}.resourcesLoaded)`
    }
});

maxwell.resolveMapboxData = function () {
    const data = maxwell.mapboxData;
    return fluid.copyImmutableResource(data);
};

fluid.defaults("maxwell.storyPage", {
    gradeNames: ["fluid.viewComponent", "fluid.resourceLoader"],
    container: "body",
    // zoomDuration: 100,
    // selectableRegions: [],
    // fillPatternPath
    // mapFlavourGrade
    resources: {
        plotlyReady: {
            promiseFunc: "maxwell.HTMLWidgetsPostRender"
        }
    },
    //mapFlavourGrade: [],
    selectors: {
        sections: ".section.level2",
        heading: "h2",
        map: ".mxcw-map",
        mapHolder: ".mxcw-map-holder",
        content: ".mxcw-content",
        sectionLeft: ".section-left",
        sectionLeftDesc: ".section-left-desc",
        sectionLeftText: ".section-left-text",
        sectionRight: ".section-right",
        sectionRightDesc: ".section-right-desc",
        sectionRightText: ".section-right-text"
    },
    components: {
        map: {
            type: "hortis.libreMap",
            options: {
                gradeNames: ["hortis.libreMap.inStoryPage", "{storyPage}.options.mapFlavourGrade"],
                mapOptions: {
                    style: "{that}.options.mapboxData.rootMap.x.layout.mapbox.style"
                }
            }
        },
        hashManager: {
            type: "maxwell.hashManager"
        }
    },
    paneHandlers: "@expand:maxwell.resolvePaneHandlers()",
    dynamicComponents: {
        paneHandlers: {
            sources: "{that}.options.paneHandlers",
            type: "{source}.type",
            options: "{source}.options"
        }
    },
    members: {
        sectionHolders: "@expand:maxwell.mapSectionHolders({that})",
        paneKeyToIndex: "@expand:maxwell.sectionHoldersToIndex({that}.sectionHolders)",
        outstandingResources: "@expand:signal(0)",
        activePane: "@expand:signal()",
        // "model listeners"
        updateActiveMapPane: "@expand:fluid.effect(maxwell.updateActiveMapPane, {that}, {that}.map, {that}.activePane, {that}.map.mapLoaded)"
    },
    invokers: {
        navSection: "maxwell.navSection({that}.splitRanges, {arguments}.0, {arguments}.1)"
    },
    model: {
        // Currently this is at the head of updates - > activePane in model and then activePane signal
        activeSection: 0,
        activePane: 0,
        // Map of pane indices to active subpanes
        activeSubPanes: [],
        // Map of pane indices to active subpanes, with inactive panes having their subpane index set to -1
        effectiveActiveSubpanes: [],
        // Prevent the component trying to render until plotly's postRenderHandler has fired
        plotlyReady: "{that}.resources.plotlyReady.parsed"
    },
    modelListeners: {
        updateSectionClasses: {
            path: "activeSection",
            funcName: "maxwell.updateSectionClasses",
            args: ["{that}", "{change}.value"]
        },
        updateSectionNav: {
            path: "activeSection",
            funcName: "maxwell.updateSectionNav",
            args: ["{that}", "{change}.value"]
        },
        // Transmit the activePane model to the corresponding signal
        updateActivePaneSignal: {
            path: "activePane",
            args: ["{that}.activePane", "{change}.value"],
            func: (activePaneSignal, activePane) => {activePaneSignal.value = activePane;},
            priority: "last"
        },
        mapVisible: {
            path: "activePane",
            funcName: "maxwell.updateMapVisible",
            args: ["{that}", "{change}.value"],
            priority: "first" // ensure map becomes visible before we attempt to set its initial bounds
        },
        updatePaneHash: {
            // Close any open taxon panel - perhaps better to react to a change in activeSection instead,
            // but we will still have the standard difficulty of distinguishing an initial value
            path: "activePane",
            funcName: "maxwell.updatePaneHash",
            args: ["{storyPage}", "{hashManager}", "{change}.value"],
            excludeSource: "init"
        },
        listenPaneHash: {
            path: "{hashManager}.model.pane",
            funcName: "maxwell.listenPaneHash",
            args: ["{storyPage}", "{change}.value"]
        },
        updateActiveWidgetSubPanes: {
            path: "effectiveActiveSubpanes",
            funcName: "maxwell.updateActiveWidgetSubPanes",
            args: ["{that}", "{change}.value"]
        }
    },
    modelRelay: {
        // TODO: Abolish activePane since we can't trigger updates from it
        sectionToPane: {
            source: "activeSection",
            target: "activePane",
            funcName: "fluid.identity"
        },
        subPanesToEffective: {
            target: "effectiveActiveSubpanes",
            func: "maxwell.subPanesToEffective",
            args: ["{that}.model.activePane", "{that}.model.activeSubPanes"]
        }
    },
    listeners: {
        "onCreate.listenSectionButtons": "maxwell.listenSectionButtons({that})",
        // This will initialise subPaneIndices quite late
        "onCreate.findPlotlyWidgets": "maxwell.findPlotlyWidgets({that}, {that}.sectionHolders)"
    }
});

// Convert the HTMLWidgets postRenderHandler into a promise
maxwell.HTMLWidgetsPostRender = function () {
    const togo = fluid.promise();
    if (HTMLWidgets.addPostRenderHandler) {
        HTMLWidgets.addPostRenderHandler(function () {
            togo.resolve(true);
        });
    } else {
        togo.resolve(true);
    }
    return togo;
};

maxwell.updateSectionClasses = function (that, activeSection) {
    maxwell.toggleActiveClass(that.sectionHolders.map(sectionHolder => sectionHolder.section), "mxcw-activeSection", activeSection);
};

maxwell.updatePaneHash = function (storyPage, hashManager, paneIndex) {
    const paneHandler = maxwell.paneHandlerForIndex(storyPage, paneIndex);
    const paneKey = paneHandler.options.paneKey;
    if (!fluid.globalInstantiator.hashSource) {
        // Blast the taxon in the hash since taxon selected for one panel will not be good for another
        fluid.replaceModelValue(hashManager.applier, [], {pane: paneKey, taxon: null});
    }
};

maxwell.listenPaneHash = function (storyPage, paneName) {
    const paneHandler = maxwell.paneHandlerForName(storyPage, paneName);
    const paneIndex = paneHandler ? paneHandler.options.paneIndex : 0;
    // TODO: Abolish distinction between pane indices and section indices
    storyPage.applier.change("activeSection", paneIndex);
};

/**
 * Convert the pane and subpane selection index state to an array of effectively active panes
 * @param {Integer} activePane - The currently active pane
 * @param {Integer[]} activeSubPanes - The array of currently active subpanes
 * @return {Integer[]} An array of pane visibility flags, with inactive panes having subpane index censored to -1
 */
maxwell.subPanesToEffective = function (activePane, activeSubPanes) {
    return activeSubPanes.map((activeSubPane, index) => index === activePane ? activeSubPane : -1);
};

maxwell.layerOpacityProperty = function (layer) {
    return layer.type === "line" ? "line-opacity" :
        layer.type === "fill" ? "fill-opacity" : null;
};

maxwell.updateActiveMapPane = function (that, map, activePane) {
    const activePaneName = that.sectionHolders[activePane]?.paneName;

    const mapboxData = map.options.mapboxData;

    const layers = map.options.mapOptions.style.layers;
    const layerVisibility = mapboxData.layersByPaneId[activePaneName] || {};
    layers.forEach((layer) => {
        const opacityProp = maxwell.layerOpacityProperty(layer);
        if (opacityProp) {
            // TODO: possible optimisation here from maplibre-gl-dev.js
            //         this.style.setPaintProperty(layerId, name, value, options);
            //         return this._update(true);
            map.map.setPaintProperty(layer.id, opacityProp, layerVisibility[layer.id] ? 1 : 0);
        }
    });

    // TODO: Perhaps assign these into paneHandlers if frequently used?
    const widgetData = mapboxData.mapWidgets[activePaneName]?.x.layout.mapbox;
    const currentZoom = map.map.getZoom();

    // Pretty terrible, there is no longer an ability to specify a callback: https://github.com/mapbox/mapbox-gl-js/issues/1794
    // API docs claim "maxDuration" but there is not
    const zoom = fluid.promise();
    if (widgetData) {
        if (map.hasBounds) {
            const zoomRatio = Math.abs(Math.log(currentZoom / widgetData.zoom));
            // For zooms greater than a certain magnitude, do a much slower zoom
            const zoomDuration = zoomRatio > 0.3 ? that.options.slowZoomDuration : that.options.zoomDuration;
            map.map.flyTo({
                center: widgetData.center,
                zoom: widgetData.zoom,
                duration: zoomDuration,
                // Awkward to override the prefersReducedMotion setting but taking OS setting by default seems too severe
                essential: true
            });
            map.map.once("moveend", () => {
                zoom.resolve();
            });
        } else {
            map.map.jumpTo({
                center: widgetData.center,
                zoom: widgetData.zoom
            });
            map.hasBounds = true;
            zoom.resolve();
        }
    } else {
        zoom.resolve();
    }

    zoom.then(function () {
        // TODO: We probably just want this to happen immediately
        // This is a hack to cause SVG plotly widgets to resize themselves e.g. the Species Reported bar -
        // find a better solution
        window.dispatchEvent(new Event("resize"));
    });
};

maxwell.updateMapVisible = function (that, activePane) {
    const paneHandler = maxwell.paneHandlerForIndex(that, activePane);
    if (!paneHandler) {
        fluid.fail("No pane handler found for section with index ", activePane);
    }
    const isVisible = !fluid.componentHasGrade(paneHandler, "maxwell.mapHidingPaneHandler");
    maxwell.toggleClass(that.dom.locate("mapHolder")[0], "mxcw-hideMap", isVisible, true);
};

maxwell.navSection = function (splitRanges, activeSection, offset) {
    const navRangeIndex = splitRanges.indexToRange[activeSection];
    const navRange = splitRanges.navRanges[navRangeIndex];
    const navIndex = navRange.indexOf(activeSection);
    return navRange[navIndex + offset];
};

maxwell.listenSectionButtons = function (that) {
    const sectionLeft = that.locate("sectionLeft")[0];
    sectionLeft.addEventListener("click", () => {
        const activeSection = that.model.activeSection;
        const navLeft = that.navSection(activeSection, -1);
        if (navLeft !== undefined) {
            that.applier.change("activeSection", navLeft);
        }
    });
    const sectionRight = that.locate("sectionRight")[0];
    sectionRight.addEventListener("click", () => {
        const activeSection = that.model.activeSection;
        const navRight = that.navSection(activeSection, 1);
        if (navRight !== undefined) {
            that.applier.change("activeSection", navRight);
        }
    });
};

maxwell.updateSectionNav = function (that, activeSection) {
    const l = (selector) => that.locate(selector)[0];
    const navLeft = that.navSection(activeSection, -1);
    const first = navLeft === undefined;
    const navRight = that.navSection(activeSection, 1);
    const last = navRight === undefined;
    maxwell.toggleClass(l("sectionLeft"), "disabled", first);
    l("sectionLeftText").innerText = first ? "" : that.sectionHolders[navLeft].headingText;
    maxwell.toggleClass(l("sectionLeftDesc"), "mxcw-hidden", first);

    maxwell.toggleClass(l("sectionRight"), "disabled", last);
    l("sectionRightText").innerText = last ? "" : that.sectionHolders[navRight].headingText;
    maxwell.toggleClass(l("sectionRightDesc"), "mxcw-hidden", last);
};

// TODO: Shouldn't everything connected with viz code go into imerss-viz-reknit.js?


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

fluid.defaults("maxwell.withDownloadLink", {
    selectors: {
        downloadControl: ".imerss-download",
        downloadLink: ".imerss-download-link"
    },
    invokers: {
        "renderDownloadLink": "maxwell.renderDownloadLink({that}, {paneHandler}.options.downloadTemplate, {arguments}.0)"
    },
    distributeOptions: {
        target: "{paneHandler hortis.leafletMap}.options.modelListeners.downloadLinkDisplay",
        record: {
            // TOOD: rename mapBlockTooltipId to selectedRegion
            path: "{that}.model.mapBlockTooltipId",
            listener: "{maxwell.withDownloadLink}.renderDownloadLink",
            args: "{change}.value"
        }
    }
});

maxwell.renderDownloadLink = function (paneInfo, downloadTemplate, regionName) {
    const downloadControl = paneInfo.locate("downloadControl");
    if (regionName && downloadTemplate) {
        const target = fluid.stringTemplate(downloadTemplate, {regionName});
        paneInfo.locate("downloadLink").attr("href", target);
        downloadControl.addClass("active");
    } else {
        downloadControl.removeClass("active");
    }
};

// Base definitions

fluid.defaults("maxwell.paneHandler", {
    gradeNames: "fluid.viewComponent",
    // TODO: normalise paneKey -> paneName
    paneKey: "{sourcePath}",
    paneIndex: "@expand:maxwell.paneKeyToIndex({that}, {maxwell.storyPage})",
    members: {
        container: "@expand:maxwell.sectionForPaneHandler({that}, {maxwell.storyPage})",
        isVisible: "@expand:signal()"
    },
    modelListeners: {
        isVisibleToSignal: {
            path: "isVisible",
            args: ["{that}.isVisible", "{change}.value"],
            func: (isVisibleSignal, isVisible) => isVisibleSignal.value = isVisible
        }
    },

    modelRelay: {
        isVisible: {
            args: ["{maxwell.storyPage}.model.activePane", "{that}.options.paneIndex"],
            func: (activePane, paneIndex) => activePane === paneIndex,
            target: "isVisible"
        }
    },
    listeners: {
        "onCreate.addPaneClass": "maxwell.paneHandler.addPaneClass({that}, {that}.options.parentContainer)"
    },
    resolvedWidgets: "@expand:maxwell.unflattenOptions({that}.options.widgets)",
    dynamicComponents: {
        widgets: {
            sources: "{that}.options.resolvedWidgets",
            type: "{source}.type",
            options: "{source}.options"
        }
    },
    // For consistency when binding from withPaneInfo
    parentContainer: "{that}.container"
});


maxwell.paneHandler.addPaneClass = function (that, parentContainer) {
    parentContainer[0].classList.add("mxcw-widgetPane-" + that.options.paneKey);
};

fluid.defaults("maxwell.librePaneHandler", {
    gradeNames: "maxwell.paneHandler"
});

// Tag interpreted by maxwell.updateMapVisible
fluid.defaults("maxwell.mapHidingPaneHandler", {
});

fluid.defaults("maxwell.templatePaneHandler", {
    gradeNames: ["maxwell.paneHandler", "fluid.templateRenderingView"],
    parentContainer: "@expand:maxwell.sectionForPaneHandler({that}, {maxwell.storyPage})"
});

fluid.defaults("hortis.vizLoader.withRegions", {
    gradeNames: "hortis.vizLoader",
    components: {
        regionLoader: {
            type: "hortis.urlCsvReader",
            options: {
                url: "{vizLoader}.options.regionFile"
            }
        }
    }
});

fluid.defaults("maxwell.hashManager", {
    gradeNames: "fluid.modelComponent",
    listeners: {
        "onCreate.listenHash": "maxwell.hashManager.listenHash"
    },
    invokers: {
        applyHash: "maxwell.hashManager.applyHash({that}, {arguments}.0)"
    },
    members: {
        // We don't get a notification on startup, ingest any hash present in the initial URL, but delay to avoid
        // confusing initial model resolution and map loading TODO improve with initial model merging if we can
        applyHashOnResources: "@expand:fluid.effect({that}.applyHash, load, {vizLoader}.resourcesLoaded)"
    },
    modelListeners: {
        "pushState": {
            path: "",
            funcName: "maxwell.hashManager.listenModel",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        }
    }
});

maxwell.parseHashSegment = function (segment) {
    const [key, value] = decodeURIComponent(segment).split(":");
    const parsedValue = value.startsWith("{") || value.startsWith("[") ? JSON.parse(value) : value;
    return [key, parsedValue];
};

maxwell.renderHashSegment = function (key, value) {
    return key + ":" + (fluid.isPrimitive(value) ? "" + value : JSON.stringify(value));
};

maxwell.hashManager.applyHash = function (that) {
    const hash = location.hash.substring(1); // Remove initial # if any
    const sections = hash.split("&");
    const parsedSections = sections.filter(section => section.includes(":"))
        .map(section => maxwell.parseHashSegment(section));
    const model = Object.fromEntries(parsedSections);
    // We tried applying a transaction source here but there is a nested listener in maxwell.listenPaneHash and we
    // never implemented transaction globbing for https://fluidproject.atlassian.net/browse/FLUID-5498
    fluid.globalInstantiator.hashSource = true;
    fluid.replaceModelValue(that.applier, [], model);
    delete fluid.globalInstantiator.hashSource;
};

maxwell.hashManager.listenHash = function (that) {
    window.addEventListener("hashchange", () => {
        console.log("hashchange");
        that.applyHash();
    });
    window.addEventListener("popstate", () => {
        console.log("popstate");
        that.applyHash();
    });
};

maxwell.hashManager.listenModel = function (that, model) {
    const nonEmpty = Object.entries(model).filter(([, value]) => fluid.isValue(value));
    const segments = nonEmpty.map(([key, value]) => maxwell.renderHashSegment(key, value));
    const hash = "#" + segments.join("&");
    window.history.pushState(null, null, hash);
};
