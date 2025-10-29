
//global variables to calculate the grand total values
var totalColorPagesCount = 0;
var totalGrayScalePagesCount = 0;
var totalDuplexPagesCount = 0;
var totalPrintedCount = 0;
var totalJobsCount = 0;
var totalCostsCount = 0;

function totalColorPages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.ColorPages;
    })
    totalColorPagesCount = sum;
    var totalColor = hasDecimal(totalColorPagesCount, decimalSeparator)
    return totalColor;
}

function totalGrayScalePages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.GrayScalePages;
    })
    totalGrayScalePagesCount = sum;
    var totalGray = hasDecimal(totalGrayScalePagesCount, decimalSeparator)
    return totalGray;
}


function truncate(cost, decimal, decimalSeparator) {
    return Number(cost).toFixed(decimal).replace('.', decimalSeparator);
}


function totalPrintedPages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.TotalPrintedPages;
    })
    totalPrintedCount = sum;
    var totalPrinted = hasDecimal(totalPrintedCount, decimalSeparator)
    return totalPrinted;
}

function totalDuplexPages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.DuplexPages;
    })
    totalDuplexPagesCount = sum;
    var totalDuplex = hasDecimal(totalDuplexPagesCount, decimalSeparator)
    return totalDuplex;
}
function totalJobsPages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.Jobs;
    })
    totalJobsCount = sum;
    return totalJobsCount.toFixed(decimal).replace('.', decimalSeparator);
}
function totalCostsPages(data, decimal, decimalSeparator) {
    var sum = 0;
    data.forEach(function(i) {
        sum += +i.Costs;
    })
    totalCostsCount = sum;
    return Number(totalCostsCount).toFixed(decimal).replace('.', decimalSeparator);
}

function roundNumber(number, decimal, decimalSeparator) {
    const typeToNumber = Number(number);

    return typeToNumber.toFixed(decimal).replace('.', decimalSeparator);
}

function styles(hex) {
    return 'background-color:' + hex;
}

function hasDecimal(number, decimalSeparator) {
    var valueNumber = Number(number)
    var value = valueNumber?.toString().includes('.') ? valueNumber.toFixed(2).replace('.', decimalSeparator) : valueNumber
    return value;
}
