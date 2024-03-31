/* eslint-env node */

"use strict";

const linkedom = require("linkedom"),
    axios = require("axios"),
    fluid = require("infusion");

require("./utils.js");

const maxwell = fluid.registerNamespace("maxwell");

const arrow = `
<div class="long-down-arrow">
    <svg width="16" height="111">
        <use href="#downarrow" />
    </svg>
</div>`;

const addArrows = function (document, container) {
    const sections = container.querySelectorAll(".section.level2");
    console.log("Adding arrows to  " + sections.length + " sections");

    [...sections].slice(0, -1).forEach(section => {
        const node = linkedom.parseHTML(arrow).document.firstElementChild;
        section.parentNode.insertBefore(node, section.nextSibling);
    });
};

const rewriteOneTaxonLink = function (taxon) {
    const low = taxon.toLowerCase().replaceAll("%20", "_");
    return `https://imerss.github.io/xetthecum-storymap/taxa/${low}/`;
};

const checkLink = function (url) {
    return new Promise((resolve) => {
        axios.head(url)
            .then(response => {
                // If the status code is 2xx, consider the URL as resolved
                if (response.status >= 200 && response.status < 300) {
                    resolve({
                        resolved: true,
                        status: response.status
                    });
                } else {
                    resolve({
                        resolved: false,
                        status: response.status
                    });
                }
            })
            .catch(error => {
                resolve({
                    resolved: false,
                    status: error.response.status
                });
            });
    });
};

const rewriteTaxonLinkElement = async function (element, checkLinks) {
    const links = [...element.querySelectorAll("a")];
    return maxwell.asyncForEach(links, async link => {
        const href = link.getAttribute("href");
        if (href.startsWith("#taxon:")) {
            const target = rewriteOneTaxonLink(href.substring("#taxon:".length));
            if (checkLinks) {
                const result = await checkLink(target);
                if (!result.resolved) {
                    console.log("*** Error: link ", href, " was rewritten to ", target, " which returned status ", result.status);
                }
            }
            link.setAttribute("href", target);
        }
    });
};

const rewriteTaxonLinks = async function (document, container, template, rec) {
    const checkLinks = rec.options.checkLinks;
    await rewriteTaxonLinkElement(container, checkLinks);
    await rewriteTaxonLinkElement(template, checkLinks);
};

module.exports = {addArrows, rewriteTaxonLinks};
