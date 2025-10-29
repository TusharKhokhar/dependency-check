module.exports = {
    TIER: 'standard',
    EXECUTIVE_REPORT: 'executive report',
    REGION: process.env.region ? process.env.region : 'us-east-1',
    GENERATE_REPORT_LAMBDA: process.env.functionName ? process.env.functionName : 'bigxpose-staging-WebSocketAPIs-1SJ-generateReports-WEoa1Mx4ttXL',

}
