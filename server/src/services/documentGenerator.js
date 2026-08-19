const numberToWords = (amount) => {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const numStr = num.toString();
  if (numStr.length > 9) return 'Overflow';
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
};

function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderGRFront(transaction, company, party, items, totals) {
  const itemsRows = items.map((item, index) => `
    <tr>
      ${index === 0 ? `<td rowspan="${items.length}" class="align-top font-bold">${item.beDetails || ''}</td>` : ''}
      ${index === 0 ? `<td rowspan="${items.length}" class="align-top font-bold">${item.bondDetails || ''}</td>` : ''}
      ${index === 0 ? `
        <td rowspan="${items.length}" class="align-top">
          <b>${company.warehouseCode || '_____________'}</b><br>
          ${company.legalName}
        </td>` : ''}
      <td class="text-center">${index + 1}</td>
      <td>${item.item}</td>
      <td class="text-center">${item.qty} ${item.unit || 'Cases'}</td>
      <td>${item.packing}</td>
      <td class="text-right">${Number(item.usdValue).toFixed(2)}</td>
      <td class="text-right">${Number(item.assessableValueInr).toFixed(2)}</td>
      <td class="text-right">${Number(item.dutyAmountInr).toFixed(2)}</td>
      ${index === 0 ? `
        <td rowspan="${items.length}" class="align-top">
          <b>${party.name}</b><br>
          ${party.address}, ${party.city}, ${party.state}
        </td>` : ''}
      ${index === 0 ? `<td rowspan="${items.length}" class="align-top">${company.customStation || 'BOND C.H.KANDLA.'}</td>` : ''}
    </tr>
  `).join('');

  return `
    <div class="landscape-page page-break" style="font-size: 11px; font-family: 'Inter', sans-serif;">
      <div class="flex justify-between font-bold mb-2">
        <span>G.R FORM NO: ${transaction.grNumber}</span>
        <span>DATED: ${formatDate(transaction.date)}</span>
      </div>
      <div class="flex justify-between font-bold mb-4">
        <div class="w-1/2">
          WAREHOUSE CODE: ${company.warehouseCode || '___________'}<br>
          ${company.legalName}
        </div>
        <div class="w-1/2 text-right">
          WAREHOUSE CODE: ${party.warehouseCode || '___________'}<br>
          ${party.name}
        </div>
      </div>
      <h3 class="text-center font-bold mb-1">PART - 1</h3>
      <h3 class="text-center font-bold mb-4">FORM FOR TRANSFER OF GOODS FROM A WAREHOUSE</h3>
      <table class="w-full mb-8" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th colspan="1" style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">IMPORT DETAILS</th>
            <th colspan="2" style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">DETAILS OF WAREHOUSING</th>
            <th colspan="9" style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">GOODS</th>
          </tr>
          <tr style="background-color: #e5e7eb;">
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">BE NO & DATE</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">BOND NO & DATE</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">WAREHOUSE CODE & ADDRESS</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">SR.NO</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">ITEM</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">QTY</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">PACKING</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: right;">VALUE IN USD</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: right;">ASS VALUE (INR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: right;">DUTY AMOUNT (INR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">CONSIGNEE WAREHOUSE CODE & ADDRESS</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold;">CUSTOM STATION</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold;">
            <td colspan="5" class="text-right" style="text-align: right; border: none; padding: 4px;">TOTAL</td>
            <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${totals.cases} ${items[0]?.unit || 'Cases'}</td>
            <td style="border: none; padding: 4px;"></td>
            <td class="text-right" style="text-align: right; border: none; padding: 4px;">${totals.usd.toFixed(2)}</td>
            <td class="text-right" style="text-align: right; border: none; padding: 4px;">${totals.assessable.toFixed(2)}</td>
            <td class="text-right" style="text-align: right; border: none; padding: 4px;">${totals.duty.toFixed(2)}</td>
            <td colspan="2" style="border: none; padding: 4px;"></td>
          </tr>
          <tr>
            <td colspan="12" class="font-bold" style="border: none; padding: 4px; font-weight: bold;">EXCHANGE RATE : ${transaction.exchangeRate}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="flex justify-between mt-auto px-8 w-full" style="display: flex; justify-content: space-between; margin-top: auto; padding: 0 32px;">
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">SUPERINTENDENT (BOND)<br>(SIGNATURE WITH SEAL)</p>
        </div>
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">FOR ${company.legalName.toUpperCase()}<br>AUTHORISED SIGNATORY</p>
        </div>
      </div>
    </div>
  `;
}

