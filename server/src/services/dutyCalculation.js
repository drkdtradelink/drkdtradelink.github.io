/**
 * Duty Calculation Engine with custom formula parsing support
 */

function safeEval(expression) {
  // Allow only digits, operators, dots, brackets, and spaces
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error('Unsafe character detected in calculation formula.');
  }
  return new Function(`return (${expression})`)();
}

/**
 * Calculates duty details for a specific item
 * @param {Object} params
 * @param {number} params.qty - Quantity of cases
 * @param {number} params.pricePerCaseUSD - USD price per case
 * @param {number} params.exchangeRate - USD to INR exchange rate
 * @param {number} params.dutyPercentage - Duty percentage (e.g. 110.0 for 110%)
 * @param {string} [params.formula] - Custom math formula string
 * @returns {Object} dutyDetails
 */
function calculateItemDuty({ qty, pricePerCaseUSD, exchangeRate, dutyPercentage, formula }) {
  const quantity = Number(qty);
  const price = Number(pricePerCaseUSD);
  const rate = Number(exchangeRate);
  const pct = Number(dutyPercentage);

  const usdValue = Number((quantity * price).toFixed(2));
  const assessableValueInr = Number((usdValue * rate).toFixed(2));
  
  let dutyAmountInr;
  
  if (formula) {
    try {
      // Replace algebraic variables with actual values
      let parsedFormula = formula
        .replace(/\bqty\b/g, quantity.toString())
        .replace(/\bpricePerCaseUSD\b/g, price.toString())
        .replace(/\bexchangeRate\b/g, rate.toString())
        .replace(/\bdutyPercentage\b/g, pct.toString())
        .replace(/\busdValue\b/g, usdValue.toString())
        .replace(/\bassessableValueInr\b/g, assessableValueInr.toString());
      
      const computed = safeEval(parsedFormula);
      dutyAmountInr = Number(Number(computed).toFixed(2));
    } catch (err) {
      console.error('Formula evaluation error, falling back to default:', err);
      dutyAmountInr = Number((assessableValueInr * (pct / 100)).toFixed(2));
    }
  } else {
    dutyAmountInr = Number((assessableValueInr * (pct / 100)).toFixed(2));
  }

  return {
    usdValue,
    assessableValueInr,
    dutyPercentage: pct,
    dutyAmountInr
  };
}

module.exports = {
  calculateItemDuty
};
