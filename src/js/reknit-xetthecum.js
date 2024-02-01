/* eslint-env node */

"use strict";

const linkedom = require("linkedom");

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

module.exports = {addArrows};
