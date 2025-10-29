var floorWiseTotalAmount = 0; var resetfloorWiseTotalAmount = 0;
var grandTotalAmount = 0
function styles(hex) {
    return 'background-color:' + hex;
}

function calculateTotalAmount(data, decimal, decimalSeparator) {
    var sum = 0;
        data.forEach(function(i) {
            sum+= i.Amount;
        })

grandTotalAmount += sum;
return sum.toFixed(decimal).replace('.', decimalSeparator);
}


function roundNumber(num, decimal, decimalSeparator) {
    return num.toFixed(decimal).replace('.', decimalSeparator);
}

function calculateGrandTotal (decimal, decimalSeparator) { return grandTotalAmount.toFixed(decimal).replace('.', decimalSeparator); }

function resetFlags () {
    floorWiseTotalAmount = resetfloorWiseTotalAmount= grandTotalAmount = 0
}

Handlebars.registerHelper('isAmountSumGreaterThanZero', function (data, options) {
  let sum = 0;
  data.forEach((item) => {
      sum += item.Amount;
  });
  return sum > 0 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isGrandAmountSumGreaterThanZero', function (options) {
  return grandTotalAmount > 0 ? options.fn(this) : options.inverse(this);
});