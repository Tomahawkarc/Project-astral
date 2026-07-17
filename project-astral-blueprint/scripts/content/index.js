"use strict";

let loaded = false;

exports.load = function(){
    if(loaded){
        return;
    }

    /* Контент добавляется только после фиксации функционального реестра вертикального среза. */
    loaded = true;
};
