"use strict";

let installed = false;

exports.install = function(){
    if(installed){
        return;
    }

    /* Сетевой протокол добавляется после проверки state machine в singleplayer, но authority уже ограничен хостом. */
    installed = true;
};
