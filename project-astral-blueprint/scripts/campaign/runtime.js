"use strict";

const constants = require("core/constants");
const state = require("campaign/state");
const logger = require("core/log");

let installed = false;
let active = false;

function isProjectWorld(){
    if(Vars.state === null || Vars.state.rules === null || Vars.state.rules.planet === null){
        return false;
    }

    return Vars.state.rules.planet.name.indexOf(constants.mod.contentPrefix) === 0;
}

function enterWorld(){
    active = isProjectWorld();

    if(!active){
        return;
    }

    state.publishToRules();
    logger.info("Campaign runtime attached at revision " + state.get().revision + ".");
}

function leaveWorld(){
    active = false;
}

exports.install = function(){
    if(installed){
        return;
    }

    Events.on(WorldLoadEvent, cons(function(){
        enterWorld();
    }));

    Events.on(SaveWriteEvent, cons(function(){
        if(active && state.isAuthority()){
            state.save();
        }
    }));

    Events.on(ResetEvent, cons(function(){
        /* Сброс активного мира не означает удаление прогресса всей экспедиции. */
        leaveWorld();
    }));

    installed = true;
};

exports.active = function(){
    return active;
};
