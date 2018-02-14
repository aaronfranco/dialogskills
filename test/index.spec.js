const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('chai-sinon');
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Running Unit test on GenericHandler', () => {
  it('should return the sum', () => {
    // Get the intent handler function
    let handler = skillInstance.intentHandlers.GenericIntent;
    // Define the intent input
    let intent = {
      'name': 'sumIntent',
      'slots': {
        'left': {
          'name': 'left',
          'value': "2"
        },
        'right': {
          'name': 'right',
          'value': "3"
        }
      }
    };
    // Stub the response object using Sinon to be able to validate
    // what is the response sent by the intent handler
    let response = {
      tell: sinon.stub(),
      ask: sinon.stub()
    };
    // Empty session since this intent does not need it
    let session = {};
    // Call the intent
    handler(intent, session, response);
    // Assert the result was told
    expect(response.tell).to.have.been.calledWith(5);
  });
});
