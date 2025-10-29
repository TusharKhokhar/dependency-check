
Handlebars.registerHelper('ifCond', function(e) {
        if(e > 0) {
            return "<div style='page-break-before: always;'></div>";
        }
    });

    Handlebars.registerHelper('allDataArraysHaveLength', function(transactionTypes, options) {
    return transactionTypes.some(transactionType => transactionType.data.length > 0) ? options.fn(this) : options.inverse(this);
});

//global variables to calculate the grand total values
var grandTotalPages = 0; var grandCoverPageTotal = 0; var grandTotalCost = 0; var grandCashPaymentTotal = 0; 
var grandCcPaymentTotal = 0; var grandFreetotal = 0;
var grandTotalAmount = 0;

//variables to calculate the floor wise total
var floorWiseTotal = 0; var floorWiseCoverPage = 0; var floorWiseTotalCost = 0; var floorWiseCashPayment = 0; 
var floorWiseCreditCardPayment = 0; var floorWiseFree = 0; 
var floorWiseTotalAmount = 0; var floorWiseTotalPageCount = 0;


//to reset the values of each floor
var resetfloorWiseTotal = 0; var resetfloorWiseCoverPage = 0; var resetfloorWiseTotalCost = 0; var resetfloorWiseCashPayment = 0;
var resetfloorWiseCreditCardPayment = 0; var resetfloorWiseFree = 0; var resetfloorWiseTotalAmount = 0


//reset grandtotal values
function resetFlags() {
    grandTotalPages = 0; grandCoverPageTotal = 0; grandTotalCost = 0; grandCashPaymentTotal = 0; grandCcPaymentTotal = 0; grandFreetotal = 0;
}



//calculate floorWiseTotalCost
function calculateFloorWiseTotalCost(decimal, decimalSeparator) {
    resetfloorWiseTotalCost = floorWiseTotalPageCount;
    floorWiseTotalPageCount = 0;
    var totalPages = hasDecimal(resetfloorWiseTotalCost, decimalSeparator)
    return totalPages;
}

function removeDecimalIfZero(number) {
    // Convert the number to a string
    const numString = number.toString();
    
    // Split the string at the decimal point
    const parts = numString.split('.');
    
    // If the decimal part is "00", return only the integer part as a number
    if (parts[1] === '00') {
        return parseInt(parts[0], 10); // Return only the integer part as a number
    } else {
        return Number(number).toFixed(2); // Return the original number
    }
}

//calculate floorWiseTotalAmount
function calculateFloorWiseTotalAmount(decimal, decimalSeparator) {
    resetfloorWiseTotalAmount = floorWiseTotalAmount;
    floorWiseTotalAmount = 0;
    return resetfloorWiseTotalAmount.toFixed(decimal).replace('.', decimalSeparator);
}

function getResetAmount() {
    return true;
}

//calculate totalPages
function calculateTotal(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.PageCount; 
    }); 
    grandTotalPages+= sum; 
    floorWiseTotalPageCount+= sum;
    var pages = hasDecimal(sum, decimalSeparator)
    return pages; 
}

function hasDecimal(number, decimalSeparator) {
    var value = number.toString().includes('.') ? number.toFixed(2).replace('.', decimalSeparator) : number
    return value;
}

//calculate totalAmount
function calculateTotalAmount(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.TotalAmount; 
    }); 
    grandTotalAmount+= sum; 
    floorWiseTotalAmount+= sum;
    return sum.toFixed(decimal).replace('.', decimalSeparator); 
}

//calculate coverPages
function calculateCoverPage(documentTypes) { 
    var sum = 0; 
    documentTypes.forEach(function (i) { 
        sum += i.coverPages; 
    }); 
    grandCoverPageTotal+= sum; 
    floorWiseCoverPage+= sum; 
    return sum; 
}

//grand total methods
function calculateGrandTotal (decimal, decimalSeparator) { return hasDecimal(grandTotalPages, decimalSeparator); }
function calculateGrandTotalAmount (decimal, decimalSeparator) {
    return grandTotalAmount.toFixed(decimal).replace('.', decimalSeparator)
}

function roundNumber (item, decimal, decimalSeparator) {
    return item.toFixed(decimal).replace('.', decimalSeparator);
}




function styles(hex) {
    return 'background-color:' + hex;
}

Handlebars.registerHelper('isSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.TotalAmount;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isPageCountSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.PageCount;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandPageCountSumGreaterThanZero', function (options) {
  return grandTotalPages > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandAmountSumGreaterThanZero', function (options) {
  return grandTotalAmount > 0 ? options.fn(this) : options.inverse(this);
});