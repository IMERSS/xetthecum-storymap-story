/* eslint-env node */

"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Directory path containing SVG files
const directoryPath = "img/fillPatterns";

// Read all files in the directory
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    // Filter out only SVG files
    const svgFiles = files.filter((file) => path.extname(file).toLowerCase() === ".svg");

    // Iterate through each SVG file
    svgFiles.forEach((svgFile) => {
        // Construct input and output paths
        const inputFilePath = path.join(directoryPath, svgFile);
        const outputFilePath = path.join(directoryPath, path.basename(svgFile, ".svg") + ".png");

        // Resize SVG to 512x512 and convert to PNG
        sharp(inputFilePath)
            .resize(512, 512)
            .png()
            .toFile(outputFilePath, (err, info) => {
                if (err) {
                    console.error(`Error converting ${svgFile} to PNG:`, err);
                } else {
                    console.log(`Converted ${svgFile} to PNG:`, info);
                }
            });
    });
});
