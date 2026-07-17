"use strict";

const constants = require("core/constants");
const logger = require("core/log");

exports.assertSupported = function(){
    if(!Version.isAtLeast(constants.engine.minimum)){
        throw new Error("Project Astral requires Mindustry build " + constants.engine.minimum + " or newer.");
    }

    if(Version.build !== constants.engine.targetBuild || Version.revision !== constants.engine.targetRevision){
        logger.warn("Running on " + Version.buildString() + "; the verified target is " + constants.engine.minimum + ".");
    }
};
