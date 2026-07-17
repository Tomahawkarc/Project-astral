"use strict";

const compat = require("core/compat");
const content = require("content/index");
const campaignState = require("campaign/state");
const campaign = require("campaign/index");
const logger = require("core/log");

let started = false;

exports.start = function(){
    if(started){
        return;
    }

    compat.assertSupported();
    content.load();
    campaignState.load();
    campaign.install();
    started = true;
    logger.info("Pre-production runtime loaded.");
};
