// ─────────────────────────────────────────────────────────────────────────────
// Shipping Bill (Pink SB) Document Templates
// Documents: SB (4 copies: front+back each), Notesheet, Duty Calculation,
//            Export Invoice, Delivery Challan, Packing List
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
  html, body { font-family: 'Times New Roman', serif; font-size: 11px; line-height: 1.4; margin: 0; padding: 0; background-color: #fce7f3 !important; color: #000000 !important; }
  .page { padding: 10mm 12mm; box-sizing: border-box; page-break-after: always; min-height: 277mm; background-color: #fbcfe8 !important; color: #000000 !important; border: 1px solid #f472b6; margin: 10px auto; max-width: 210mm; }
  .page:last-child { page-break-after: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; font-size: 11px; }
  .no-border td, .no-border th { border: none; padding: 2px 4px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  h2 { text-align: center; font-size: 13px; font-weight: bold; margin: 4px 0; text-transform: uppercase; }
  @media print { html, body, .page { background-color: #ffffff !important; border: none; margin: 0; width: 100%; } .page { page-break-after: always; } .page:last-child { page-break-after: auto; } }
`;

// ─────────────────────────────────────────────────────────────────────────────
// PINK SHIPPING BILL — FRONT PAGE
// ─────────────────────────────────────────────────────────────────────────────
function renderSBFront(tx, company, consignee, items, copyLabel) {
  const totalFOBUSD = items.reduce((s, i) => s + Number(i.fobValue || 0), 0);
  const exchangeRate = tx.exchangeRate || 97.20;
  const totalFOBINR  = totalFOBUSD * exchangeRate;
  const totalQty     = items.reduce((s, i) => s + Number(i.exportQty || 0), 0);

  const itemRows = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.hsn || '22030000'}</td>
        <td>${si.commodityName || ''}</td>
        <td>${si.packing || '24X330CL'}</td>
        <td class="center">${item.exportQty} ${si.unit || 'CASE'}</td>
        <td class="right">${Number(item.fobValue).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Import particulars from linked stock items (bondNumber, beDetails)
  const bondParticulars = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td>${si.beDetails || '________'}</td>
        <td>${tx.vesselName || 'BY SEA'} / ${tx.rotationNo || 'N.A.'}</td>
        <td class="center">${item.exportQty} ${si.unit || 'CASE'}</td>
        <td>${si.bondNumber || '________'}<br>${si.bondDate ? 'DT:' + fmt(si.bondDate) : ''}</td>
        <td>${company.legalName}<br>(CUSTOM SPECIAL BONDED WAREHOUSE)</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="page">
      <!-- HEADER -->
      <h2>SHIPPING FOR EXPORT OF DUTY FREE GOODS EX -BOND</h2>
      <div style="text-align:right; font-size:12px; font-weight:bold; border:1px solid #000; display:inline-block; padding:2px 8px; float:right; margin-top:-5px;">${copyLabel}</div>
      <div style="clear:both;"></div>
      <br>

      <!-- TOP SECTION -->
      <table style="margin-bottom:0;">
        <tr>
          <!-- LEFT: Exporter block -->
          <td style="width:45%; vertical-align:top;">
            <div style="font-size:10px;">Exporter, whether Government or Special</div>
            <div class="bold">${company.legalName}</div>
            <div style="font-size:10px;">(Customs Special Bonded Warehouse)</div>
            <div style="font-size:10px;">${company.address}, ${company.city}</div>
          </td>
          <!-- RIGHT: Invoice, Date, AT4/AR4 -->
          <td style="width:30%; vertical-align:top;">
            <table class="no-border">
              <tr>
                <td style="font-size:10px;">Invoice No. &amp; Date</td>
              </tr>
              <tr>
                <td class="bold">${tx.invoiceNumber || 'N.A.'} &nbsp;&nbsp; ${fmt(tx.date)}</td>
              </tr>
              <tr>
                <td style="font-size:10px; padding-top:5px;">AR4/AR4A No. &amp; Date</td>
              </tr>
              <tr>
                <td>${tx.ar4Number || 'N.A.'}</td>
              </tr>
              <tr>
                <td style="font-size:10px; padding-top:5px;">Q/Certi No. &amp; Date</td>
              </tr>
              <tr>
                <td>${tx.qCertNumber || 'N.A.'}</td>
              </tr>
            </table>
          </td>
          <!-- FAR RIGHT: SB No & Date, IEC, BIN -->
          <td style="width:25%; vertical-align:top; border-left:1px solid #000; padding-left:5px;">
            <div style="font-size:10px;">SB No. &amp; Date: F/B:</div>
            <div class="bold" style="font-size:11px; margin-bottom: 4px;">SB No. _________________</div>
            <div class="bold" style="font-size:11px;">DATE: ${fmt(tx.date)}</div>
            <br>
            <div style="font-size:10px;">Import Export Code No. &amp; BIN</div>
            <div class="bold">${company.iec || '________________'}</div>
            <div class="bold">${company.gstin || '________________'}</div>
            <br>
            <div style="font-size:10px;">State Origin of Goods<br><b>IMPORT BONDED GOODS</b></div>
          </td>
        </tr>
      </table>

      <!-- CONSIGNEE + BONDED SHIP STORES -->
      <table style="margin-bottom:0;">
        <tr>
          <td style="width:45%;">
            <div style="font-size:10px;">Consignee</div>
            <div class="bold">THE MASTER OF,<br>${consignee.name}</div>
            <div style="font-size:10px;">${consignee.address || 'AT ' + (tx.portOfLoading || 'Dahej Port')}</div>
          </td>
          <td style="width:30%;">
            <div style="font-size:10px;">Export Trade Control</div>
            <table class="no-border" style="font-size:10px;">
              <tr><td>If Export Under:</td></tr>
              <tr><td>Differed Credit { }</td></tr>
              <tr><td>Joint Ventures { }</td></tr>
              <tr><td>Rupees Credit { }Other { }</td></tr>
              <tr><td>RBI's Approval/Cir No.&amp;Date</td></tr>
            </table>
          </td>
          <td style="width:25%;">
            <div style="font-size:10px;">Bonded Ship Stores</div>
            <div class="bold">Supply to the<br>Vessel On Board</div>
            <div style="font-size:10px; margin-top:5px;">Type of Shipment<br>Out Right Sale { }<br>Consignee Export { }<br>Others { }<br>(Specify)</div>
          </td>
        </tr>
      </table>

      <!-- CUSTOMS / VESSEL / PORT ROW -->
      <table style="margin-bottom:0;">
        <tr>
          <td style="width:30%;">
            <div style="font-size:10px;">Custom House Agent</div>
            <div class="bold">SELF</div>
            <div class="bold">${company.legalName}</div>
            <div style="font-size:10px;">${company.warehouseCode || 'SPECIAL/02/2025/26'}</div>
          </td>
          <td style="width:20%;">
            <table class="no-border" style="font-size:10px;">
              <tr><td>Pre Carriage By</td><td>Place of Receipt by pre carrier</td></tr>
              <tr><td class="bold">Vessel/Flight No.</td><td>Rotation No.</td></tr>
              <tr><td class="bold">${tx.vesselName || 'MT SOYO'}</td><td>${tx.rotationNo || '______'}</td></tr>
            </table>
          </td>
          <td style="width:30%;">
            <div style="font-size:10px;">Port of Loading</div>
            <div class="bold">${tx.portOfLoading || 'AT Dahej Port'}</div>
            <div style="font-size:10px;">Nature of Contract: CIF { } CFR { } FOB { }<br>Other (Specify)</div>
          </td>
          <td style="width:20%;">
            <div class="bold" style="font-size:12px; border:1px solid #000; padding:3px; text-align:center;">F.O.B</div>
          </td>
        </tr>
        <tr>
          <td style="font-size:10px;">Port of Discharge<br><b>SHIPSTORES NOT TO BE LANDED</b></td>
          <td colspan="2">
            <div style="font-size:10px;">Country of Destination</div>
            <div style="font-size:10px;">Exchange Rate US$ 1 of CA<br>INR &nbsp;<b>${exchangeRate}</b></div>
          </td>
          <td style="font-size:10px;">Currency of Invoice</td>
        </tr>
      </table>

      <!-- ITEMS TABLE -->
      <table style="margin-bottom:0;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th rowspan="2" class="center" style="width:3%;">Sr</th>
            <th rowspan="2" class="center" style="width:8%;">Marks &amp; No.</th>
            <th rowspan="2" style="width:14%;">No. &amp; Kind Of Pkgs Container No.</th>
            <th rowspan="2" style="width:12%;">Statistical Code / Description of Goods and EXIM codes where applicable</th>
            <th rowspan="2" style="width:25%;">Description of Goods / HSN CODE</th>
            <th rowspan="2" class="center" style="width:10%;">Quantity<br>Ltrs/Kgs</th>
            <th colspan="2" class="center">Value</th>
          </tr>
          <tr style="background:#f3f4f6;">
            <th class="right" style="width:10%;">FOB<br>US $</th>
            <th class="right" style="width:10%;">PMV<br>Where Applicable</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="right bold">Total</td>
            <td class="center bold">${totalQty} CASE</td>
            <td class="right bold">${totalFOBUSD.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <!-- SIGNATURE ROW -->
      <table style="margin-bottom:0; font-size:10px;">
        <tr>
          <td style="width:30%; border:none;">P.O SHRI ___________<br>PLS ATTEND,</td>
          <td style="width:70%; border:none;">&nbsp;</td>
        </tr>
      </table>

      <!-- FOB ANALYSIS -->
      <table style="font-size:10px;">
        <tr>
          <td style="width:20%;">Net Weight: ______</td>
          <td style="width:40%;">
            P.O (B) &nbsp;&nbsp; SUP. (B) &nbsp;&nbsp; A.C.(B)
          </td>
          <td style="width:20%;" class="right bold">USD $${totalFOBUSD.toFixed(2)}</td>
          <td style="width:20%;" class="right bold">INR ${totalFOBINR.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Gross Weight: ______</td>
          <td colspan="3" class="center bold">
            Total FOB Value in words: USD ${numberToWords(totalFOBUSD).toUpperCase()} ONLY
          </td>
        </tr>
      </table>

      <!-- ANALYSIS OF EXPORT VALUE -->
      <table style="font-size:10px;">
        <tr>
          <td colspan="3" class="bold">Analysis of Export Value</td>
          <td class="bold">Currency</td>
          <td class="bold">Amount</td>
          <td colspan="2" style="font-size:9px;">Full export value Or here not ascertainable, the value which exporter expects to receive on the sale of the goods</td>
        </tr>
        <tr>
          <td colspan="3">FOB Value</td>
          <td>US $</td>
          <td class="right">$${totalFOBUSD.toFixed(2)}</td>
          <td>Currency</td>
          <td>US $</td>
        </tr>
        <tr>
          <td colspan="3">Freight</td>
          <td></td><td></td>
          <td>Amount</td>
          <td class="right">${totalFOBUSD.toFixed(2)}</td>
        </tr>
        <tr><td colspan="3">Insurance</td><td></td><td></td><td></td><td></td></tr>
        <tr><td colspan="3">Commission</td><td></td><td></td><td></td><td></td></tr>
        <tr><td colspan="3">Discount</td><td></td><td></td><td></td><td></td></tr>
        <tr><td colspan="3">Other Deductions</td><td></td><td></td><td></td><td></td></tr>
      </table>

      <!-- IMPORT PARTICULARS OF BONDED GOODS -->
      <table style="font-size:10px;">
        <thead>
          <tr>
            <th colspan="5" class="center bold" style="background:#f3f4f6;">Import Particulars of Bonded goods:</th>
          </tr>
          <tr style="background:#f3f4f6;">
            <th>Bill of Entry No. &amp; Date</th>
            <th>Vessel Name and Rotation No.</th>
            <th>No. of Pkgs.</th>
            <th>Bond No. &amp; Date</th>
            <th>Name of Bonded Warehouse</th>
          </tr>
        </thead>
        <tbody>${bondParticulars}</tbody>
      </table>

      <!-- DECLARATION -->
      <table style="margin-top:5px; font-size:10px;">
        <tr>
          <td style="width:60%; border:none;">
            <b>Declaration:</b><br>
            I/We declare that all particulars given herein are true and correct<br>
            I/We also attach the declaration(s) under clause No.(s) ________<br>
            Public notice No. ______________ Dated ____________
          </td>
          <td style="width:40%; text-align:right; border:none;">
            For &nbsp;&nbsp; <b>${company.legalName}</b>
            <br><br><br>
            <b>AUTHORISED SIGNATORY</b>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PINK SHIPPING BILL — BACK PAGE
// ─────────────────────────────────────────────────────────────────────────────
function renderSBBack(tx, company, consignee, copyLabel) {
  return `
    <div class="page">
      <h2>SHIPPING BILL FOR EXPORT OF DUTY FREE GOODS EX-BOND</h2>
      <div style="text-align:right; font-weight:bold; font-size:12px;">${copyLabel}</div>
      <br>
      <table class="no-border" style="width:100%;">
        <tr>
          <td style="width:60%; border:none;">&nbsp;</td>
          <td style="width:40%; border:none; vertical-align:top;">
            <b>Documents Submitted</b><br><br>
            1. Invoice &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            2. Packing list &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            3. G.R. Form &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            4. AR4/AR4A form &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            5. ETC License &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            6. Indent &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            7. Acceptance of Contract &nbsp;&nbsp; { }<br>
            8. Letter of Credit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            9. QC Certificate &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            10. Port Trust Document &nbsp;&nbsp;&nbsp;&nbsp; { }<br>
            11. Any Other (Specify &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; { }
          </td>
        </tr>
      </table>
      <br><br><br><br><br><br><br><br><br><br>
      <p>Excorted &amp; Delivered Bonded Goods to the Vessel</p>
      <br>
      <p>On board as on Dt: _______ / _______ / _____________</p>
      <br>
      <p>Vide Shipping Bill No: _______________</p>
      <br>
      <p>Dt: _____ / _____ / _______</p>
      <br><br>
      <table class="no-border" style="margin-top:20px;">
        <tr>
          <td style="width:50%; border:none;">
            <b>Signature</b><br>
            <b>P.O.</b><br><br><br>
            <b>KANDLA</b>
          </td>
          <td style="width:50%; border:none; text-align:right;">
            <b>&nbsp;</b><br>
            <b>P.O.</b><br><br><br>
            <b>KANDLA</b>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PINK SHIPPING BILL — 4 copies (Front + Back each)
// ─────────────────────────────────────────────────────────────────────────────
function renderPinkShippingBill(tx, company, consignee, items, copyType = 'CUSTOMS COPY') {
  const copies = [
    { label: 'ORIGINAL', key: 'ORIGINAL' },
    { label: 'DUPLICATE', key: 'DUPLICATE' },
    { label: 'TRIPLICATE', key: 'TRIPLICATE' },
    { label: 'EXTRA COPY', key: 'EXTRA COPY' },
  ];

  // If a specific copy type is requested, just render that one
  let targetCopies = copies;
  if (copyType && !['ALL', 'FULL'].includes(copyType)) {
    const match = copies.find(c => copyType.toUpperCase().includes(c.key));
    if (match) targetCopies = [match];
  }

  const pages = targetCopies.map(copy =>
    renderSBFront(tx, company, consignee, items, copy.label) +
    renderSBBack(tx, company, consignee, copy.label)
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>${pages}</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTESHEET (SB)
// ─────────────────────────────────────────────────────────────────────────────
function renderSBNotesheet(tx, company, consignee, items) {
  const totalFOB = items.reduce((s, i) => s + Number(i.fobValue || 0), 0);
  const exchangeRate = tx.exchangeRate || 93.45;

  const itemRows = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.commodityName || ''}</td>
        <td class="center">${item.exportQty} ${si.unit || 'CASE'}</td>
        <td>${si.beDetails || '________'}<br>${si.bondNumber ? 'BOND NO: ' + si.bondNumber : ''}</td>
        <td class="center">${si.remainingQuantity || '______'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-size:12px;">
      <p><b>Submitted Please: -</b></p>
      <p>
        Kindly Pursue Shipping Bill No. - <b>${tx.sbNumber}</b> Dated: <b>${fmt(tx.date)}</b> for export of bonded goods to
        <b>THE MASTER OF, ${consignee.name}</b> via vessel <b>${tx.vesselName || '________'}</b>,
        Rotation No. <b>${tx.rotationNo || '________'}</b>.
      </p>
      <p>
        Exporter: <b>${company.legalName}</b>, ${company.city} &nbsp;|&nbsp;
        Port of Loading: <b>${tx.portOfLoading || 'Kandla'}</b> &nbsp;|&nbsp;
        Invoice No.: <b>${tx.invoiceNumber || tx.sbNumber}</b>
      </p>
      <br>
      <p class="bold" style="text-decoration:underline;">DETAILS:</p>
      <table class="no-border" style="width:60%; margin-bottom:16px; font-size:12px;">
        <tr>
          <td>TOTAL FOB VALUE (USD):</td>
          <td class="bold">USD ${totalFOB.toFixed(2)} /-</td>
        </tr>
        <tr>
          <td>EXCHANGE RATE:</td>
          <td class="bold">1 USD = INR ${exchangeRate}</td>
        </tr>
        <tr>
          <td>TOTAL FOB VALUE (INR):</td>
          <td class="bold">INR ${(totalFOB * exchangeRate).toFixed(2)} /-</td>
        </tr>
      </table>
      <p>Shipping Bill No. <b>${tx.sbNumber}</b> Dated: <b>${fmt(tx.date)}</b> is put up for perusal, approval and Signature Please.</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:5%;">SR NO</th>
            <th style="width:30%;">DESCRIPTION</th>
            <th class="center" style="width:12%;">EXPORT QTY</th>
            <th style="width:35%;">BOND DETAILS (BE NO / BOND NO)</th>
            <th class="center" style="width:18%;">REMAINING IN BOND</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
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
// DUTY CALCULATION (SB) — Export Duty removed; shows FOB & Bond details
// ─────────────────────────────────────────────────────────────────────────────
function renderSBDutyCalculation(tx, company, consignee, items) {
  const exchangeRate = tx.exchangeRate || 93.45;
  const totalFOB = items.reduce((s, i) => s + Number(i.fobValue || 0), 0);

  const rows = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.commodityName || ''}</td>
        <td class="center">${item.exportQty} ${si.unit || 'CASE'}</td>
        <td>${si.packing || '___'}</td>
        <td class="right">${Number(item.fobValue).toFixed(2)}</td>
        <td class="right">${(Number(item.fobValue) * exchangeRate).toFixed(2)}</td>
        <td>${si.bondNumber || '________'}</td>
        <td>${si.beDetails || '________'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-size:12px;">
      <h2>DUTY CALCULATION / EXPORT DETAILS</h2>
      <p class="center">FOR SHIPPING BILL NO: <b>${tx.sbNumber}</b> &nbsp;&nbsp; (EX: 1 USD = ${exchangeRate})</p>
      <br>
      <p><b>SB No:</b> ${tx.sbNumber} &nbsp;&nbsp; <b>Date:</b> ${fmt(tx.date)} &nbsp;&nbsp; <b>Consignee:</b> ${consignee.name}</p>
      <p><b>Port of Loading:</b> ${tx.portOfLoading || 'Kandla'} &nbsp;&nbsp; <b>Vessel:</b> ${tx.vesselName || '________'}</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:4%;">SR.NO</th>
            <th style="width:22%;">ITEM</th>
            <th class="center" style="width:10%;">EXPORT QTY</th>
            <th style="width:12%;">PACKING</th>
            <th class="right" style="width:12%;">FOB VALUE (USD)</th>
            <th class="right" style="width:14%;">FOB VALUE (INR)</th>
            <th style="width:13%;">BOND NO.</th>
            <th style="width:13%;">BE NO.</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold" style="background:#f9fafb;">
            <td colspan="4" class="center">TOTAL</td>
            <td class="right">${totalFOB.toFixed(2)}</td>
            <td class="right">${(totalFOB * exchangeRate).toFixed(2)}</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td colspan="8">
              <b>Total FOB Value in Words:</b> USD ${numberToWords(totalFOB).toUpperCase()} ONLY &nbsp;|&nbsp;
              INR ${numberToWords(totalFOB * exchangeRate).toUpperCase()} ONLY
            </td>
          </tr>
        </tfoot>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div>
          <p><b>For ${consignee.name}</b></p>
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
// EXPORT INVOICE
// ─────────────────────────────────────────────────────────────────────────────
function renderExportInvoice(tx, company, consignee, items) {
  const exchangeRate = tx.exchangeRate || 93.45;
  const totalFOB = items.reduce((s, i) => s + Number(i.fobValue || 0), 0);
  const totalQty = items.reduce((s, i) => s + Number(i.exportQty || 0), 0);

  const rows = items.map((item, idx) => {
    const si = item.stockItem || {};
    const ratePerCase = item.exportQty > 0 ? (Number(item.fobValue) / Number(item.exportQty)) : 0;
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.commodityName || ''}</td>
        <td class="center">${si.packing || si.unit || ''}</td>
        <td class="center">${si.unit || 'Cases'}</td>
        <td class="center">${item.exportQty}</td>
        <td class="right">${ratePerCase.toFixed(2)}</td>
        <td class="right">${Number(item.fobValue).toFixed(2)}</td>
        <td class="right">${(Number(item.fobValue) * exchangeRate).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-size:12px;">
      ${company.letterheadBase64
        ? `<div style="text-align:center; margin-bottom:15px;"><img src="${company.letterheadBase64}" style="max-height:100px; max-width:100%; object-fit:contain;"></div>`
        : `<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:15px;">
             <div style="font-size:16px; font-weight:bold;">${company.legalName}</div>
             <div>${company.address}, ${company.city}</div>
           </div>`}
      <h2>COMMERCIAL INVOICE / EXPORT INVOICE</h2>
      <br>
      <table class="no-border" style="margin-bottom:12px;">
        <tr>
          <td style="width:50%; border:none;">
            <b>From:</b><br>
            <b>${company.legalName}</b><br>
            IEC: ${company.iec || '_________'}<br>
            GSTIN: ${company.gstin || '_________'}<br>
            ${company.address}, ${company.city}
          </td>
          <td style="width:50%; border:none; text-align:right;">
            <b>Invoice No:</b> ${tx.invoiceNumber || 'INV-' + tx.sbNumber}<br>
            <b>Date:</b> ${fmt(tx.date)}<br>
            <b>SB No:</b> ${tx.sbNumber}<br>
            <b>Exchange Rate:</b> 1 USD = ${exchangeRate} INR
          </td>
        </tr>
        <tr>
          <td colspan="2" style="border:none; padding-top:10px;">
            <b>Consignee (To):</b><br>
            <b>${consignee.name}</b><br>
            ${consignee.address || ''}, ${consignee.city || ''}
          </td>
        </tr>
        <tr>
          <td style="border:none;"><b>Port of Loading:</b> ${tx.portOfLoading || 'Kandla'}</td>
          <td style="border:none; text-align:right;"><b>Vessel:</b> ${tx.vesselName || '________'} &nbsp; Rotation: ${tx.rotationNo || '________'}</td>
        </tr>
      </table>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center">SR.NO</th>
            <th>DESCRIPTION</th>
            <th class="center">PACKING</th>
            <th class="center">UNIT</th>
            <th class="center">QTY</th>
            <th class="right">RATE (USD)</th>
            <th class="right">AMOUNT (USD)</th>
            <th class="right">AMOUNT (INR)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold" style="background:#f9fafb;">
            <td colspan="4" class="center">GRAND TOTAL</td>
            <td class="center">${totalQty}</td>
            <td></td>
            <td class="right">${totalFOB.toFixed(2)}</td>
            <td class="right">${(totalFOB * exchangeRate).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="8">
              <b>Amount in Words (USD):</b> ${numberToWords(totalFOB).toUpperCase()} US DOLLARS ONLY<br>
              <b>Amount in Words (INR):</b> ${numberToWords(totalFOB * exchangeRate).toUpperCase()} RUPEES ONLY
            </td>
          </tr>
        </tfoot>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div>
          <p>For <b>${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY CHALLAN
// ─────────────────────────────────────────────────────────────────────────────
function renderDeliveryChallan(tx, company, consignee, items) {
  const totalQty = items.reduce((s, i) => s + Number(i.exportQty || 0), 0);

  const rows = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.commodityName || ''}</td>
        <td>${si.packing || '___'}</td>
        <td class="center">${si.unit || 'Cases'}</td>
        <td class="center">${item.exportQty}</td>
        <td>${si.bondNumber || '________'}</td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-size:12px;">
      ${company.letterheadBase64
        ? `<div style="text-align:center; margin-bottom:15px;"><img src="${company.letterheadBase64}" style="max-height:100px; max-width:100%; object-fit:contain;"></div>`
        : `<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:15px;">
             <div style="font-size:16px; font-weight:bold;">${company.legalName}</div>
             <div>${company.address}, ${company.city}</div>
             <div>Warehouse Code: ${company.warehouseCode || '_________'}</div>
           </div>`}
      <h2>DELIVERY CHALLAN</h2>
      <br>
      <table class="no-border" style="margin-bottom:12px;">
        <tr>
          <td style="border:none;">
            <b>DC No:</b> DC-${tx.sbNumber}<br>
            <b>Date:</b> ${fmt(tx.date)}<br>
            <b>SB No:</b> ${tx.sbNumber}
          </td>
          <td style="border:none; text-align:right;">
            <b>To:</b><br>
            <b>${consignee.name}</b><br>
            ${consignee.address || ''}, ${consignee.city || ''}
          </td>
        </tr>
        <tr>
          <td style="border:none;"><b>Port of Loading:</b> ${tx.portOfLoading || 'Kandla'}</td>
          <td style="border:none; text-align:right;"><b>Vessel:</b> ${tx.vesselName || '________'}</td>
        </tr>
      </table>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:5%;">SR.NO</th>
            <th style="width:30%;">DESCRIPTION OF GOODS</th>
            <th style="width:15%;">PACKING</th>
            <th class="center" style="width:10%;">UNIT</th>
            <th class="center" style="width:10%;">QUANTITY</th>
            <th style="width:15%;">BOND NO.</th>
            <th style="width:15%;">REMARK</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold">
            <td colspan="4" class="center">TOTAL</td>
            <td class="center">${totalQty}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      <br>
      <p style="font-size:10px;">
        Being ex-bond bonded goods exported vide Shipping Bill No. <b>${tx.sbNumber}</b> Dt: <b>${fmt(tx.date)}</b>
        from <b>${company.legalName}</b> (Special Bonded Warehouse) to vessel <b>${tx.vesselName || '________'}</b>.
      </p>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div>
          <p>Received goods in good condition</p>
          <br><br>
          <p>For <b>${consignee.name}</b></p>
          <br>
          <p>Authorised Signatory</p>
        </div>
        <div style="text-align:center;">
          <p>Customs P.O. (Bond)</p>
          <br><br>
          <p>Signature: _______________</p>
        </div>
        <div style="text-align:right;">
          <p>For <b>${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PACKING LIST
// ─────────────────────────────────────────────────────────────────────────────
function renderPackingList(tx, company, consignee, items) {
  const totalQty = items.reduce((s, i) => s + Number(i.exportQty || 0), 0);

  const rows = items.map((item, idx) => {
    const si = item.stockItem || {};
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${si.commodityName || ''}</td>
        <td>${si.packing || '___'}</td>
        <td class="center">${item.exportQty}</td>
        <td class="center">${si.unit || 'Cases'}</td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageStyle}</style></head><body>
    <div class="page" style="font-size:12px;">
      <h2>PACKING LIST</h2>
      <p class="center"><b>SB No:</b> ${tx.sbNumber} &nbsp;&nbsp; <b>Date:</b> ${fmt(tx.date)}</p>
      <br>
      <p><b>Exporter:</b> ${company.legalName}, ${company.city}</p>
      <p><b>Consignee:</b> ${consignee.name}, ${consignee.city || ''}</p>
      <p><b>Vessel:</b> ${tx.vesselName || '________'} &nbsp;&nbsp; <b>Port of Loading:</b> ${tx.portOfLoading || 'Kandla'}</p>
      <br>
      <table>
        <thead>
          <tr style="background:#f3f4f6;">
            <th class="center" style="width:5%;">SR.NO</th>
            <th style="width:35%;">DESCRIPTION OF GOODS</th>
            <th style="width:20%;">PACKING</th>
            <th class="center" style="width:12%;">NO. OF CASES</th>
            <th class="center" style="width:12%;">UNIT</th>
            <th style="width:16%;">NET / GROSS WEIGHT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="bold">
            <td colspan="3" class="center">TOTAL</td>
            <td class="center">${totalQty}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      <br>
      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div>
          <p>For <b>${company.legalName}</b></p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </div>
    </body></html>
  `;
}

function renderAnnexure(tx, company, consignee, items) {
  return renderSBDutyCalculation(tx, company, consignee, items);
}

module.exports = {
  renderPinkShippingBill,
  renderSBNotesheet,
  renderSBDutyCalculation,
  renderExportInvoice,
  renderDeliveryChallan,
  renderPackingList,
  renderAnnexure,
};
