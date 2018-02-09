const AWS = require('aws-sdk');
class DynamoAdapter {
  constructor(){
    this.params = {}
    this.dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
  }
  delete(session, callback){
    if(callback === undefined || callback === null){
      throw new Error("Callback required for database operation: Delete")
    }
      var params = {
         Item: {
          "session": {
            S: md5(session)
           }
         },
         TableName:  process.env.TABLE_NAME
        };
      dynamodb.deleteItem(params, callback);
  },
  get(session, callback){
    if(callback === undefined || callback === null){
      throw new Error("Callback required for database operation: Get")
    }
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
    if(callback === undefined || callback === null){
      throw new Error("Callback required for database operation: Update")
    }
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
       TableName: this.tablename
      };

      // make the API call to Dynamo DB
      this.dynamodb.putItem(params, callback);
  }
}
