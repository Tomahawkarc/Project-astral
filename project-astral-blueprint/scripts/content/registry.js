"use strict";

const entries = {};

exports.put = function(key, value){
    if(Object.prototype.hasOwnProperty.call(entries, key)){
        throw new Error("Duplicate Project Astral registry key: " + key);
    }

    entries[key] = value;
    return value;
};

exports.get = function(key){
    if(!Object.prototype.hasOwnProperty.call(entries, key)){
        throw new Error("Unknown Project Astral registry key: " + key);
    }

    return entries[key];
};

exports.find = function(key){
    return entries[key] || null;
};

exports.each = function(visitor){
    Object.keys(entries).forEach(function(key){
        visitor(key, entries[key]);
    });
};
