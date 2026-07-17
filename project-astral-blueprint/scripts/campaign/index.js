"use strict";

const runtime = require("campaign/runtime");
const network = require("campaign/net");

let installed = false;

exports.install = function(){
    if(installed){
        return;
    }

    runtime.install();
    network.install();
    installed = true;
};
