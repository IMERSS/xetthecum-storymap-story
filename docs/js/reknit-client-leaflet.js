"use strict";

/* global L, HTMLWidgets */

window.HTMLWidgets = window.HTMLWidgets || {};

// Taken from https://github.com/ramnathv/htmlwidgets/blob/master/inst/www/htmlwidgets.js
window.HTMLWidgets.dataframeToD3 = function (df) {
    const names = [];
    let length;
    for (const name in df) {
        if (df.hasOwnProperty(name)) {
            names.push(name);
        }
        if (typeof(df[name]) !== "object" || typeof(df[name].length) === "undefined") {
            throw new Error("All fields must be arrays");
        } else if (typeof(length) !== "undefined" && length !== df[name].length) {
            throw new Error("All fields must be arrays of the same length");
        }
        length = df[name].length;
    }
    const results = [];
    let item;
    for (let row = 0; row < length; row++) {
        item = {};
        for (let col = 0; col < names.length; col++) {
            item[names[col]] = df[names[col]][row];
        }
        results.push(item);
    }
    return results;
};


/**
 * A Leaflet Map
 * @typedef {Object} LeafletMap
 */

/**
 * A Leaflet LayerGroup
 * @typedef {Object} LeafletLayerGroup
 */

// noinspection ES6ConvertVarToLetConst // otherwise this is a duplicate on minifying
var maxwell = fluid.registerNamespace("maxwell");


// From https://github.com/rstudio/leaflet/blob/main/javascript/src/methods.js#LL713C1-L859C3
maxwell.addNativeLegend = function (options, map, paneHandler) {
    const legend = L.control({position: options.position});
    const div = L.DomUtil.create("div", options.className);

    legend.onAdd = function () {
        const colors = options.colors,
            labels = options.labels;
        let legendHTML = "";
        if (options.type === "numeric") {
            // # Formatting constants.
            const singleBinHeight = 20;  // The distance between tick marks, in px
            const vMargin = 8; // If 1st tick mark starts at top of gradient, how
            // many extra px are needed for the top half of the
            // 1st label? (ditto for last tick mark/label)
            const tickWidth = 4;     // How wide should tick marks be, in px?
            const labelPadding = 6;  // How much distance to reserve for tick mark?
            // (Must be >= tickWidth)

            // # Derived formatting parameters.

            // What's the height of a single bin, in percentage (of gradient height)?
            // It might not just be 1/(n-1), if the gradient extends past the tick
            // marks (which can be the case for pretty cut points).
            const singleBinPct = (options.extra.p_n - options.extra.p_1) / (labels.length - 1);
            // Each bin is `singleBinHeight` high. How tall is the gradient?
            const totalHeight = (1 / singleBinPct) * singleBinHeight + 1;
            // How far should the first tick be shifted down, relative to the top
            // of the gradient?
            const tickOffset = (singleBinHeight / singleBinPct) * options.extra.p_1;

            const gradSpan = $("<span/>").css({
                "background": "linear-gradient(" + colors + ")",
                "opacity": options.opacity,
                "height": totalHeight + "px",
                "width": "18px",
                "display": "block",
                "margin-top": vMargin + "px"
            });
            const leftDiv = $("<div/>").css("float", "left"),
                rightDiv = $("<div/>").css("float", "left");
            leftDiv.append(gradSpan);
            $(div).append(leftDiv).append(rightDiv)
                .append($("<br>"));

            // Have to attach the div to the body at this early point, so that the
            // svg text getComputedTextLength() actually works, below.
            document.body.appendChild(div);

            const ns = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(ns, "svg");
            rightDiv.append(svg);
            const g = document.createElementNS(ns, "g");
            $(g).attr("transform", "translate(0, " + vMargin + ")");
            svg.appendChild(g);

            // max label width needed to set width of svg, and right-justify text
            let maxLblWidth = 0;

            // Create tick marks and labels
            $.each(labels, function (i) {
                let y = tickOffset + i * singleBinHeight + 0.5;

                let thisLabel = document.createElementNS(ns, "text");
                $(thisLabel)
                    .text(labels[i])
                    .attr("y", y)
                    .attr("dx", labelPadding)
                    .attr("dy", "0.5ex");
                g.appendChild(thisLabel);
                maxLblWidth = Math.max(maxLblWidth, thisLabel.getComputedTextLength());

                let thisTick = document.createElementNS(ns, "line");
                $(thisTick)
                    .attr("x1", 0)
                    .attr("x2", tickWidth)
                    .attr("y1", y)
                    .attr("y2", y)
                    .attr("stroke-width", 1);
                g.appendChild(thisTick);
            });

            // Now that we know the max label width, we can right-justify
            $(svg).find("text")
                .attr("dx", labelPadding + maxLblWidth)
                .attr("text-anchor", "end");
            // Final size for <svg>
            $(svg).css({
                width: (maxLblWidth + labelPadding) + "px",
                height: totalHeight + vMargin * 2 + "px"
            });

            if (options.na_color && ($.inArray(options.na_label, labels) < 0) ) {
                $(div).append("<div><i style=\"" +
                    "background:" + options.na_color +
                    ";opacity:" + options.opacity +
                    ";margin-right:" + labelPadding + "px" +
                    ";\"></i>" + options.na_label + "</div>");
            }
        } else {
            if (options.na_color && ($.inArray(options.na_label, labels) < 0) ) {
                colors.push(options.na_color);
                labels.push(options.na_label);
            }
            for (let i = 0; i < colors.length; i++) {
                legendHTML += "<i style=\"background:" + colors[i] + ";opacity:" +
                    options.opacity + "\"></i> " + labels[i] + "<br>";
            }
            div.innerHTML = legendHTML;
        }
        if (options.title) {
            $(div).prepend("<div style=\"margin-bottom:3px\"><strong>" +
                options.title + "</strong></div>");
        }
        return div;
    };
    paneHandler.legendContainer = div;

    legend.addTo(map);
};


