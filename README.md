# DialogSkills v0.1a
### Under heavy development and looking for contributors
DialogSkills is a framework for rapid development of Alexa Skills by exporting Agents from Google's DialogFlow and converting the exported data into usable Alexa Skills following a programming convention. This version of DialogSkills makes the assumption that your skill's backend is hosted as an AWS Lambda function written in Node.js.

## Goals
The goal of this project is to support more than just one platform and backend. As our community grows, we encourage the development of multiple configuration support. For example, Google Cloud Functions, IBM Bluemix etc.

## Conventions
The convention is based on a generic event handler that manages all Alexa input. When an Utterance is recognized by Alexa, an Intent is triggered in the skill's function or backend. The Alexa SDK then triggers a handler based on what is meant to happen according to the intent. The convention in DialogSkills uses a named handler called "GenericHandler" which uses the name of the incoming Slot from Alexa's recognition and forwards it to another handler named "CallDialogFlow."

## Setup

```
npm install
```
You will also need a ".env" file to store all the app's credentials

```
APP_ID=xxx
AGENT_ID=xxx
TABLE_NAME=adventurebooks
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-1
UNHANDLED=Alexa's reply if a request cannot be handled
```

## FAQ
##### Q. Why use DialogFlow as opposed to just using Alexa Skills Builder?
A. I'm comfortable with using DialogFlow for building chat interfaces and I would like my Skill to be easily converted to other voice command platforms like Google Home. Sure, some libraries already exist for this, but I also find DialogFlow to be the easiest way to develop natural langauge understanding for any chat based product.

## TODO
1. Add development pipeline tools
3. Redesign OO structure (WIP)
    - Remove anonymous functions into helper class
4. Database Adapter (WIP)
5. Cloudformation Template
6. Export bash script to migrate DialogFlow data to Alexa format
    - convert Intents to Intents with sample Alexa Slots based on what User Says
    - convert user says to utterances and slots using Skill Management API
7. Export / Import custom slots and Entities
8. Write more tests
9. Auto create DynamoDB table
10. Auto generate Lambda functions
    - Create ENV vars in Lambda function instead of relying on .env file import.

### Features To build
1. Full export and programmatic creation of an Alexa Skills
2. Update existing skill
3. Support for additional Lambda functions connecting to DialogFlow webhooks
4. Ruby and Java support
