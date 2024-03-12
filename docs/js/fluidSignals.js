/*
Copyright 2024 Antranig Basman
Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.
You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

/* global preactSignalsCore */

"use strict";

var {signal, effect, computed} = preactSignalsCore;

fluid.computed = function (func, ...args) {
    return computed( () => {
        const designalArgs = args.map(arg => arg instanceof preactSignalsCore.Signal ? arg.value : arg);
        return typeof(func) === "string" ? fluid.invokeGlobalFunction(func, designalArgs) : func.apply(null, designalArgs);
    });
};

// TODO: Return needs to be wrapped in a special marker so that component destruction can dispose it
fluid.effect = function (func, ...args) {
    return effect( () => {
        let undefinedSignals = false;
        const designalArgs = [];
        for (const arg of args) {
            if (arg instanceof preactSignalsCore.Signal) {
                const value = arg.value;
                designalArgs.push(arg.value);
                if (value === undefined) {
                    undefinedSignals = true;
                }
            } else {
                designalArgs.push(arg);
            }
        }
        // const designalArgs = args.map(arg => arg instanceof preactSignalsCore.Signal ? arg.value : arg);
        if (!undefinedSignals) {
            return typeof(func) === "string" ? fluid.invokeGlobalFunction(func, designalArgs) : func.apply(null, designalArgs);
        }
    });
};