// Should we ever want scrollytelling back again
fluid.defaults("maxwell.storyPage.withScrolly", {
    scrollAtPixels: 150,
    listeners: {
        "onCreate.registerScrollyListeners": "maxwell.registerScrollyListeners({that})"
    }
});

maxwell.registerScrollyListeners = function (that) {
    const sectionHolders = that.sectionHolders;
    sectionHolders.forEach(function (sectionHolder, i) {
        sectionHolder.heading.addEventListener("click", () => that.applier.change("activeSection", i));
    });
    const content = that.dom.locate("content")[0];
    content.addEventListener("scroll", function () {
        const scrollTop = content.scrollTop;
        const offsets = sectionHolders.map(widget => widget.section.offsetTop);
        // See diagram - we scroll when the next heading's top gets close enough to the viewport top
        let index = offsets.findIndex(offset => (scrollTop + that.options.scrollAtPixels) < offset) - 1;
        if (index === -2) {
            index = sectionHolders.length - 1;
        } else if (index === -1) {
            index = 0;
        }
        that.applier.change("activeSection", index);
    });
};

maxwell.leafletiseCoords = function (coords) {
    return coords.map(poly => poly.map(HTMLWidgets.dataframeToD3));
};

// Undo bizarre "multiplexing" which is achieved by the HTMLWidgets "dataFrame" system
maxwell.resolveVectorOptions = function (options, index) {
    const entries = Object.entries(options).map(([key, val]) =>
        [key, Array.isArray(val) ? val[index] : val]
    );
    return Object.fromEntries(entries);
};

// Another demultiplexing for dataframe args
maxwell.projectArgs = function (args, index) {
    return args.map(arg => Array.isArray(arg) ? arg[index] : arg);
};

/**
 * Looks up any `layoutId` argument in the supplied Leaflet widget's `call` structure
 * @param {HTMLWidgetCall} call - The call to be searched
 * @return {String|undefined} - The `layoutId` argument, if any
 */
maxwell.decodeLayoutId = function (call) {
    const argPos = maxwell.methodToLayoutArg[call.method];
    return argPos && call.args[argPos];
};

