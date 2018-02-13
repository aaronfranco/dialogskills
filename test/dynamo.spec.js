var test = require('unit.js');
var sinon = require('sinon')
var AWS = require('aws-sdk-mock');
var DatabaseAdapter = require('../dynamo.js')
var md5 = require("md5")

const db = new DatabaseAdapter();

describe("Running tests on DynamoDB Database adapter GET Method", function(){
  it("Expects a callback function to be passed to the GET method.", function(){
    try{
      db.get("123")
    }catch (e){
      test.assert.equal(e.message, "Callback required for database operation: Get")
    }
  })
  it("Expects a session to be sent with the GET method.", function(){
    try{
      db.get()
    }catch (e){
      test.assert.equal(e.message, "Session required for database operation: Get")
    }
  })
  it("Expects params to be formatted properly when giving correct input.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'getItem', spy);
    db.get("123", function(data){ console.log("Dynamo Returns: ", data)})
  //  test.object({fluent: 'is awesome', deep: [0, 1]}).is({fluent: 'is awesome', deep: [0, 1]});
    var params = {
      Key: {
       "session": {
         S:  md5("123")
        }
      },
      TableName: process.env.TABLE_NAME
     }
    test.assert(spy.calledWith(params));
    AWS.restore('DynamoDB');
  })
  it("Expects DynamoDB to return the correct data when called properly.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'getItem', function(params, callback){
      callback({"data":"test"})
    });
    db.get("123", spy)
  //  test.object({fluent: 'is awesome', deep: [0, 1]}).is({fluent: 'is awesome', deep: [0, 1]});
    var params = {
      Key: {
       "session": {
         S:  md5("123")
        }
      },
      TableName: process.env.TABLE_NAME
     }
    test.assert(spy.calledWith({"data":"test"}));
    AWS.restore('DynamoDB');
  })
})




describe("Running tests on DynamoDB Database adapter UPDATE", function(){
  it("Expects a session to be sent with the UPDATE method.", function(){
    try{
      db.update()
    }catch (e){
      test.assert.equal(e.message, "Session required for database operation: UPDATE")
    }
  })
  it("Expects a context to be sent with the UPDATE method.", function(){
    try{
      db.update("123")
    }catch (e){
      test.assert.equal(e.message, "Context required for database operation: UPDATE")
    }
  })
  it("Expects a lastsaid argument to be sent with the UPDATE method.", function(){
    try{
      db.update("124", "context")
    }catch (e){
      test.assert.equal(e.message, "Lastsaid required for database operation: UPDATE")
    }
  })
  it("Expects a lastcontext to be sent with the UPDATE method.", function(){
    try{
      db.update("123", "context", "lastsaid")
    }catch (e){
      test.assert.equal(e.message, "Lastcontext required for database operation: UPDATE")
    }
  })
  it("Expects a nexterror to be sent with the UPDATE method.", function(){
    try{
      db.update("123", "context", "lastsaid", "lastcontext")
    }catch (e){
      test.assert.equal(e.message, "Nexterror required for database operation: UPDATE")
    }
  })
  it("Expects a callback function to be passed to the UPDATE method.", function(){
    try{
      db.update("123", "context", "lastsaid", "lastcontext", "nexterror")
    }catch (e){
      test.assert.equal(e.message, "Callback required for database operation: UPDATE")
    }
  })
  it("Expects params to be formatted properly when giving correct input.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'putItem', spy);
    db.update("123", "context", "lastsaid", "lastContext", "nexterror", function(data){ console.log("Dynamo Returns: ", data)})
  //  test.object({fluent: 'is awesome', deep: [0, 1]}).is({fluent: 'is awesome', deep: [0, 1]});
    var params = {
       Item: {
        "session": {
          S: md5("123")
         },
        "context": {
          S: "context"
        },
        "lastsaid":{
          S: "lastsaid"
        },
        "lastcontext":{
          S: "lastContext"
        },
        "nexterror":{
          S: "nexterror"
        }
       },
       TableName: process.env.TABLE_NAME
      };
    test.assert(spy.calledWith(params));
    AWS.restore('DynamoDB');
  })
  it("Expects DynamoDB to return the correct data when UPDATE is called properly.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'putItem', function(params, callback){
      callback({"data":"test"})
    });
    db.update("123", "context", "lastsaid", "lastcontext", "nexterror", spy)
    test.assert(spy.calledWith({"data":"test"}));
    AWS.restore('DynamoDB');
  })
})





describe("Running tests on DynamoDB Database adapter DELETE Method", function(){
  it("Expects a session to be sent with the DELETE method.", function(){
    try{
      db.delete()
    }catch (e){
      test.assert.equal(e.message, "Session required for database operation: Delete")
    }
  })
  it("Expects a callback function to be passed to the DELETE method.", function(){
    try{
      db.delete("123")
    }catch (e){
      test.assert.equal(e.message, "Callback required for database operation: Delete")
    }
  })

  it("Expects params to be formatted properly when giving correct input.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'deleteItem', spy);
    db.delete("123", function(data){ console.log("Dynamo Returns: ", data)})
    var params = {
       Key: {
        "session": {
          S: md5("123")
         }
       },
       TableName:  process.env.TABLE_NAME
      };
    test.assert(spy.calledWith(params));
    AWS.restore('DynamoDB');
  })
  it("Expects DynamoDB to return the correct data when called properly.", function(){
    var spy = test.spy();
    AWS.mock('DynamoDB', 'deleteItem', function(params, callback){
      callback({})
    });
    db.delete("123", spy)
    test.assert(spy.calledWith({}));
    AWS.restore('DynamoDB');
  })
})
