
function roundNumber (item, decimal, decimalSeparator) {
    const typeToNumber = Number(item)
    return typeToNumber.toFixed(decimal).replace('.', decimalSeparator);
}

function hasDecimal(number, decimalSeparator) {
    var value = number?.toString().includes('.') ? number.toFixed(2).replace('.', decimalSeparator) : number
    return value;
}

function isPageNumber(item, title, decimal, decimalSeparator) {
    if(title === 'Total Pages') {
        return hasDecimal(item, decimalSeparator)
    }else{
        return roundNumber(item, decimal, decimalSeparator)
    }
}
