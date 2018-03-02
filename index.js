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
require('dotenv').config();
const namedHandlers = require('./namedHandlers')

const db = new DatabaseAdapter();

const handlers = Object.assign({}, namedHandlers, {
    // Alexa Replies to the Start Handler after various Async processing
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
      var slotName = this.event.request.intent.slots[Object.keys(this.event.request.intent.slots)[0]].name;
      this.handler.userSays = slotName;
      
      if(slotName.indexOf('_') > -1){
        this.handler.userSays = this.event.request.intent.slots[Object.keys(this.event.request.intent.slots)[0]].name.split("_").join(" ")
      }

      this.handler.speechHandler = "AlexaAsks"
      this.handler.nextHandler = 'CallDialogFlow'
      this.emit('GetContext')
    },
    // Get Context from Dynamo DB
    'GetContext':function(){
      // console.log("Getting context")
      // scope the handler for Async response data management
      var thisScoped = this;
      // execute the DynamoDB getItem API
      db.get(this.event.session.sessionId, function(err, data){
        // handle any errors
        if (err) {
          console.log(err, err.stack); // an error occurred
        }else{
            // if the response contains NO data
            if(Object.keys(data).length === 0){
              // console.log("Creating Session")
              thisScoped.handler.context = "[]";
              // create a new session since one has yet to exist in DynamoDB
              thisScoped.emit('SessionCreate');
            } else {
              // set up our sessionData
              // TODO: Split by Session ID and Context
              thisScoped.handler.context = data.Item.context.S;
            }
            if(thisScoped.handler.useLastRequest){
              thisScoped.handler.context = data.Item.lastcontext.S;
              thisScoped.handler.userSays = data.Item.lastsaid.S;
            }
            thisScoped.emit(thisScoped.handler.nextHandler);
        }
      })

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
          url:'https://api.dialogflow.com/v1/query?v=20150910',
          method:'POST',
          headers:{
              "Authorization":"Bearer " + process.env.AGENT_ID,
              "Content-Type":"application/json"
          },
          body:{
              "contexts": JSON.parse(this.handler.context),
              "lang": "en",
              "query": this.handler.userSays,
              "sessionId": md5(this.event.session.sessionId),
              "timezone": "America/New_York"
          },
          json:true
      }
      request(options, function(err,httpResponse,data){
          if(data.result.action == 'adventure.book'){
            thisScoped.handler.lastContext = thisScoped.handler.context; // last context
            thisScoped.handler.context = JSON.stringify(data.result.contexts); // new context
            thisScoped.handler.AlexaSays = data.result.fulfillment.speech;
            thisScoped.emit('SetContext')
            thisScoped.emit(thisScoped.handler.speechHandler)
          }else if(data.result.action == 'book.end'){
            thisScoped.handler.lastContext = thisScoped.handler.context; // last context
            thisScoped.handler.context = JSON.stringify(data.result.contexts); // new context
            thisScoped.handler.AlexaSays = data.result.fulfillment.speech;
            thisScoped.emit('ResetContext')
            // TODO: Delete the context item here
            thisScoped.emit("AlexaTells")
          }
      });
    },
    'Unhandled':function(){
      this.handler.useLastRequest = true;
      this.handler.errorHandler = "Sorry, I didn't understand your response. I will repeat the questions so you can try again. ";
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
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = process.env.APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

exports.intentHandlers = handlers
