"use strict";

let enabled = false;

exports.enable = function(){
    enabled = true;
};

exports.disable = function(){
    enabled = false;
};

exports.enabled = function(){
    return enabled;
};
