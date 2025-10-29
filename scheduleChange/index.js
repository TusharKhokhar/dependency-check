const { EventBridgeClient, ListRulesCommand,
    DisableRuleCommand, EnableRuleCommand } = require("@aws-sdk/client-eventbridge");

module.exports.handler = async (event) => {
    console.log('-----', event['Records'][0]['Sns']['Message']);
    let eventBody = JSON.parse(event['Records'][0]['Sns']['Message']);
    let newStateValue = eventBody.NewStateValue;

    if (newStateValue.toLowerCase() === 'alarm'){
        await performAction('us-west-2', 'enable');
        await performAction('us-east-1', 'disable');
    }
    if (newStateValue.toLowerCase() === 'ok'){
        await performAction('us-west-2', 'disable');
        await performAction('us-east-1', 'enable');
    }
}

const performAction = async (region, action) => {
    const eventBridge = new EventBridgeClient({ region: region });
    const { Rules } = await getAllEvents(eventBridge);
    for (let rule of Rules) {
        if (!rule.ManagedBy) {
            action === 'disable' ? await disableRule(rule.Name, eventBridge) : await enableRule(rule.Name, eventBridge);
        }
    }
}

const disableRule = async (ruleName, eventBridge) => {
    try {
        const params = {
            Name: ruleName,
            EventBusName: 'default'
        };
        const command = new DisableRuleCommand(params);
        const data = await eventBridge.send(command);
        return data;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const enableRule = async (ruleName, eventBridge) => {
    try {
        const params = {
            Name: ruleName,
            EventBusName: 'default'
        };
        const command = new EnableRuleCommand(params);
        return await eventBridge.send(command);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const getAllEvents = async (eventBridge) => {
    try {
        const params = {
            EventBusName: 'default',
            Limit: 10
        };
        const command = new ListRulesCommand(params);
        return await eventBridge.send(command);
    } catch (err) {
        console.log(err);
        throw err;
    }
}