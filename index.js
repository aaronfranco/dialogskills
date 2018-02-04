/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/


const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const request = require('request');
const md5 = require('md5');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
require('dotenv').config();

const handlers = {

    /*>>>> START HANDLERS*/
    'Start': function(){
      this.emit('GenericHandler')
    },
    'NamedIntent':function(){
      this.emit('GenericHandler')
    },
    /*>>>> END HANDLERS */

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
      this.handler.userSays = this.event.request.intent.slots[Object.keys(this.event.request.intent.slots)[0]].name.split("_").join(" ")
      // console.log("User Says: " + this.handler.userSays)
      this.handler.speechHandler = "AlexaAsks"
      this.handler.nextHandler = 'CallDialogFlow'
      this.emit('GetContext')
    },
    // Get Context from Dynamo DB
    'GetContext':function(){
      // console.log("Getting context")
      // scope the handler for Async response data management
      var thisScoped = this;

      // set params for the DynamoDB request
      var params = {
        Key: {
         "session": {
           S:  md5(this.event.session.sessionId)
          }
        },
        TableName: process.env.TABLE_NAME
       };

      // execute the DynamoDB getItem API
      dynamodb.getItem(params, function(err, data) {
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

      });

    },

    // setting context for a user session after context is received from DialogFlow
    'SetContext':function(){

      // set a new context variable, or update an existing on using DynamoDB putItem API
      var params = {
         Item: {
          "session": {
            S: md5(this.event.session.sessionId)
           },
          "context": {
            S: this.handler.context
          },
          "lastsaid":{
            S: this.handler.userSays
          },
          "lastcontext":{
            S: this.handler.lastContext
          }
         },
         TableName: process.env.TABLE_NAME
        };

        // make the API call to Dynamo DB
        dynamodb.putItem(params, function(err, data) {
          if (err) {

            console.log(err, err.stack); // an error occurred

          }else{

            // no need to save the data to a variable becuse this will only be called after a response received
            console.log(data); // successful response

          }

        });

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

};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = process.env.APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
