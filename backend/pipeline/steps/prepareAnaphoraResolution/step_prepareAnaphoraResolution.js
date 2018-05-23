/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

var conversationConfig = require('../../../helper/config.js').getConfig('conversation');

exports.call = function(resultHolder, callback) {
    resultHolder.debug.prepareAnaphoraResolution = {};

    if(!resultHolder.session || !resultHolder.session.context){
        resultHolder.debug.prepareAnaphoraResolution.success = false;
        resultHolder.debug.prepareAnaphoraResolution.error = "!resultHolder.session || !resultHolder.session.context evaluated to true"
        return callback(null, resultHolder);
    }

    // start anaphora solution
    if(!resultHolder.session.context.previousEntities){
        resultHolder.session.context.previousEntities=[];
    }

    // shifting old entites one position back in the index

    // looping backwards so slicing doesn't affect the index
    // https://stackoverflow.com/questions/9882284/looping-through-array-and-removing-items-without-breaking-for-loop
    for (var key = resultHolder.session.context.previousEntities.length-1; key>=0; key--) {
        var value = resultHolder.session.context.previousEntities[key];
        // checks entity entry for separator and index for maximum anapher memory
        if(value.includes("--") && parseInt(value.split("--")[0])<conversationConfig.entity_anaphora_memory-1){
            var newkey = (parseInt(value.split("--")[0])+1) + "--" + value.split("--")[1]+ "--" + value.split("--")[2];
            //resultHolder.session.context.previousEntities[newkey]=value;
            resultHolder.session.context.previousEntities[key]=newkey;
        }else{
            resultHolder.session.context.previousEntities.splice(key, 1);
        }
    }          
    
    var data = resultHolder.callConversation;

    // adding new entities
    if(data.entities){
        for (var key in data.entities){
            var value = data.entities[key];

            // if only a memory of 1 -> simplify syntax
            if(conversationConfig.entity_anaphora_memory==1){
                // it's going to be removed next iteration anyway, so this format is ok
                var newkey = value.entity+"--"+value.value;
            }else{
                var newkey = "0--" + value.entity+"--"+value.value;
            }
            
            //resultHolder.session.context.previousEntities[newkey]=value;
            resultHolder.session.context.previousEntities.push(newkey);
        }
    }

    // intent anapher preparation
    if(data.intents[0] && data.intents[0].intent != conversationConfig.intent_anaphora_name){
        resultHolder.session.context.previousIntent= data.intents[0].intent;
    }else{
        resultHolder.session.context.previousIntent= "";
    }

    // writing back the debug object
    resultHolder.debug.prepareAnaphoraResolution.previousEntities = JSON.parse(JSON.stringify(resultHolder.session.context.previousEntities))
    resultHolder.debug.prepareAnaphoraResolution.previousIntent = resultHolder.session.context.previousIntent;

    return callback(null, resultHolder);
}