function renderGRBack(transaction, company, party) {
  return `
    <div class="landscape-page page-break" style="font-size: 11px; font-family: 'Inter', sans-serif;">
      <div class="flex justify-between font-bold mb-4">
        <span>GR.FORM NO. ${transaction.grNumber}</span>
        <span>DATED: ${formatDate(transaction.date)}</span>
      </div>
      <h3 class="text-center font-bold mb-4">PART - 2</h3>
      <table class="w-full mb-8" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th colspan="4" style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">DETAILS OF DISPATCH OF GOODS</th>
            <th colspan="3" style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align: center;">DETAILS OF RECEIPT OF GOODS</th>
          </tr>
          <tr style="background-color: #e5e7eb;">
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 20%;">Registration No. & details of mean of Transport</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 15%;">Date & Time of Removal</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 15%;">Container No.</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 15%;">One Time Lock No.</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 15%;">Date & Time of receipt</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 10%;">Whether goods match with details in Part 1</th>
            <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 10%;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr style="height: 150px;">
            <td style="border: 1px solid #000; height: 150px;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
          </tr>
        </tbody>
      </table>
      
      <div class="flex justify-between mt-24 px-8" style="display: flex; justify-content: space-between; margin-top: 96px; padding: 0 32px;">
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">For ${company.legalName}</p>
          <p>Authorised Signatory</p>
        </div>
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">P.O (BOND)</p>
          <p>(Signature with Seal)</p>
        </div>
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">For M/S ${party.name.toUpperCase()}</p>
          <p>Authorised Signatory</p>
        </div>
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">P.O (BOND)</p>
          <p>(Signature with seal)</p>
        </div>
      </div>
    </div>
  `;
}

