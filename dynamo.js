require('dotenv').config();
const AWS = require('aws-sdk');
const md5 = require('md5');

class DynamoAdapter {
  constructor(){
    AWS.config.update({region:process.env.AWS_DEFAULT_REGION});
  }
  delete(session, callback){
    if(session === undefined || session === null){
      throw new Error("Session required for database operation: Get")
    }
    if(callback === undefined || callback === null){
      return new Error("Callback required for database operation: Delete")
    }
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
       Item: {
        "session": {
          S: md5(session)
         }
       },
       TableName:  process.env.TABLE_NAME
      };
    dynamodb.deleteItem(params, callback);
  }
  get(session, callback){
    if(session === undefined || session === null){
      throw new Error("Session required for database operation: Get")
    }
    if(callback === undefined || callback === null){
      throw new Error("Callback required for database operation: Get")
    }
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
      Key: {
       "session": {
         S:  md5(session)
        }
      },
      TableName: process.env.TABLE_NAME
     };
    // execute the DynamoDB getItem API
    dynamodb.getItem(params, callback);
  }
  update(session, context, lastsaid, lastcontext, nexterror, callback){
    if(session === undefined || session === null){
      throw new Error("Session required for database operation: Get")
    }
    if(callback === undefined || callback === null){
      throw new Error("Callback required for database operation: Get")
    }
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
       Item: {
        "session": {
          S: md5(session)
         },
        "context": {
          S: context
        },
        "lastsaid":{
          S: lastsaid
        },
        "lastcontext":{
          S: lastContext
        },
        "nexterror":{
          S: nexterror
        }
       },
       TableName: process.env.TABLE_NAME
      };

      // make the API call to Dynamo DB
      dynamodb.putItem(params, callback);
  }
}
module.exports = DynamoAdapter