maxwell.decodeLeafletWidgetCall = function (options, call) {
    const {map, widget, index, paneInfo, paneHandler} = options;
    const {paneOptions, group} = paneInfo;
    // TODO: Current assumption is that any choice of layoutId converts to a direct assignment to the same-named pane -
    // which is useful for assigning to "baseMap" e.g. in the community directory but not good for e.g. Howe Sound assignment
    // to clickable "communities".
    const overridePane = maxwell.decodeLayoutId(call);
    let overridePaneInfo, overridePaneOptions, overrideGroup;
    if (overridePane && typeof(overridePane) === "string") { // tmap will allocate a vector layoutId, ignore it
        overridePaneInfo = maxwell.allocatePane(map, undefined, undefined, overridePane);
        overridePaneOptions = overridePaneInfo.paneOptions;
        overrideGroup = overridePaneInfo.group;
    }
    // See https://github.com/rstudio/leaflet/blob/main/javascript/src/methods.js#L550
    const polyMethod = maxwell.leafletPolyMethods[call.method];
    if (polyMethod) {
        // TODO: Note that because we can't tunnel arguments other than layerId for addRasterImage, we should move
        // the subLayerIndex system (used for Howe Sound choropleth) over to layerId as well to support future
        // uses of raster images in a choropleth
        // TODO: We should probably demultiplex these arguments up front so that we can support multiplex assignment of
        // layerId and subLayerIndex on the R side
        const subLayerIndex = call.args[3].mx_subLayerIndex;
        if (subLayerIndex !== undefined) {
            const subPaneInfo = maxwell.allocatePane(map, index, subLayerIndex);
            maxwell.assignPolyToPane(paneHandler, call.args, polyMethod, subPaneInfo);
            widget.subPanes[subLayerIndex] = subPaneInfo;
        } else {
            maxwell.assignPolyToPane(paneHandler, call.args, polyMethod, overridePaneInfo || paneInfo);
        }
    } else if (call.method === "addRasterImage") {
        // args: url, bounds, opacity
        const opacity = call.args[2] ?? 1.0;
        L.imageOverlay(call.args[0], call.args[1], Object.assign({}, {
            opacity: opacity
        }, overridePaneOptions || paneOptions)).addTo(overrideGroup || group);
    } else if (call.method === "addMarkers" || call.method === "addCircleMarkers") {
        // Very limited support currently - just for labelOnlyMarkers used in fire history
        // args: lat, lng, icon || radius, layerId, group, options, popup, popupOptions,
        // clusterOptions, clusterId, label, labelOptions, crosstalkOptions
        const markerArgs = [call.args[0], call.args[1], call.args[2], call.args[5], call.args[10], call.args[11], paneOptions, group, paneHandler];
        if (Array.isArray(call.args[0])) {
            for (let i = 0; i < call.args[0].length; ++i) {
                maxwell.addMarkers.apply(null, maxwell.projectArgs(markerArgs, i));
            }
        } else {
            maxwell.addMarkers.apply(null, markerArgs);
        }
    } else if (call.method === "addLegend") {
        if (fluid.componentHasGrade(paneHandler, "maxwell.withNativeLegend")) {
            maxwell.addNativeLegend(call.args[0], map, paneHandler);
        }
    } else {
        console.log("Unknown R leaflet method " + call.method + " discarded");
    }
};


// Allocate a polygonal leaflet call into a pane or subpane
maxwell.assignPolyToPane = function (rawPaneHandler, callArgs, polyMethod, paneInfo) {
    const shapes = callArgs[0],
        options = Object.assign({}, callArgs[3], paneInfo.paneOptions);
    const paneHandler = maxwell.resolvePaneHandler(rawPaneHandler);
    shapes.forEach(function (shape, index) {
        const r = v => maxwell.resolveVectorOptions(v, index);
        const args = maxwell.projectArgs(callArgs, index);
        const shapeOptions = r(options);
        const popup = args[4];
        const popupOptions = args[5];
        const label = args[6];
        const labelOptions = args[7];
        const finalOptions = paneHandler.polyOptions(shapeOptions, label, labelOptions);
        const polygon = L[polyMethod](maxwell.leafletiseCoords(shape), finalOptions).addTo(paneInfo.group);
        if (popup) {
            polygon.bindPopup(popup, {closeButton: false, ...popupOptions});
            maxwell.hoverPopup(polygon, paneInfo.paneOptions);
        } else if (label) {
            polygon.bindPopup(label, {closeButton: false, ...labelOptions});
            maxwell.hoverPopup(polygon, paneInfo.paneOptions);
        }
        paneHandler.handlePoly(polygon, shapeOptions, label, labelOptions);
    });
};

maxwell.leafletPolyMethods = {
    addPolygons: "polygon",
    addPolylines: "polyline"
};

maxwell.methodToLayoutArg = {
    addPolygons: 1,
    addRasterImage: 4
};

maxwell.divIcon = function (label, className) {
    return L.divIcon({
        html: "<div>" + label + "</div>",
        iconSize: null,
        // Ensure that markers never auto-dismiss selection
        className: (className || "") + " fld-imerss-nodismiss-map"
    });
};