function renderDutyCalculation(transaction, company, items, totals) {
  const itemsRows = items.map((item, index) => `
    <tr>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.item}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.qty}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.packing}</td>
      <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${Number(item.assessableValueInr).toFixed(2)} / ${Number(item.usdValue).toFixed(2)}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${(Number(item.dutyPercentage)).toFixed(2)}%</td>
      <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${Number(item.dutyAmountInr).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div class="landscape-page page-break" style="font-family: 'Inter', sans-serif;">
      <h3 class="text-center font-bold underline mb-4 text-sm" style="text-align: center; text-decoration: underline; margin-bottom: 16px; font-weight: bold;">DUTY CALCULATION FOR GR FORM NO ${transaction.grNumber} (EX: 1USD = ${transaction.exchangeRate})</h3>
      <table class="w-full mb-8" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px;">SR.NO</th>
            <th style="border: 1px solid #000; padding: 4px;">ITEM</th>
            <th style="border: 1px solid #000; padding: 4px;">QTY IN CASE</th>
            <th style="border: 1px solid #000; padding: 4px;">PACKING</th>
            <th style="border: 1px solid #000; padding: 4px;">ASSESSABLE VALUE IN INR / VALUE IN USD</th>
            <th style="border: 1px solid #000; padding: 4px;">DUTY %</th>
            <th style="border: 1px solid #000; padding: 4px;">DUTY VALUE IN INR</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #f9fafb;">
            <td colspan="2" class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">TOTAL</td>
            <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${totals.cases}</td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${totals.assessable.toFixed(2)} / ${totals.usd.toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${totals.duty.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function renderSubmissionLetter(transaction, company, party, items) {
  const itemsRows = items.map((item, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 4px;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.item}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.qty} Case</td>
      <td style="border: 1px solid #000; padding: 4px;">
        ${item.beDetails}<br>
        ${item.bondDetails}
      </td>
      <td style="border: 1px solid #000; padding: 4px;">${item.balanceInBond}</td>
    </tr>
  `).join('');

  return `
    <div class="portrait-page letterhead-bg page-break" style="font-size: 13px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; min-height: 296mm; box-sizing: border-box; padding: 10mm 15mm; padding-top: ${company.letterheadBase64 ? '10mm' : '45mm'}; padding-bottom: 30mm;">
      ${company.letterheadBase64 ? `<div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;"><img src="${company.letterheadBase64}" style="max-height: 120px; max-width: 100%; object-fit: contain;"></div>` : ''}
      <div class="text-right mb-4" style="text-align: right; margin-bottom: 16px;">
        <strong>DATE:</strong> ${formatDate(transaction.date)}
      </div>
      <div class="mb-4" style="margin-bottom: 16px;">
        <p>To,</p>
        <p>The A C of Customs (BOND),</p>
        <p>Custom House</p>
        <p>Kandla.</p>
      </div>
      <div class="mb-4 font-bold" style="margin-bottom: 16px; font-weight: bold;">
        <p>Sub.: Submission of GR FORM</p>
      </div>
      <div class="mb-4" style="margin-bottom: 16px;">
        <p>Dear Sir,</p>
        <p class="mt-2 text-justify" style="margin-top: 8px; text-align: justify;">
          We have received a Buyer Order Form from <strong>M/s ${party.name}, ${party.address}, ${party.city}</strong> for items as below: -
        </p>
      </div>
      
      <table class="w-full mb-6 text-center" style="border-collapse: collapse; width: 100%; text-align: center; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px;">SR NO</th>
            <th style="border: 1px solid #000; padding: 4px;">DESCRIPTION</th>
            <th style="border: 1px solid #000; padding: 4px;">QUANTITY</th>
            <th style="border: 1px solid #000; padding: 4px;">GOOD RECEIVED BOND NO</th>
            <th style="border: 1px solid #000; padding: 4px;">BOND BALANCE</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <div class="mb-16" style="margin-bottom: 64px;">
        <p>In this regard we are submitting herewith GR No ${transaction.grNumber} Dt: ${formatDate(transaction.date)} along with below documents.</p>
        <p class="mt-2 ml-4" style="margin-top: 8px; margin-left: 16px;">1. Buyer Order Form.</p>
        <p class="mt-2" style="margin-top: 8px;">Kindly grant our request to transfer the goods as per Buyer Order Form on bond-to-bond basis.</p>
        <p class="mt-4" style="margin-top: 16px;">Yours faithfully,</p>
      </div>
      
      <div class="flex justify-between mt-auto" style="display: flex; justify-content: space-between; margin-top: auto;">
        <div>
          <p class="font-bold" style="font-weight: bold;">For ${company.legalName}</p>
          <p style="margin-top: 64px;">(Authorized Signatory)</p>
        </div>
        <div>
          <p>Pls Attend: (P.O) Shri _______________</p>
          <p style="margin-top: 64px;">Superintendent (Bond)</p>
        </div>
      </div>
    </div>
  `;
}

function renderNotesheet(transaction, company, party, items, totals) {
  const itemsRows = items.map((item, index) => `
    <tr>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.item}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.qty} ${item.unit || 'Cases'}</td>
      <td style="border: 1px solid #000; padding: 4px;">
        ${item.beDetails}<br>
        ${item.bondDetails}
      </td>
      <td style="border: 1px solid #000; padding: 4px;">${item.balanceInBond}</td>
    </tr>
  `).join('');

  return `
    <div class="portrait-page page-break" style="font-size: 13px; font-family: 'Inter', sans-serif; padding-top: 25mm; display: flex; flex-direction: column; min-height: 296mm; box-sizing: border-box; padding-left: 15mm; padding-right: 15mm; padding-bottom: 30mm;">
      <div class="mb-6" style="margin-bottom: 24px;">
        <p class="mb-2" style="margin-bottom: 8px;"><strong>Submitted Please: -</strong></p>
        <p class="mb-2" style="margin-bottom: 8px;">Kindly Pursue G.R Form No - ${transaction.grNumber} Dated: ${formatDate(transaction.date)} for Bond-to-Bond transfer filed manually, received from M/s . <strong>${company.legalName}</strong> , ${company.city.toUpperCase()}.</p>
        <p class="mb-4" style="margin-bottom: 16px;">They have filed a G.R Form for Bond store transfer to <strong>M/s ${party.name}, ${party.address}, ${party.city}</strong>.</p>
        
        <p class="mb-2 underline" style="margin-bottom: 8px; text-decoration: underline;">DETAILS:</p>
        <table class="w-2/3 mb-4" style="border: none; width: 66%; margin-bottom: 16px;">
          <tr>
            <td style="border: none; padding: 2px;">PRESENT DUTY BALANCE:</td>
            <td style="border: none; padding: 2px; font-weight: bold;">₹ ${transaction.presentDutyBalance} /-</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px;">PRESENT GR DUTY AMOUNT:</td>
            <td style="border: none; padding: 2px; font-weight: bold;">₹ ${totals.duty.toFixed(2)} /-</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px;">BALANCE DUTY AMOUNT:</td>
            <td style="border: none; padding: 2px; font-weight: bold;">₹ ${totals.balanceDutyAmount.toFixed(2)} /-</td>
          </tr>
        </table>
        
        <p class="mb-6" style="margin-bottom: 24px;">G.R Form No: ${transaction.grNumber} Dated: ${formatDate(transaction.date)} is put up for perusal, approval and Signature Please.</p>
      </div>
      
      <table class="w-full mb-6" style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px;">SR NO</th>
            <th style="border: 1px solid #000; padding: 4px;">DESCRIPTION</th>
            <th style="border: 1px solid #000; padding: 4px;">QUANTITY</th>
            <th style="border: 1px solid #000; padding: 4px;">GOODS RECEIVED BOND NO</th>
            <th style="border: 1px solid #000; padding: 4px;">BOND BALANCE</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="flex justify-between mt-auto px-8" style="display: flex; justify-content: space-between; margin-top: auto; padding: 0 32px;">
        <div>(P.O Bond)</div>
        <div class="text-center" style="text-align: center;">(Supdt Bond)</div>
        <div class="text-right" style="text-align: right;">DC / AC (Bond)</div>
      </div>
    </div>
  `;
}

function renderInvoice(transaction, company, party, items, totals) {
  const itemsRows = items.map((item, index) => `
    <tr>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.item}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.packing}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.unit || 'Cases'}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.qty}</td>
      <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${Number(item.pricePerCaseUSD).toFixed(2)}</td>
      <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${Number(item.usdValue).toFixed(2)}</td>
      <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${Number(item.assessableValueInr).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div class="portrait-page letterhead-bg page-break" style="font-size: 13px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; min-height: 296mm; box-sizing: border-box; padding: 10mm 15mm; padding-top: ${company.letterheadBase64 ? '10mm' : '45mm'}; padding-bottom: 30mm;">
      ${company.letterheadBase64 ? `<div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;"><img src="${company.letterheadBase64}" style="max-height: 120px; max-width: 100%; object-fit: contain;"></div>` : ''}
      <h2 class="text-center font-bold text-xl mb-4 underline" style="text-align: center; font-weight: bold; font-size: 20px; margin-bottom: 16px; text-decoration: underline;">INVOICE</h2>
      
      <table class="w-full mb-4" style="width: 100%; margin-bottom: 16px; border: none;">
        <tr>
          <td class="w-1/2 align-top" style="vertical-align: top; width: 50%; border: none; padding: 2px;">
            <strong>From:</strong><br>
            <strong>${company.legalName}</strong><br>
            IEC NO: ${company.iec || '________________'}<br>
            GSTIN: ${company.gstin || '________________'}
          </td>
          <td class="w-1/2 align-top text-right" style="vertical-align: top; width: 50%; text-align: right; border: none; padding: 2px;">
            <strong>Invoice No:</strong> ${transaction.invoiceNumber}<br>
            <strong>Date:</strong> ${formatDate(transaction.invoiceDate || transaction.date)}<br>
            <strong>DELIVERY CHALLAN NO:</strong> ${transaction.dcNumber}<br>
            <strong>DC Date:</strong> ${formatDate(transaction.dcDate || transaction.date)}<br>
            <strong>USD EXCHANGE RATE:</strong> 1 USD = ${transaction.exchangeRate} INR
          </td>
        </tr>
        <tr>
          <td colspan="2" class="align-top" style="vertical-align: top; border: none; padding: 2px; padding-top: 15px;">
            <strong>CONSIGNEE:</strong><br>
            <strong>${party.name.toUpperCase()}</strong><br>
            GSTIN: ${party.gstin || '_____________________'}<br>
            <span>${party.address}, ${party.city}, ${party.state}</span>
          </td>
        </tr>
      </table>
      
      <table class="w-full mb-4" style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px;">SR.NO</th>
            <th style="border: 1px solid #000; padding: 4px;">DESCRIPTION</th>
            <th style="border: 1px solid #000; padding: 4px;">PACKING</th>
            <th style="border: 1px solid #000; padding: 4px;">UNIT</th>
            <th style="border: 1px solid #000; padding: 4px;">QTY</th>
            <th style="border: 1px solid #000; padding: 4px;">RATE USD</th>
            <th style="border: 1px solid #000; padding: 4px;">AMOUNT (USD)</th>
            <th style="border: 1px solid #000; padding: 4px;">AMOUNT (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #f9fafb;">
            <td colspan="4" class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">GRAND TOTAL</td>
            <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${totals.cases}</td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${totals.usd.toFixed(2)}</td>
            <td class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">${totals.assessable.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="8" style="border: 1px solid #000; padding: 4px;">
              <strong>Total Amount (USD) in Words:</strong> <span class="uppercase" style="text-transform: uppercase;">${numberToWords(totals.usd)} US DOLLARS ONLY</span><br>
              <strong>Total Amount (INR) in Words:</strong> <span class="uppercase" style="text-transform: uppercase;">${numberToWords(totals.assessable)} RUPEES ONLY</span>
            </td>
          </tr>
        </tfoot>
      </table>
      
      <div class="mb-4 text-xs" style="margin-bottom: 16px; font-size: 11px;">
        <strong>Narration:</strong> Being Bond Store items transferred Bond to Bond Vide GR No: ${transaction.grNumber} DtD: ${formatDate(transaction.date)}
      </div>
      
      <div class="flex justify-between mt-auto" style="display: flex; justify-content: space-between; margin-top: auto;">
        <div class="w-1/2 p-2" style="width: 50%; padding: 8px; border: 1px solid #000; font-size: 11px;">
          <strong>Company's Bank Details</strong><br>
          Bank Name : ${company.bankName || '________________'}<br>
          A/c Holder Name : ${company.legalName}<br>
          A/c No : ${company.bankAccount || '________________'}<br>
          Branch : ${company.bankBranch || '________________'}<br>
          IFSC: ${company.bankIfsc || '________________'}
        </div>
        <div class="w-1/2 text-right" style="width: 50%; text-align: right;">
          <p class="font-bold" style="font-weight: bold;">FOR ${company.legalName.toUpperCase()}</p>
          <p style="margin-top: 64px;">AUTHORISED SIGNATORY</p>
        </div>
      </div>
      <div class="mt-4 text-xs text-justify" style="margin-top: 16px; font-size: 10px; text-align: justify;">
        <strong>Declaration:</strong><br>
        In case of any discrepancy on above invoice amount please notify within 5 working days. If not, this invoice will be presumed to be in order. Payment Terms: Cash/Cheque on Delivery/Submission of Invoice.
      </div>
    </div>
  `;
}

function renderDeliveryChallan(transaction, company, party, items, totals) {
  const itemsRows = items.map((item, index) => `
    <tr>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.item}</td>
      <td style="border: 1px solid #000; padding: 4px;">${item.packing}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.unit || 'Cases'}</td>
      <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${item.qty}</td>
    </tr>
  `).join('');

  return `
    <div class="portrait-page letterhead-bg page-break" style="font-size: 13px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; min-height: 296mm; box-sizing: border-box; padding: 10mm 15mm; padding-top: ${company.letterheadBase64 ? '10mm' : '45mm'}; padding-bottom: 30mm;">
      ${company.letterheadBase64 ? `<div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;"><img src="${company.letterheadBase64}" style="max-height: 120px; max-width: 100%; object-fit: contain;"></div>` : ''}
      <h2 class="text-center font-bold text-xl mb-4 underline" style="text-align: center; font-weight: bold; font-size: 20px; margin-bottom: 16px; text-decoration: underline;">Delivery Challan</h2>
      
      <table class="w-full mb-4" style="width: 100%; margin-bottom: 16px; border: none;">
        <tr>
          <td class="w-1/2 align-top" style="vertical-align: top; width: 50%; border: none; padding: 2px;">
            <strong>From:</strong><br>
            <strong>${company.legalName}</strong><br>
            IEC NO: ${company.iec || '________________'}<br>
            GSTIN: ${company.gstin || '________________'}
          </td>
          <td class="w-1/2 align-top text-right" style="vertical-align: top; width: 50%; text-align: right; border: none; padding: 2px;">
            <strong>Invoice No:</strong> ${transaction.invoiceNumber}<br>
            <strong>Date:</strong> ${formatDate(transaction.invoiceDate || transaction.date)}<br>
            <strong>DELIVERY CHALLAN NO:</strong> ${transaction.dcNumber}<br>
            <strong>DC Date:</strong> ${formatDate(transaction.dcDate || transaction.date)}
          </td>
        </tr>
        <tr>
          <td colspan="2" class="align-top" style="vertical-align: top; border: none; padding: 2px; padding-top: 15px;">
            <strong>CONSIGNEE:</strong><br>
            <strong>${party.name.toUpperCase()}</strong><br>
            GSTIN: ${party.gstin || '_____________________'}<br>
            <span>${party.address}, ${party.city}, ${party.state}</span>
          </td>
        </tr>
      </table>
      
      <table class="w-full mb-8" style="border-collapse: collapse; width: 100%; margin-bottom: 32px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px;">SR.NO</th>
            <th style="border: 1px solid #000; padding: 4px;">DESCRIPTION</th>
            <th style="border: 1px solid #000; padding: 4px;">PACKING</th>
            <th style="border: 1px solid #000; padding: 4px;">UNIT</th>
            <th style="border: 1px solid #000; padding: 4px;">QTY</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #f9fafb;">
            <td colspan="4" class="text-right" style="text-align: right; border: 1px solid #000; padding: 4px;">TOTAL QTY</td>
            <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 4px;">${totals.cases} ${items[0]?.unit || 'Cases'}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="mb-4 text-xs" style="margin-bottom: 16px; font-size: 11px;">
        <strong>Narration:</strong> Being Bond Store items transferred Bond to Bond Vide GR No: ${transaction.grNumber} DtD: ${formatDate(transaction.date)}
      </div>

      <div class="flex justify-between mt-auto" style="display: flex; justify-content: space-between; margin-top: auto;">
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">FOR ${company.legalName.toUpperCase()}</p>
          <p>AUTHORISED SIGNATORY</p>
        </div>
        <div class="text-center" style="text-align: center;">
          <p style="margin-bottom: 64px;">_______________________</p>
          <p class="font-bold">M/S ${party.name.toUpperCase()}</p>
          <p>AUTHORISED SIGNATORY</p>
        </div>
      </div>
    </div>
  `;
}

function renderStockList(transaction, company, items) {
  const itemsRows = items.map((stock, index) => {
    // 1. Find if this stock is in the current GR transaction
    const grItem = transaction.items.find(gi => gi.stockItemId === stock.id);
    const grQty = grItem ? grItem.qty : 0;

    // 2. Calculate remaining stock quantity WITHOUT deducting this GR's quantity
    const remQty = stock.remainingQuantity + (transaction.status === 'generated' ? grQty : 0);

    // 3. Values and duties calculations
    // When bought initially:
    const initValueInr = stock.totalQuantity * stock.pricePerCaseUSD * transaction.exchangeRate;
    const initDutyInr = stock.totalQuantity * stock.pricePerCaseUSD * transaction.exchangeRate * (stock.dutyPercentage / 100);

    // Remaining (without current items deducted):
    const remValueInr = remQty * stock.pricePerCaseUSD * transaction.exchangeRate;
    const remDutyInr = remQty * stock.pricePerCaseUSD * transaction.exchangeRate * (stock.dutyPercentage / 100);

    return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px; font-weight: bold; font-size: 10px;">${stock.commodityName}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${stock.packing}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${stock.purchaseType} NO: ${stock.purchaseNumber}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${stock.purchaseDate ? formatDate(stock.purchaseDate) : 'N/A'}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${stock.bondNumber}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${stock.bondDate ? formatDate(stock.bondDate) : 'N/A'}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${stock.totalQuantity} ${stock.unit || 'Cases'}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">₹${initValueInr.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">₹${initDutyInr.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: #f8fafc;">${remQty} ${stock.unit || 'Cases'}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; background-color: #f8fafc;">₹${remValueInr.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; background-color: #f8fafc;">₹${remDutyInr.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="landscape-page page-break" style="font-size: 11px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; min-height: 200mm; box-sizing: border-box; padding: 10mm 15mm;">
      <h2 class="text-center font-bold text-xl mb-4 underline" style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 16px; text-decoration: underline;">STOCK SHEET / TOTAL STOCK INVENTORY</h2>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px;">
        <div>
          <p style="margin: 2px 0;"><strong>GR TRANSACTION REF:</strong> ${transaction.grNumber}</p>
          <p style="margin: 2px 0;"><strong>DATE:</strong> ${formatDate(transaction.date)}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 2px 0;"><strong>WAREHOUSE KEEPER:</strong> ${company.legalName}</p>
          <p style="margin: 2px 0;"><strong>EXCHANGE RATE:</strong> ₹ ${transaction.exchangeRate.toFixed(2)}</p>
        </div>
      </div>
      
      <table class="w-full mb-6" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 3%;">SR</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 15%;">COMMODITY</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 10%;">PACKING</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 11%;">BOUGHT VIA</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%;">BOUGHT DATE</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 10%;">BOND NO</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%;">BOND DATE</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%;">INIT QTY</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%;">INIT VALUE (INR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 9%;">INIT DUTY (INR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%; background-color: #f1f5f9;">REM QTY (PRE-GR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 8%; background-color: #f1f5f9;">REM VALUE (INR)</th>
            <th style="border: 1px solid #000; padding: 4px; font-size: 9px; width: 9%; background-color: #f1f5f9;">REM DUTY (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <div class="flex justify-between mt-auto" style="display: flex; justify-content: space-between; margin-top: auto; padding: 0 16px; font-size: 11px;">
        <div>
          <p>Prepared By</p>
          <p style="margin-top: 48px;">_________________</p>
        </div>
        <div>
          <p>Verified By</p>
          <p style="margin-top: 48px;">_________________</p>
        </div>
        <div class="text-right" style="text-align: right;">
          <p>FOR ${company.legalName.toUpperCase()}</p>
          <p style="margin-top: 48px;">Authorised Signatory</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Main function to render a document
 */
function renderDocument(documentType, transaction, company, party, items, totals) {
  const cssStyles = `
    <style>
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #000000; }
      .landscape-page {
        width: 297mm;
        min-height: 210mm;
        box-sizing: border-box;
        padding: 10mm 15mm;
        background: white;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .portrait-page {
        width: 210mm;
        min-height: 297mm;
        box-sizing: border-box;
        padding: 10mm 15mm;
        background: white;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .page-break { page-break-after: always; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; }
      th, td { border: 1px solid #000; padding: 6px; font-size: 11px; text-align: left; }
      th { font-weight: bold; text-align: center; background-color: #f3f4f6; }
      h1, h2, h3, h4, h5 { margin: 0; padding: 0; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-justify { text-align: justify; }
      .font-bold { font-weight: bold; }
      .underline { text-decoration: underline; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .w-full { width: 100%; }
      .w-1/2 { width: 50%; }
      .w-2/3 { width: 66.6%; }
      .mb-2 { margin-bottom: 8px; }
      .mb-4 { margin-bottom: 16px; }
      .mb-6 { margin-bottom: 24px; }
      .mb-8 { margin-bottom: 32px; }
      .mb-16 { margin-bottom: 64px; }
      .mt-2 { margin-top: 8px; }
      .mt-4 { margin-top: 16px; }
      .mt-24 { margin-top: 96px; }
      .mt-auto { margin-top: auto; }
      .p-2 { padding: 8px; }
      .text-xs { font-size: 11px; }
      .uppercase { text-transform: uppercase; }
      
      .letterhead-bg {
        /* Standard placeholder fallback style. Real letterhead image will be rendered here. */
        border-top: 8px solid #1e3a8a;
      }

      @media print {
        body { background: white; margin: 0; padding: 0; }
        .page-break { page-break-after: always; }
        @page { size: A4; margin: 0; }
      }
    </style>
  `;

  let content = '';

  switch (documentType) {
    case 'gr-front':
      content = renderGRFront(transaction, company, party, items, totals);
      break;
    case 'gr-back':
      content = renderGRBack(transaction, company, party);
      break;
    case 'duty-calculation':
      content = renderDutyCalculation(transaction, company, items, totals);
      break;
    case 'submission-letter':
      content = renderSubmissionLetter(transaction, company, party, items);
      break;
    case 'notesheet':
      content = renderNotesheet(transaction, company, party, items, totals);
      break;
    case 'invoice':
      content = renderInvoice(transaction, company, party, items, totals);
      break;
    case 'delivery-challan':
      content = renderDeliveryChallan(transaction, company, party, items, totals);
      break;
    case 'stock-list':
      content = renderStockList(transaction, company, items);
      break;
    default:
      content = `<h3>Invalid Document Type: ${documentType}</h3>`;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${documentType.toUpperCase()} - ${transaction.grNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
      ${cssStyles}
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

module.exports = {
  renderDocument
};
