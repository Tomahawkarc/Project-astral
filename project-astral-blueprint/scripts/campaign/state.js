"use strict";

const constants = require("core/constants");
const logger = require("core/log");

let current = null;
let loaded = false;
const listeners = [];

function freshState(){
    return {
        schema: constants.mod.schema,
        revision: 0,
        chapter: "surface",
        lift: {
            phase: "unavailable",
            integrity: 0,
            throughput: 0
        },
        network: {
            capacity: 0,
            reserved: 0,
            nodes: {}
        },
        subsystems: {},
        flags: {},
        records: {},
        adaptation: {
            pressure: 0,
            activeStrategy: null,
            cooldowns: {}
        }
    };
}

function copy(value){
    return JSON.parse(JSON.stringify(value));
}

function validate(data){
    if(data === null || typeof data !== "object"){
        throw new Error("Campaign state must be an object.");
    }

    if(data.schema !== constants.mod.schema){
        throw new Error("Unsupported campaign state schema: " + data.schema + ".");
    }

    if(typeof data.revision !== "number" || data.revision < 0){
        throw new Error("Campaign state revision is invalid.");
    }

    if(data.network === null || typeof data.network !== "object"){
        throw new Error("Campaign network state is missing.");
    }

    if(typeof data.network.capacity !== "number" || typeof data.network.reserved !== "number"){
        throw new Error("Campaign network capacity is invalid.");
    }

    if(data.network.capacity < 0 || data.network.reserved < 0 || data.network.reserved > data.network.capacity){
        throw new Error("Campaign network capacity invariant failed.");
    }

    return data;
}

function migrate(data){
    if(typeof data.schema !== "number"){
        throw new Error("Campaign state has no schema.");
    }

    if(data.schema > constants.mod.schema){
        throw new Error("Campaign state was created by a newer Project Astral version.");
    }

    return data;
}

function notify(label){
    const snapshot = copy(current);

    listeners.slice().forEach(function(listener){
        try{
            listener(snapshot, label);
        }catch(error){
            logger.error("State listener failed: " + String(error));
        }
    });
}

function authority(){
    return !Vars.net.client();
}

exports.load = function(){
    if(loaded){
        return copy(current);
    }

    const raw = Core.settings.getString(constants.mod.stateKey, "");

    if(raw.length === 0){
        current = freshState();
    }else{
        current = validate(migrate(JSON.parse(raw)));
    }

    loaded = true;
    return copy(current);
};

exports.get = function(){
    if(!loaded){
        exports.load();
    }

    return copy(current);
};

exports.isAuthority = authority;

exports.save = function(){
    if(!loaded || !authority()){
        return false;
    }

    validate(current);
    Core.settings.put(constants.mod.stateKey, JSON.stringify(current));
    Core.settings.forceSave();
    return true;
};

exports.transaction = function(label, mutation){
    if(!authority()){
        throw new Error("Only the host can change Project Astral campaign state.");
    }

    if(!loaded){
        exports.load();
    }

    const next = copy(current);
    mutation(next);
    next.revision = current.revision + 1;
    validate(next);
    current = next;
    exports.save();
    exports.publishToRules();
    notify(label);
    return copy(current);
};

exports.publishToRules = function(){
    if(!loaded || Vars.state === null || Vars.state.rules === null){
        return;
    }

    Vars.state.rules.tags.put(constants.mod.rulesTag, JSON.stringify(current));
};

exports.replaceFromNetwork = function(snapshot){
    const incoming = validate(copy(snapshot));

    if(loaded && current !== null && incoming.revision < current.revision){
        return false;
    }

    current = incoming;
    loaded = true;
    notify("network-snapshot");
    return true;
};

exports.onChange = function(listener){
    listeners.push(listener);

    return function(){
        const index = listeners.indexOf(listener);
        if(index >= 0){
            listeners.splice(index, 1);
        }
    };
};

exports.flag = function(key){
    if(!loaded){
        exports.load();
    }

    return current.flags[key] === true;
};

exports.setFlag = function(key, value){
    return exports.transaction("flag:" + key, function(data){
        data.flags[key] = value === true;
    });
};

exports.clearDevelopmentState = function(){
    if(!authority()){
        throw new Error("Only the host can clear Project Astral campaign state.");
    }

    current = freshState();
    loaded = true;
    Core.settings.remove(constants.mod.stateKey);
    Core.settings.forceSave();
    notify("development-reset");
    return copy(current);
};