maxwell.addMarkers = function (lat, lon, iconOrRadius, options, label, labelOptions, paneOptions, group, paneHandler) {
    // Note that labelOnlyMarkers are spat out in https://github.com/rstudio/leaflet/blob/main/R/layers.R#L826
    // We detect this through the special case of a width set to 1 and use a div icon which is much
    // easier to configure than the HTMLwidgets strategy of a permanently open tooltip attached to the marker
    if (!iconOrRadius) {
        const markerIcon = new L.Icon.Default();
        markerIcon.options.shadowSize = [0, 0];
        const marker = L.marker([lat, lon], {icon: markerIcon, ...paneOptions}).addTo(group);
        const divIcon = maxwell.divIcon(label, labelOptions.className);
        const labelMarker = L.marker([lat, lon], {icon: divIcon, ...paneOptions}).addTo(group);
        paneHandler.handleMarker(marker, divIcon, label, labelOptions, labelMarker);

        const clickHandler = function () {
            paneHandler.events.markerClick.fire(label);
        };
        marker.on("click", clickHandler);
        labelMarker.on("click", clickHandler);
    } else if (typeof(iconOrRadius) === "number") {
        const radius = iconOrRadius;
        const circleMarker = L.circleMarker([lat, lon], {radius, ...options, ...paneOptions}).addTo(group);
        if (label) {
            circleMarker.bindPopup(label, {closeButton: false, ...labelOptions});
            maxwell.hoverPopup(circleMarker, paneOptions);
        }
        paneHandler.handleMarker(circleMarker, null, label, labelOptions);
    } else {
        const icon = iconOrRadius;
        const Licon = icon.iconWidth === 1 ?
            maxwell.divIcon(label) :
            L.icon({
                iconUrl: icon.iconUrl,
                iconSize: [icon.iconWidth, icon.iconHeight]
            });
        const iconMarker = L.marker([lat, lon], {icon: Licon, ...paneOptions}).addTo(group);
        paneHandler.handleMarker(iconMarker, Licon, label, labelOptions);
    }
    // from https://github.com/rstudio/leaflet/blob/main/javascript/src/methods.js#L189
};

/**
 * Information about an allocated Leaflet pane
 *
 * @typedef {SectionHolder} PaneInfo
 * @property {String} paneName - The name of the pane, in the form "maxwell-pane-n"
 * @property {HTMLElement} pane - The HTML element for the allocated pane
 * @property {LayerGroup} group - The root LayerGroup allocated for the pane
 * @property {Object} paneOptions - Options to be mixed in to any layers in order to allocate them to this pane,
 * being the member {pane: paneName}
 */

/** Allocates a pane to hold controls at the specified index and subIndex values
 * @param {LeafletMap} map - The Leaflet Map in which the pane is to be allocated
 * @param {Integer} index - The index of the pane to be allocated
 * @param {Integer} [subLayerIndex] - Optional subindex of the pane
 * @param {String} [overridePane] - An optional override pane in case the default algorithm choice is to be overriden - in
 * case, e.g. that the material is destined for a base map pane
 * @return {PaneInfo} - The allocated paneInfo structure
 */
maxwell.allocatePane = function (map, index, subLayerIndex, overridePane) {
    let paneName = "maxwell-pane-" + (index === undefined ? overridePane : index);
    if (subLayerIndex !== undefined) {
        paneName += "-subpane-" + subLayerIndex;
    }
    const paneOptions = {
        pane: paneName
    };
    let group;
    let pane = map.getPane(paneName);
    if (!pane) {
        pane = map.createPane(paneName);
        pane.classList.add("mxcw-mapPane");
        if (subLayerIndex !== undefined) {
            pane.classList.add("mxcw-mapSubPane");
        }
        group = L.layerGroup(paneOptions).addTo(map);
        // We used to jam these onto the map so they could be found - now they go into paneInfo in our own records
        map["mx-group-" + paneName] = group;
    } else {
        group = map["mx-group-" + paneName];
    }

    return {paneName, pane, paneOptions, group};
};


/** Gets a paneHandler component fully ready for handling polygon options, or returns
 * a placeholder if this is a section with no actual leaflet widget (e.g. an inatComponents pane)
 * @param {paneHandler} [paneHandler] - An optional paneHandler component
 * @return {paneHandler} A paneHandler component with resolved members, or a placeholder
 */
