const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const assert = chai .assert
const sinon = require('sinon');
const sinonChai = require('chai-sinon');
const AWS = require('aws-sdk-mock');
const vax = require("virtual-alexa");
const nock = require('nock');
const skillsHandler = require('../index')
const events = require("./fixtures/events")
const dialogFix = require('./fixtures/dialogflow')
const requestParams = require('../requestParams')
const md5 = require("md5")
const fetchMock = require("fetch-mock")

require('dotenv').config();
chai.use(chaiAsPromised);
chai.use(sinonChai);
// nock.recorder.rec()

describe('Running Unit test on Skill Handlers', () => {
  it('GenericHandler Handles slots without underscores', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.noUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    AWS.mock('DynamoDB', 'getItem', spy);
    skillsHandler.intentHandlers.GenericHandler()
    expect(spy1.called).to.be.true
    expect(skillsHandler.intentHandlers.handler.userSays).to.equal("homework")
    AWS.restore('DynamoDB');
  });
  it('GenericHandler Handles slots with underscores', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    AWS.mock('DynamoDB', 'getItem', spy);
    skillsHandler.intentHandlers.GenericHandler()
    expect(spy1.called).to.be.true
    expect(skillsHandler.intentHandlers.handler.userSays).to.equal("add task")
    AWS.restore('DynamoDB');
  });
  it('ResetContext should remove item from DynamoDB', function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    AWS.mock('DynamoDB', 'deleteItem', spy);
    skillsHandler.intentHandlers.ResetContext()
    expect(spy.called).to.be.true
    var params = {
       Key: {
        "session": {
          S: md5("xyz")
         }
       },
       TableName:  process.env.TABLE_NAME
      };
    expect(JSON.stringify(spy.args[0][0])).to.equal(JSON.stringify(params))
    AWS.restore('DynamoDB');
  });
  it('SetContext should remove item from DynamoDB', function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {
      "context":"testcontext",
      "lastSaid":"lastsaid",
      "lastContext":"lastcontext",
      "nextError":"nexterror",
      "userSays":"hi"
    }
    const spy = new sinon.spy();
    AWS.mock('DynamoDB', 'putItem', spy);
    skillsHandler.intentHandlers.SetContext()
    expect(spy.called).to.be.true
    var params = {
       Item: {
        "session": {
          S: md5("xyz")
         },
        "context": {
          S: "testcontext"
        },
        "lastsaid":{
          S: "hi"
        },
        "lastcontext":{
          S: "lastcontext"
        },
        "nexterror":{
          S: "nexterror"
        }
       },
       TableName: process.env.TABLE_NAME
     };
    expect(JSON.stringify(spy.args[0][0])).to.equal(JSON.stringify(params))
    AWS.restore('DynamoDB');
  });
  it('CallDialogFlow Sends the correct HTTP Request', async function () {
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    skillsHandler.intentHandlers.handler.context = JSON.stringify([{name:"abc", value:"123", lifespan:2}])
    skillsHandler.intentHandlers.handler.userSays = "hello"
    // setup handler for request
    fetchMock.post('https://api.dialogflow.com/v1/query?v=20150910', {hello: 'world'});
    skillsHandler.intentHandlers.CallDialogFlow()
    expect(fetchMock.done()).to.equal(true)
    fetchMock.restore();
  });
  it('CallDialogFlowResponse should call correct handler method', async function () {
    skillsHandler.intentHandlers.emit = function(call){}
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {
      "context":"testcontext",
      "lastSaid":"lastsaid",
      "lastContext":"lastcontext",
      "nextError":"nexterror",
      "speechHandler":"Test",
      "userSays":"hi",
      "dialogFlowErr":null,
      "dialogFlowBody":dialogFix.inSession,
      "dialogFlowHttpResponse":null
    }
    let spyer = sinon.spy(skillsHandler.intentHandlers, "emit")
    skillsHandler.intentHandlers.CallDialogFlowResponse()
    expect(spyer.getCall(1).args[0]).to.equal("Test")
  });
  it('CallDialogFlowResponse Sends the correct HTTP Request Hook at end of session', async function () {
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {
      "context":JSON.stringify({"testcontext":{"name":"test"}}),
      "lastSaid":"lastsaid",
      "lastContext":"lastcontext",
      "nextError":"nexterror",
      "speechHandler":"Test",
      "userSays":"hi",
      "dialogFlowErr":null,
      "dialogFlowBody":dialogFix.endSession,
      "dialogFlowHttpResponse":null
    }
    let res = skillsHandler.intentHandlers.handler.dialogFlowBody
    let params = requestParams["add_expense"]
    fetchMock.post(params.url, {hello: 'world'});
    skillsHandler.intentHandlers.CallDialogFlowResponse()
    expect(fetchMock.done()).to.equal(true)
    fetchMock.restore();
  });
  it('AlexaAsks Handles slots with underscores', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {
      "errorHandler":null,
      "AlexaSays":"hello world"
    }
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    skillsHandler.intentHandlers.AlexaAsks()
    expect(spy1.getCall(0).args[0]).to.equal(":ask")
    expect(spy1.getCall(0).args[1]).to.equal("hello world")
  });
  it('AlexaAsks Handles slots with underscores', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {
      "errorHandler":"oops! ",
      "AlexaSays":"hello world"
    }
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    skillsHandler.intentHandlers.AlexaAsks()
    expect(spy1.getCall(0).args[0]).to.equal(":ask")
    expect(spy1.getCall(0).args[1]).to.equal("oops! hello world")
  });
  it('GetContext calls GET on the database', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    AWS.mock('DynamoDB', 'getItem', spy);
    skillsHandler.intentHandlers.GetContext()
    expect(spy.called).to.be.true
    AWS.restore('DynamoDB');
  });
});
