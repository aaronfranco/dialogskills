var test = require('unit.js');
var sinon = require('sinon')
var AWS = require('aws-sdk-mock');
var DatabaseAdapter = require('../dynamo.js')
var md5 = require("md5")

const db = new DatabaseAdapter();

describe("Running tests on DynamoDB Database adapter", function(){
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