maxwell.resolvePaneHandler = function (paneHandler) {
    if (paneHandler) {
        fluid.getForComponent(paneHandler, "handlePoly");
        fluid.getForComponent(paneHandler, "polyOptions");
        fluid.getForComponent(paneHandler, "handleMarker");
        return paneHandler;
    } else {
        return {
            polyOptions: fluid.identity,
            handlePoly: fluid.identity,
            handleMarker: fluid.identity
        };
    }
};

/** Apply the map bounds found either in a fitBounds or setView call attached to the supplied widget data
 * @param {LeafletMap} map - The map to which the view is to be applied
 * @param {Object} xData - The "data.x" member of the HTMLWidgets Leaflet instantiator
 */
maxwell.applyView = function (map, xData) {
    const fitBounds = xData.fitBounds;
    const setView = xData.setView;
    const limits = xData.limits;
    if (fitBounds) {
        // Leaflet seems to apply some "natural shrinkage" to the bounds which we need to compensate for otherwise we zoom out too far
        const bounds = maxwell.expandBounds(fitBounds, 0.9);
        map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]]);
    } else if (setView) {
        map.setView(setView[0], setView[1]);
    } else if (limits) {
        // Ignore the maps with limits for now - slows down Maxwell too much and they are too wide anyway
        // "limits" are what gets spat out if there are no explicit bounds set
        // map.fitBounds([[limits.lat[0], limits.lng[0]], [limits.lat[1], limits.lng[1]]]);
    } else {
        console.error("Unable to find map view information in widget data ", xData);
    }
};


// From https://stackoverflow.com/a/16436975
maxwell.arraysEqual = function (a, b, length) {
    if (a === b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < (length || a.length); ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

maxwell.equalBounds = function (bounds1, bounds2) {
    // TODO: Somehow all our bounds objects end up with a 5th element which is an empty array
    return maxwell.arraysEqual(bounds1, bounds2, 4);
};


maxwell.flyToBounds = function (map, xData, durationInMs) {
    return new Promise(function (resolve) {
        const rawBounds = xData.fitBounds;
        if (rawBounds && map._loaded) {
            const bounds = maxwell.expandBounds(rawBounds, 0.9);
            if (maxwell.equalBounds(bounds, map.lastBounds)) {
                resolve();
            } else {
                map.invalidateSize();
                map.flyToBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
                    duration: durationInMs / 1000
                });
                map.lastBounds = bounds;
                map.once("moveend zoomend", resolve);
            }
        } else {
            maxwell.applyView(map, xData);
            resolve();
        }
    });
};

// Note that this does not derive from "hortis.leafletMap" in imerss-viz leafletMap.js
fluid.defaults("maxwell.scrollyLeafletMap", {
    gradeNames: "fluid.viewComponent",
    members: {
        map: "@expand:maxwell.makeLeafletMap({that}.container, {that}.options.mapOptions)"
    },
    mapOptions: {
        zoomSnap: 0.1
    },
    zoomDuration: 100,
    listeners: {
        "onCreate.getTiles": "maxwell.applyZerothTiles({storyPage}.leafletWidgets, {that}.map)"
    }
});

maxwell.makeLeafletMap = function (node) {
    return L.map(fluid.unwrap(node));
};

maxwell.applyZerothTiles = function (leafletWidgets, map) {
    // TODO: Hadn't we implemented this in some other instance of the framework?
    const firstMap = leafletWidgets.findIndex(widget => !!widget.data);

    const data0 = leafletWidgets[firstMap].data.x;
    const tiles = maxwell.findCall(data0.calls, "addTiles");
    if (tiles) {
        L.tileLayer(tiles.args[0], tiles.args[3]).addTo(map);
    } else {
        const pTiles = maxwell.findCall(data0.calls, "addProviderTiles");
        L.tileLayer.provider(pTiles.args[0], pTiles.args[3]).addTo(map);
    }
};


/**
 * @param {maxwell.storyPage} storyPage - The overall storyPage component
 * @param {LeafletWidgetInfo[]} leafletWidgets - Array of partially completed leaflet widget structures
 * @param {LeafletMap} map - The map holding the pane to which the widget's calls should be assigned
 */
maxwell.decodeLeafletWidgets = function (storyPage, leafletWidgets, map) {
    leafletWidgets.forEach((widget, i) => maxwell.leafletWidgetToPane(storyPage, map, widget, i));
};
