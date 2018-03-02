const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('chai-sinon');
const AWS = require('aws-sdk-mock');
const vax = require("virtual-alexa");
const skillsHandler = require('../index')
const events = require("./fixtures/events")
const md5 = require("md5")
chai.use(chaiAsPromised);
chai.use(sinonChai);


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
  it('Named Handler Homework should call GenericHandler', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    AWS.mock('DynamoDB', 'getItem', spy);
    skillsHandler.intentHandlers.Homework()
    expect(spy1.calledWith("GenericHandler")).to.be.true
    AWS.restore('DynamoDB');
  });
  it('Named Handler Areyouarobot should call GenericHandler', async function () {
    let spyer = function(call){}
    skillsHandler.intentHandlers.emit = spyer
    skillsHandler.intentHandlers.event = events.withUnderscore
    skillsHandler.intentHandlers.handler = {}
    const spy = new sinon.spy();
    const spy1 = new sinon.spy(skillsHandler.intentHandlers, "emit")
    AWS.mock('DynamoDB', 'getItem', spy);
    skillsHandler.intentHandlers.Areyouarobot()
    expect(spy1.calledWith("GenericHandler")).to.be.true
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
});
