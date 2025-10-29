module.exports = {
    aliasEmailsGroup: (advancesEmails) => {
        let finalEmails = {
            bw: [],
            color: []
        }
        advancesEmails && advancesEmails.forEach(email => {
            email.CombinationType.split('_')[0] === 'bw' ? finalEmails.bw.push(email) : finalEmails.color.push(email)
        })
        return finalEmails
    }
}