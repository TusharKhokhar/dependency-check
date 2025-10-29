
Handlebars.registerHelper('ifCond', function(e) {
        if(e > 0) {
            return "<div style='page-break-before: always;'></div>";
        }
    });

Handlebars.registerHelper('isColorSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.ColorPages;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrayscaleSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.GrayscalePages;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('allDataArraysHaveLength', function(transactionTypes, options) {
  return transactionTypes.some(transactionType => transactionType.data.length > 0) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isTotalPagesSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.TotalPages;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});


Handlebars.registerHelper('isTotalPagesSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.TotalPages;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});


Handlebars.registerHelper('isTotalCostSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((transactionType) => {
    transactionType.data.forEach((item) => {
      sum += item.TotalCost;
    });
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandTotalCostSumGreaterThanZero', function (options) {
  return grandTotalCost > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandTotalPagesSumGreaterThanZero', function (options) {
  return grandTotalPages > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandGrayscaleSumGreaterThanZero', function (options) {
  return grandTotalGrayscalePages > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandColorSumGreaterThanZero', function (options) {
  return grandTotalColorPages > 0 ? options.fn(this) : options.inverse(this);
});

//global variables to calculate the grand total values
var grandTotalPages = 0; var grandCoverPageTotal = 0; var grandTotalCost = 0; var grandCashPaymentTotal = 0; 
var grandCcPaymentTotal = 0; var grandFreetotal = 0;
var grandTotalAmount = 0; var grandTotalGrayscalePages = 0; var grandTotalColorPages = 0;

//variables to calculate the floor wise total
var floorWiseTotal = 0; var floorWiseCoverPage = 0; var floorWiseTotalCost = 0; var floorWiseCashPayment = 0; 
var floorWiseCreditCardPayment = 0; var floorWiseFree = 0; 
var floorWiseTotalPageCount = 0; var floorWiseTotalGrayscalePages = 0; var floorWiseTotalColorPages = 0;


var resetfloorWiseTotalCost = 0; var resetfloorWiseTotalPage = 0;
var resetfloorWiseTotalGrayscale =0; var resetfloorWiseTotalColor = 0;

//reset grandtotal values
function resetFlags() {
    grandTotalPages = 0; grandCoverPageTotal = 0; grandTotalCost = 0; grandCashPaymentTotal = 0; grandCcPaymentTotal = 0; grandFreetotal = 0;
}



//calculate floorWiseTotalPage
function calculateFloorWiseTotalPage(decimal, decimalSeparator) {
    resetfloorWiseTotalPage = floorWiseTotalPageCount;
    floorWiseTotalPageCount = 0;
    var floorWiseTotal = hasDecimal(resetfloorWiseTotalPage, decimalSeparator)
    return floorWiseTotal;
}

//calculate floorWiseTotalGrayscale
function calculateFloorWiseTotalGrayscale(decimal, decimalSeparator) {
    resetfloorWiseTotalGrayscale = floorWiseTotalGrayscalePages;
    floorWiseTotalGrayscalePages = 0;
    var floorWiseGrayscale = hasDecimal(resetfloorWiseTotalGrayscale, decimalSeparator)
    return floorWiseGrayscale
}


//calculate floorWiseTotalColor
function calculateFloorWiseTotalColor(decimal, decimalSeparator) {
    resetfloorWiseTotalColor = floorWiseTotalColorPages;
    floorWiseTotalColorPages = 0;
    var floorWiseColor = hasDecimal(resetfloorWiseTotalColor, decimalSeparator)
    return floorWiseColor;
}

//calculate floorWiseTotalCost
function calculateFloorWiseTotalCost(decimal, decimalSeparator) {
    resetfloorWiseTotalCost = floorWiseTotalCost;
    floorWiseTotalCost = 0;
    return resetfloorWiseTotalCost.toFixed(decimal).replace('.', decimalSeparator);
}

function getResetAmount() {
    return true;
}

//calculate totalPages
function calculateTotalPages(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.TotalPages; 
    }); 
    grandTotalPages+= sum; 
    floorWiseTotalPageCount+= sum;
    var totalPages = hasDecimal(sum, decimalSeparator)
    return totalPages; 
}

//calculate totalCost
function calculateTotalCost(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.TotalCost; 
    }); 
    grandTotalCost+= sum; 
    floorWiseTotalCost+= sum;
    return sum.toFixed(decimal).replace('.', decimalSeparator); 
}


//calculate totalGrayscalePages
function calculateTotalGrayscalePages(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.GrayscalePages; 
    }); 
    grandTotalGrayscalePages+= sum; 
    floorWiseTotalGrayscalePages+= sum;
    var grayScalePages = hasDecimal(sum, decimalSeparator)
    return grayScalePages; 
}

//calculate totalColorPages
function calculateTotalColorPages(data, decimal, decimalSeparator) { 
    var sum = 0; 
    data.forEach(function (i) { 
        sum += i.ColorPages; 
    }); 
    grandTotalColorPages+= sum; 
    floorWiseTotalColorPages+= sum;
    var colorPages = hasDecimal(sum, decimalSeparator)
    return colorPages; 
}

//grand total methods
function calculateGrandTotal (decimalSeparator) { return hasDecimal(grandTotalPages, decimalSeparator); }


function calculateGrandTotalCost (decimal, decimalSeparator) { return grandTotalCost.toFixed(decimal).replace('.', decimalSeparator); }

function calculateGrandTotalGrayscalePages (decimalSeparator) { return hasDecimal(grandTotalGrayscalePages, decimalSeparator); }

function calculateGrandTotalColorPages (decimalSeparator) { return hasDecimal(grandTotalColorPages, decimalSeparator); }

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


function hasDecimal(number, decimalSeparator) {
    var value = number?.toString().includes('.') ? number.toFixed(2).replace('.', decimalSeparator) : number
    return value;
}
