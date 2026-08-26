// ─────────────────────────────────────────────────────────────────────────────
// GR Purchase Document Templates
// All 5 documents: Triple Duty Bond, Bond Submission Letter, Notesheet,
// Duty Calculation, Stocklist/Tally
// ─────────────────────────────────────────────────────────────────────────────

function fmt(dateVal) {
  if (!dateVal) return '______';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtLong(dateVal) {
  if (!dateVal) return '______';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

const numberToWords = (amount) => {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const numStr = num.toString();
  if (numStr.length > 9) return 'Amount Too Large';
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += (n[5] != 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
};

const pageStyle = `
  html, body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.6; margin: 0; padding: 0; background-color: #ffffff !important; color: #000000 !important; }
  .page { padding: 25mm 20mm; min-height: 277mm; box-sizing: border-box; page-break-after: always; background-color: #ffffff !important; color: #000000 !important; }
  .page:last-child { page-break-after: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; }
  .no-border td, .no-border th { border: none; padding: 2px 4px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .underline { text-decoration: underline; }
  h2 { text-align: center; font-size: 15px; font-weight: bold; text-decoration: underline; margin: 10px 0; }
  h3 { text-align: center; font-size: 13px; font-weight: bold; }
  p { margin: 6px 0; text-align: justify; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 60px; }
  .sig-block { text-align: center; min-width: 150px; }
  @media print { .page { page-break-after: always; } .page:last-child { page-break-after: auto; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRIPLE DUTY BOND (Section 59 of Customs Act 1962)
// ─────────────────────────────────────────────────────────────────────────────
function renderTripleDutyBond(tx, company, vendor, items) {
  const totalAssessable = items.reduce((s, i) => s + Number(i.assessableValueInr || 0), 0);
  const totalDuty       = items.reduce((s, i) => s + Number(i.dutyAmountInr || 0), 0);
  const tripleDuty      = Number(tx.bondValue || 0);

  const scheduleRows = items.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${item.commodityName}</td>
      <td class="center">${item.qty} ${item.unit || 'Cases'}</td>
      <td class="right">Rs. ${Number(item.assessableValueInr).toFixed(2)}</td>
      <td class="right">Rs. ${Number(item.dutyAmountInr).toFixed(2)}</td>
      <td class="right">Rs. ${(Number(item.dutyAmountInr) * 3).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>

    <div class="page">
      <h2>TRIPLE DUTY BOND</h2>
      <h3>BOND UNDER SECTION 59 OF CUSTOMS ACT 1962.</h3>
      <br>
      <p><b>BOND NO:</b> BOND-${tx.grPurchaseNumber} &nbsp;&nbsp; <b>DATE:</b> ${fmtLong(tx.date)} &nbsp;&nbsp; <b>At:</b> ${company.city || 'Gandhidham'}</p>
      <br>
      <p>
        <b>KNOWN ALL MEN BY THESE PRESIDENT THAT WE, M/s ${company.legalName}.</b><br>
        ${company.address}, ${company.city}, ${company.state || ''}, hereinafter called the obligors which Expression shall unless repugnant to or excluded
        by the context mean and include it successors, hereby bind ourselves and our heirs' executors,
        administrators, successors unto the President of India for the payment of <b>Rs. ${tripleDuty.toFixed(2)} (In words: RUPEES ${numberToWords(tripleDuty).toUpperCase()} ONLY.)</b>
        For which payment we bind ourselves, our heirs, executors' administrators and our legal representatives,
      </p>
      <br>
      <p><b>WHEREAS:</b></p>
      <p>
        1. The obligors have applied to the Asstt. Commissioner of Customs (Bond), at the Port of KANDLA hereinafter called the said authority for permission to enter into a bond for the purpose of sub section (1) of section 59 of Customs Act, (52 of 1962) referred to as the said Act in respect of the warehousing of the imported goods by them from time to time.
      </p>
      <p>
        2. The Said authority has given, under section 59 Of the said Act permission in respect of the goods to be imported by the obligors hereinafter referred to as the permitted shipment.
      </p>
      <br>
      <p><b>NOW THE CONDITION OF THE ABOVE WRITTEN BOND IS SUCH THAT:</b></p>
      <p>
        1. If the said obligors shall within three months the date of arrival of the shipment of goods intended to be warehoused given notice in writing to the officer of Customs stating all particulars of the goods.
      </p>
      <p>
        2. And if the obligors shall observe in relation of goods,<br>
        &nbsp;&nbsp;&nbsp;a) Which the obligors may import.<br>
        &nbsp;&nbsp;&nbsp;b) Which the obligors may be permitted to deposit in the said warehouse under section 60 of the said Act (hereinafter called the said goods) all the provisions of the said Act and rules and regulation and by persons obtaining permissions to warehouse goods in respect of such goods.
      </p>
      <p>3. Goods will be cleared within one year from the arrival of the goods in the bonded warehouse.</p>
      <p>4. If there is any shortage at the time clearance, we undertake to pay necessary duties and penalty.</p>
      <p>
        5. And if the obligors shall on or before the date or dates specified in notice or notices of demand (as the case may be) pay to the proper officer of the Customs port at Kandla all duties rent and charges claimable on the said goods together with interest on the same from the date or dates so specified in the said notice or notices of demand at the rate of 20% per annum or at such other rate basis for the being fixed by the Central Board of Revenue Act 1963.
      </p>
      <p class="center" style="margin-top:20px;"><b>Page 1 of 2</b></p>
    </div>

    <div class="page">
      <p>
        6. And if the obligors shall discharge all penalties imposed of violation of the said Act and the rules and regulation in respect of the provision of the above said goods, the written bond shall be void; otherwise, the same shall remain in full force and virtue.
      </p>
      <br>
      <p><b>IT IS AGREED AND DECLARED BY THESE OBLIGORS AS FOLLOWS: -</b></p>
      <p>
        (A) Any amount due under bond may be recovered in the manner laid down sub section (1) of section 142 of the said Act without prejudice to any other recovery.
      </p>
      <br>
      <p class="underline bold center">The Schedule of the above referred to (Particular of the Goods)</p>
      <br>
      <p><b>GR NO:</b> ${tx.grPurchaseNumber} &nbsp;&nbsp; <b>DATED:</b> ${fmt(tx.date)}</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center">SR NO</th>
            <th>COMMODITY</th>
            <th class="center">TOTAL QTY</th>
            <th class="right">TOTAL ASS.VALUE (INR)</th>
            <th class="right">TOTAL DUTY (INR)</th>
            <th class="right">TOTAL TRIPLE DUTY (INR)</th>
          </tr>
        </thead>
        <tbody>${scheduleRows}</tbody>
        <tfoot>
          <tr class="bold">
            <td class="center" colspan="2">TOTAL</td>
            <td class="center">${items.reduce((s, i) => s + i.qty, 0)} ${items[0]?.unit || 'Cases'}</td>
            <td class="right">Rs. ${totalAssessable.toFixed(2)}</td>
            <td class="right">Rs. ${totalDuty.toFixed(2)}</td>
            <td class="right">Rs. ${tripleDuty.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <br>
      <p>This day is ${fmtLong(tx.date)}</p>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:30px;">
        <div>
          <b>WITNESS</b><br><br>
          Signatory<br><br><br>
          1. ___________________________<br><br>
          2. ___________________________
        </div>
        <div style="text-align:right;">
          <b>For ${company.legalName}</b><br><br><br><br>
          ___________________________<br>
          <b>Authorized Signatory</b>
        </div>
      </div>
      <br>
      <p>Accepted for and on behalf of<br>The President of India.</p>
      <br>
      <p>Asstt / DC. Commissioner of Customs<br>Customs House Kandla.</p>
      <br>
      <p class="center"><b>Page 2 of 2</b></p>
    </div>

    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOND SUBMISSION LETTER
// ─────────────────────────────────────────────────────────────────────────────
function renderBondSubmissionLetter(tx, company, vendor, items) {
  const totalAssessable = items.reduce((s, i) => s + Number(i.assessableValueInr || 0), 0);
  const totalDuty       = items.reduce((s, i) => s + Number(i.dutyAmountInr || 0), 0);
  const tripleDuty      = Number(tx.bondValue || 0);

  const commodityList = items.map(i => i.commodityName).join(', ');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-family: 'Times New Roman', serif;">

      ${company.letterheadBase64
        ? `<div style="text-align:center; margin-bottom:20px; border-bottom: 2px solid #1e3a8a; padding-bottom:10px;"><img src="${company.letterheadBase64}" style="max-height:120px; max-width:100%; object-fit:contain;"></div>`
        : `<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
             <div style="font-size:18px; font-weight:bold;">${company.legalName}</div>
             <div style="font-size:12px;">${company.address}, ${company.city}</div>
             <div style="font-size:11px;">Warehouse Code: ${company.warehouseCode || '_________'}</div>
           </div>`}

      <p style="text-align:right;"><b>Date:</b> ${fmtLong(tx.date)}</p>
      <br>
      <p>To</p>
      <p>The Asst. Commissioner of Customs,<br>Bond Section,<br>Custom House - Kandla</p>
      <br>
      <p><b>Respected Sir,</b></p>
      <br>
      <p><b>Sub:</b> Submitted Consignment warehousing bond Under Section 59, Customs Act, of 1962</p>
      <p><b>Ref:</b> M/s ${company.legalName}, ( Customs Special Bonded Warehouse No.: <b>${company.warehouseCode || '_________'}</b> ) ${company.city}, Vide GR NO: <b>${tx.grPurchaseNumber}</b> DTD: <b>${fmt(tx.date)}</b></p>
      <br>
      <p>
        With ref. To the above subject we would like to inform you that, we are likely to receive 
        <b>${commodityList}</b> from <b>M/s ${vendor.name}</b>, ${vendor.city} 
        Vide GR NO: <b>${tx.grPurchaseNumber}</b> DTD: <b>${fmt(tx.date)}</b> 
        to our bonded warehouse under section 67 of customs Act of 1962.
        We are submitting the following documents for acceptance of warehousing triple duty bond.
        All relevant documents as mentioned:
      </p>
      <br>
      <p style="margin-left:20px;"><b>1.</b> GR NO: <b>${tx.grPurchaseNumber}</b> DTD: <b>${fmt(tx.date)}</b></p>
      <p style="margin-left:20px;">
        <b>2.</b> Triple Duty / Consignment warehousing bond under section 59 of Customs Act, 1962.<br>
        &nbsp;&nbsp;&nbsp;&nbsp;Total Assessable value of Rs. <b>${totalAssessable.toFixed(2)}/-</b> ,
        Duty Value of Rs. <b>${totalDuty.toFixed(2)}</b> ,
        Triple duty bond value of Rs. <b>${tripleDuty.toFixed(2)}/-</b>
      </p>
      <p style="margin-left:60px;">a. Duty of existing Stock: Rs. ____________</p>
      <p style="margin-left:60px;">b. Add this consignment: Rs. <b>${totalDuty.toFixed(2)}</b></p>
      <p style="margin-left:60px;">c. Total: Rs. ____________</p>
      <p style="margin-left:60px;">d. Total Bank Guarantee: Rs. <b>${company.bgAmount ? Number(company.bgAmount).toLocaleString('en-IN') : '50,00,000'}</b></p>
      ${company.bgNumber ? `<p style="margin-left:60px;">${company.bgBankName || 'Bank'} BG No.: <b>${company.bgNumber}</b> - Rs. ${company.bgAmount ? Number(company.bgAmount).toLocaleString('en-IN') : '50,00,000'}/-</p>` : ''}
      <br>
      <p>
        Kindly accept the triple duty bond and grant us necessary permission for warehousing our bonded goods.
        Depute preventive officer for warehousing formalities at our warehouse.
      </p>
      <p>Please do the needful and oblige</p>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:30px;">
        <div>
          <p>Thanking you</p>
          <p>Yours faithfully</p>
          <br><br>
          <p><b>For ${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
        <div style="text-align:right; padding-top:30px;">
          <p>P.O. ( BOND ) Sh __________________</p>
          <br>
          <p>Please Attend</p>
          <br><br>
          <p>( Supdt. Bond)</p>
        </div>
      </div>

    </div>
    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NOTESHEET (GR Purchase)
// ─────────────────────────────────────────────────────────────────────────────
function renderNotesheet(tx, company, vendor, items) {
  const totalDuty = items.reduce((s, i) => s + Number(i.dutyAmountInr || 0), 0);

  const itemsRows = items.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${item.commodityName}</td>
      <td class="center">${item.qty} ${item.unit || 'Cases'}</td>
      <td>
        GR NO: ${tx.grPurchaseNumber} DT: ${fmt(tx.date)}<br>
        BOND NO: BOND-${tx.grPurchaseNumber} DT: ${fmt(tx.date)}
      </td>
      <td class="center">______</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page">
      <p><b>Submitted Please: -</b></p>
      <p>
        Kindly Pursue GR Purchase No. - <b>${tx.grPurchaseNumber}</b> Dated: <b>${fmt(tx.date)}</b> for warehousing of goods received from
        M/s. <b>${vendor.name}</b>, ${vendor.city}.
      </p>
      <p>
        They have filed a GR Purchase for warehousing goods at our bonded warehouse: <b>${company.legalName}</b>, ${company.city.toUpperCase()}.
      </p>
      <br>
      <p class="underline bold">DETAILS:</p>
      <table class="no-border" style="width:60%; margin-bottom:16px;">
        <tr>
          <td>PRESENT DUTY BALANCE:</td>
          <td class="bold">₹ ____________ /-</td>
        </tr>
        <tr>
          <td>PRESENT GR PURCHASE DUTY AMOUNT:</td>
          <td class="bold">₹ ${totalDuty.toFixed(2)} /-</td>
        </tr>
        <tr>
          <td>BALANCE DUTY AMOUNT:</td>
          <td class="bold">₹ ____________ /-</td>
        </tr>
      </table>
      <p>GR Purchase No. <b>${tx.grPurchaseNumber}</b> Dated: <b>${fmt(tx.date)}</b> is put up for perusal, approval and Signature Please.</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:5%;">SR NO</th>
            <th style="width:30%;">DESCRIPTION</th>
            <th class="center" style="width:12%;">QUANTITY</th>
            <th style="width:35%;">GOODS RECEIVED BOND NO</th>
            <th class="center" style="width:18%;">BOND BALANCE</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:60px; padding:0 30px;">
        <div class="center">(P.O Bond)</div>
        <div class="center">(Supdt Bond)</div>
        <div class="center">DC / AC (Bond)</div>
      </div>
    </div>
    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DUTY CALCULATION SHEET
// ─────────────────────────────────────────────────────────────────────────────
function renderDutyCalculation(tx, company, vendor, items) {
  const exchangeRate = tx.exchangeRate || 84.50;
  const totalUSD        = items.reduce((s, i) => s + Number(i.usdValue || 0), 0);
  const totalAssessable = items.reduce((s, i) => s + Number(i.assessableValueInr || 0), 0);
  const totalDuty       = items.reduce((s, i) => s + Number(i.dutyAmountInr || 0), 0);

  const rows = items.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${item.commodityName}</td>
      <td class="center">${item.qty} ${item.unit || 'Case'}</td>
      <td class="center">${item.packing || '___________'}</td>
      <td class="right">${Number(item.usdValue).toFixed(2)}</td>
      <td class="right">${Number(item.assessableValueInr).toFixed(2)}</td>
      <td class="center">${item.dutyPercentage}%</td>
      <td class="right">${Number(item.dutyAmountInr).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page">
      <h2>DUTY CALCULATION</h2>
      <p class="center">FOR GR PURCHASE NO: <b>${tx.grPurchaseNumber}</b> &nbsp;&nbsp; (EX: 1 USD = ${exchangeRate})</p>
      <br>
      <p><b>GR Purchase No:</b> ${tx.grPurchaseNumber} &nbsp;&nbsp; <b>Date:</b> ${fmt(tx.date)} &nbsp;&nbsp; <b>Vendor:</b> M/s ${vendor.name}, ${vendor.city}</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:4%;">SR.NO</th>
            <th style="width:24%;">ITEM</th>
            <th class="center" style="width:10%;">QTY IN CASE</th>
            <th class="center" style="width:14%;">PACKING</th>
            <th class="right" style="width:12%;">VALUE IN USD</th>
            <th class="right" style="width:16%;">ASSESSABLE VALUE (INR)</th>
            <th class="center" style="width:8%;">DUTY %</th>
            <th class="right" style="width:12%;">DUTY VALUE (INR)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold" style="background:#f9fafb;">
            <td colspan="4" class="center">TOTAL</td>
            <td class="right">${totalUSD.toFixed(2)}</td>
            <td class="right">${totalAssessable.toFixed(2)}</td>
            <td></td>
            <td class="right">${totalDuty.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="8">
              <b>Duty Value in Words:</b> RUPEES ${numberToWords(totalDuty).toUpperCase()} ONLY
            </td>
          </tr>
          <tr>
            <td colspan="8">
              <b>Triple Duty Bond Value:</b> Rs. ${Number(tx.bondValue || 0).toFixed(2)} &nbsp; (RUPEES ${numberToWords(Number(tx.bondValue || 0)).toUpperCase()} ONLY)
            </td>
          </tr>
        </tfoot>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div>
          <p><b>For ${vendor.name}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
        <div style="text-align:right;">
          <p><b>For ${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INBOUND STOCKLIST / TALLY
// ─────────────────────────────────────────────────────────────────────────────
function renderStocklist(tx, company, vendor, items) {
  const rows = items.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${item.commodityName}</td>
      <td class="center">${item.qty}</td>
      <td class="center">${item.unit || 'Cases'}</td>
      <td>${item.packing || '___________'}</td>
      <td class="center">______</td>
    </tr>
  `).join('');

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page">
      <h2>INBOUND TALLY / STOCKLIST</h2>
      <p class="center">GR Purchase No: <b>${tx.grPurchaseNumber}</b> &nbsp;&nbsp; Date: <b>${fmt(tx.date)}</b></p>
      <br>
      <table class="no-border" style="margin-bottom:15px;">
        <tr>
          <td><b>Vendor (From):</b> M/s ${vendor.name}, ${vendor.city}</td>
          <td class="right"><b>Warehouse:</b> ${company.legalName}</td>
        </tr>
        <tr>
          <td><b>Warehouse Code:</b> ${company.warehouseCode || '_________'}</td>
          <td class="right"><b>Date of Receipt:</b> ${fmt(tx.date)}</td>
        </tr>
      </table>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:5%;">SR NO</th>
            <th style="width:35%;">COMMODITY NAME</th>
            <th class="center" style="width:10%;">QUANTITY</th>
            <th class="center" style="width:10%;">UNIT</th>
            <th style="width:20%;">PACKING</th>
            <th class="center" style="width:20%;">REMARK / CONDITION</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold">
            <td colspan="2" class="center">TOTAL</td>
            <td class="center">${totalQty}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:50px;">
        <div>
          <p>Received in Good Condition</p>
          <br><br>
          <p>Signature: _______________</p>
          <p>(Warehouse Keeper)</p>
        </div>
        <div style="text-align:center;">
          <p>Preventive Officer</p>
          <br><br>
          <p>Signature: _______________</p>
          <p>(Customs P.O.)</p>
        </div>
        <div style="text-align:right;">
          <p><b>For ${company.legalName}</b></p>
          <br><br>
          <p>Signature: _______________</p>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

// Keep old renderWarehousingBond as alias for backward compatibility
function renderWarehousingBond(tx, company, vendor, items) {
  return renderTripleDutyBond(tx, company, vendor, items);
}

function renderSpaceCertificate(tx, company, vendor, items) {
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page">
      <h2>SPACE AVAILABILITY CERTIFICATE</h2>
      <br>
      <p style="text-align:right;"><b>Date:</b> ${fmtLong(tx.date)}</p>
      <br>
      <p>To,<br>The Assistant Commissioner of Customs,<br>Custom House, ${company.city || 'Kandla'}</p>
      <br>
      <p><b>Sub: Space Availability for Warehousing of Goods</b></p>
      <br>
      <p>Dear Sir,</p>
      <p>
        This is to certify that we have sufficient space in our bonded warehouse
        (Warehouse Code: <b>${company.warehouseCode || '_________'}</b>)
        to accommodate the incoming goods from <b>M/s ${vendor.name}</b>
        against GR Purchase No. <b>${tx.grPurchaseNumber}</b> dated <b>${fmt(tx.date)}</b>.
      </p>
      <p>Total Quantity: <b>${totalQty} ${items[0]?.unit || 'Cases'}</b></p>
      <p>We request you to kindly permit the warehousing of these goods.</p>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:60px;">
        <div>
          <p>Yours faithfully,</p>
          <br><br>
          <p><b>For ${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
        <div style="text-align:right; padding-top:30px;">
          <p>P.O. ( BOND ) Sh. _______________</p>
          <br>
          <p>Please Attend</p>
          <br><br>
          <p>( Supdt. Bond)</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

function renderCoveringLetter(tx, company, vendor, items) {
  return renderBondSubmissionLetter(tx, company, vendor, items);
}

module.exports = {
  renderTripleDutyBond,
  renderBondSubmissionLetter,
  renderNotesheet,
  renderDutyCalculation,
  renderStocklist,
  // aliases for backward compat
  renderWarehousingBond,
  renderSpaceCertificate,
  renderCoveringLetter,
};
