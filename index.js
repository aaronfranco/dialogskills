/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * DialogSkills.js
 * An open source framwork for rapidly creating Alexa skills from DialogFlow Agents.
 * 2018 Copyright, Aaron Franco
 * MIT License
 **/


const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const request = require('request');
const DatabaseAdapter = require('./dynamo.js')
const md5 = require('md5')
require('dotenv').config();
const namedHandlers = require('./namedHandlers')
const requestParams = require('./requestParams')
require('es6-promise').polyfill();
require('isomorphic-fetch');

const db = new DatabaseAdapter();

const handlers = Object.assign({}, namedHandlers, {
    // Alexa Replies to the Start Handler after various Async processing
    // TODO: Use reprompting to ask again if useLastRequest is set to true
    'AlexaAsks': function() {
      // Alexa Asks the user
      if(this.handler.errorHandler){
        var speech = this.handler.errorHandler + this.handler.AlexaSays
        this.emit(":ask", speech);
      }else{
        this.emit(":ask", this.handler.AlexaSays);
      }
    },
    'GenericHandler': function() {
      // console.log("In Generic Handler")
      let slotName = this.event.request.intent.slots[Object.keys(this.event.request.intent.slots)[0]].name;
      this.handler.userSays = slotName;

      if(slotName.indexOf('_') > -1){
        this.handler.userSays = slotName.split("_").join(" ")
      }
      console.log("Slot Name: ", slotName)
      switch(slotName){
        // TODO: Map AMAZON.type slots here to their values
        case "numberslot":
          this.handler.userSays = this.event.request.intent.slots['numberslot'].value
          break;
        // TODO: Map custom DialogFlow Entities to their slots here to manager correct slot filling
        case "expensecategoryslot":
          this.handler.userSays = this.event.request.intent.slots["expensecategoryslot"].value
          break;
      }
      console.log("userSays: ", this.handler.userSays)
      this.handler.speechHandler = "AlexaAsks"
      this.handler.nextHandler = 'CallDialogFlow'
      this.emit('GetContext')
    },
    // Get Context from Dynamo DB
    'GetContext':function(){
      // console.log("Getting context")
      // scope the handler for Async response data management
      let thisScoped = this;
      // execute the DynamoDB getItem API
      // TODO: MOve to handler not anonymous function
      db.get(this.event.session.sessionId, function(err, data){
        // handle any errors
        if (err) {
          console.log(err, err.stack); // an error occurred
        }else{
            // if the response contains NO data
            thisScoped.handler.gottenContext = data;
            thisScoped.emit("GetContextSuccess")
        }
      })

    },
    'GetContextSuccess': function() {
      let data = this.handler.gottenContext;
      if(Object.keys(data).length === 0){
        // console.log("Creating Session")
        this.handler.context = "[]";
        // create a new session since one h7568a8a290ea4a358cc6760ce73cb0e2as yet to exist in DynamoDB
        this.emit('SessionCreate');
      } else {
        // set up our sessionData
        // TODO: Split by Session ID and Context
        this.handler.context = data.Item.context.S;
      }

      if(data.Item !== undefined){
        if(this.handler.useLastRequest !== undefined && this.handler.useLastRequest === true){
          this.handler.context = data.Item.lastcontext.S;
          this.handler.userSays = data.Item.lastsaid.S;
        }
      }
      this.emit(thisScoped.handler.nextHandler);
    },
    // setting context for a user session after context is received from DialogFlow
    'SetContext':function(){
        db.update(this.event.session.sessionId, this.handler.context,this.handler.userSays, this.handler.lastContext, this.handler.nextError, function(err, data){
          if (err) {
            console.log(err, err.stack); // an error occurred
          }else{
            // no need to save the data to a variable becuse this will only be called after a response received
            console.log(data); // successful response
          }
        })

    },
    'ResetContext': function() {
      db.delete(this.event.session.sessionId, function(err, data){
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
        }
      })
    },
    'CallDialogFlow':function(){
      var thisScoped = this;
      var options = {
          method:'POST',
          headers:{
              "Authorization":"Bearer " + process.env.AGENT_ID,
              "Content-Type":"application/json"
          },
          body:JSON.stringify({
              "contexts": JSON.parse(this.handler.context),
              "lang": "en",
              "query": this.handler.userSays,
              "sessionId": md5(this.event.session.sessionId),
              "timezone": "America/New_York"
          })
      }
      fetch('https://api.dialogflow.com/v1/query?v=20150910', options)
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        thisScoped.handler.dialogFlowErr = null
        thisScoped.handler.dialogFlowBody = res
        thisScoped.handler.dialogFlowHttpResponse = null
        thisScoped.emit('CallDialogFlowResponse')
      })
      .catch((err) => {
        thisScoped.handler.dialogFlowErr = res
        thisScoped.handler.dialogFlowBody = null
        thisScoped.handler.dialogFlowHttpResponse = null
        thisScoped.emit('CallDialogFlowResponse')
      });

      // request(options, function(err,httpResponse,data){
      //     thisScoped.handler.dialogFlowErr = err
      //     thisScoped.handler.dialogFlowBody = data
      //     thisScoped.handler.dialogFlowHttpResponse = httpResponse
      //     thisScoped.emit('CallDialogFlowResponse')
      // });
    },
    'CallDialogFlowResponse': function() {
      let err = this.handler.dialogFlowErr
      let data = this.handler.dialogFlowBody
      let httpResponse = this.handler.dialogFlowHttpResponse

      if(err){
        throw new Error(err)
      }
      this.handler.lastContext = this.handler.context; // last context
      this.handler.context = JSON.stringify(data.result.contexts); // new context
      this.handler.AlexaSays = data.result.fulfillment.speech;
      let state = data.result.action.split(".")
      if(state[0] == 'in'){
        this.emit('SetContext')
        this.emit(this.handler.speechHandler)
      }else if(state[0] == 'end'){
        // call post hook for data integration
        let params = requestParams[state[1]]
        let options = params.options;
        options.body = JSON.stringify({
          "contexts":data.result.contexts,
          "params":data.result.parameters
        })
        // optoi
        fetch(params.url, options)
        .then((res) => {
          return res.json()
        })
        .then((res) => {
          this.emit('ResetContext')
          this.emit("AlexaTells")
        })
        .catch((err) => {
          console.log(err)
        });

      }
    },
    'Unhandled':function(){
      this.handler.useLastRequest = true;
      this.handler.errorHandler = process.env.UNHANDLED;
      this.handler.speechHandler = "AlexaAsks"
      this.handler.nextHandler = 'CallDialogFlow'
      this.emit('GetContext')
    },

    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },

});

exports.handler = function (event, context, callback) {
  console.log(JSON.stringify(event))
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = process.env.APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

exports.intentHandlers = handlers
