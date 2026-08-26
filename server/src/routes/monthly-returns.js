const express = require('express');
const prisma = require('../db/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Enforce company context
router.use((req, res, next) => {
  if (!req.company && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Company context is required.' });
  }
  next();
});

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function numberToWords(amount) {
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
  str += (n[5] != 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

/**
 * @route GET /api/monthly-returns/calculate
 * @desc Calculate live monthly stock reconciliation and transaction lists for selected period
 */
router.get('/calculate', async (req, res) => {
  try {
    let targetCompanyId = req.company?.id || req.query.companyId || req.user?.companyId;
    if (!targetCompanyId) {
      const defComp = await prisma.company.findFirst();
      targetCompanyId = defComp?.id;
    }
    if (!targetCompanyId) return res.status(400).json({ error: 'Company ID required.' });

    const period = req.query.period || new Date().toISOString().substring(0, 7); // e.g. "2026-08"
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Fetch Inbound GR Purchases for month
    const inboundGRs = await prisma.gRPurchaseTransaction.findMany({
      where: {
        companyId: targetCompanyId,
        date: { gte: startDate, lte: endDate }
      },
      include: { vendor: true, items: true },
      orderBy: { date: 'asc' }
    });

    // 2. Fetch Outbound Pink Shipping Bills for month
    const outboundSBs = await prisma.shippingBillTransaction.findMany({
      where: {
        companyId: targetCompanyId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        consignee: true,
        items: { include: { stockItem: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 3. Fetch Outbound Ex-Bond Sales / GR Transfers for month
    const outboundGRs = await prisma.gRTransaction.findMany({
      where: {
        companyId: targetCompanyId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        party: true,
        items: { include: { stockItem: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 4. Fetch all Stock Items for Closing/Opening Stock
    const allStockItems = await prisma.stockItem.findMany({
      where: { companyId: targetCompanyId },
      orderBy: { createdAt: 'asc' }
    });

    // Structure Inbound Items
    const inboundRows = [];
    inboundGRs.forEach(gr => {
      gr.items.forEach(item => {
        inboundRows.push({
          docType: 'GR Purchase',
          docNumber: gr.grPurchaseNumber,
          date: gr.date,
          bondNumber: `BOND-${gr.grPurchaseNumber}`,
          partyName: gr.vendor?.name || 'N/A',
          commodityName: item.commodityName,
          commodityType: item.commodityType,
          qty: item.qty,
          unit: item.unit,
          packing: item.packing || '',
          usdValue: item.usdValue,
          assessableValueInr: item.assessableValueInr,
          dutyAmountInr: item.dutyAmountInr
        });
      });
    });

    // Structure Outbound Items
    const outboundRows = [];
    outboundSBs.forEach(sb => {
      sb.items.forEach(item => {
        const si = item.stockItem || {};
        outboundRows.push({
          docType: 'Pink Shipping Bill (Export)',
          docNumber: sb.sbNumber,
          date: sb.date,
          bondNumber: si.bondNumber || 'N/A',
          beDetails: si.beDetails || '',
          partyName: sb.consignee?.name || 'N/A',
          commodityName: si.commodityName || 'Export Item',
          qty: item.exportQty,
          unit: si.unit || 'Cases',
          fobValueUSD: item.fobValue,
          fobValueINR: item.fobValue * (sb.exchangeRate || 93.45),
          dutyDebitedINR: 0 // Duty free ex-bond export
        });
      });
    });

    outboundGRs.forEach(gr => {
      gr.items.forEach(item => {
        const si = item.stockItem || {};
        outboundRows.push({
          docType: 'Ex-Bond Sale / GR Transfer',
          docNumber: gr.grNumber,
          date: gr.date,
          bondNumber: item.bondDetails || si.bondNumber || 'N/A',
          beDetails: item.beDetails || si.beDetails || '',
          partyName: gr.party?.name || 'N/A',
          commodityName: item.item || si.commodityName,
          qty: item.qty,
          unit: item.unit || 'Cases',
          fobValueUSD: item.usdValue,
          fobValueINR: item.assessableValueInr,
          dutyDebitedINR: item.dutyAmountInr
        });
      });
    });

    // Reconciliation Summary
    const totalInboundQty = inboundRows.reduce((s, i) => s + i.qty, 0);
    const totalInboundDuty = inboundRows.reduce((s, i) => s + i.dutyAmountInr, 0);
    const totalOutboundQty = outboundRows.reduce((s, i) => s + i.qty, 0);
    const totalOutboundDuty = outboundRows.reduce((s, i) => s + i.dutyDebitedINR, 0);

    const totalClosingQty = allStockItems.reduce((s, i) => s + i.remainingQuantity, 0);
    const totalClosingDutyBalance = allStockItems.reduce((s, i) => s + i.presentDutyBalance, 0);

    const defaultChecklist = [
      { id: 1, text: 'Opening stock reconciled with previous month closing record', completed: true, required: true },
      { id: 2, text: 'Inbound GR Purchases and Triple Duty Bond references verified', completed: true, required: true },
      { id: 3, text: 'Outbound Pink Shipping Bills and Ex-Bond Sale entries verified', completed: true, required: true },
      { id: 4, text: 'Physical stock tally matched with bonded stock ledger closing count', completed: false, required: true },
      { id: 5, text: 'Monthly return statement printed, signed and submitted manually to Custom House Kandla', completed: false, required: true }
    ];

    res.json({
      period,
      startDate,
      endDate,
      summary: {
        totalInboundQty,
        totalInboundDuty,
        totalOutboundQty,
        totalOutboundDuty,
        totalClosingQty,
        totalClosingDutyBalance
      },
      inboundRows,
      outboundRows,
      closingStock: allStockItems,
      checklist: defaultChecklist
    });
  } catch (error) {
    console.error('Calculate monthly return error:', error);
    res.status(500).json({ error: 'Failed to calculate monthly return: ' + error.message });
  }
});

/**
 * @route POST /api/monthly-returns
 * @desc Save / Save Draft / Finalize a monthly return
 */
router.post('/', async (req, res) => {
  try {
    const { period, startDate, endDate, inboundRows, outboundRows, closingStock, checklist, status, remarks } = req.body;
    let targetCompanyId = req.company?.id || req.body.companyId || req.user?.companyId;

    if (!targetCompanyId) {
      const defComp = await prisma.company.findFirst();
      targetCompanyId = defComp?.id;
    }

    const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    const returnNumber = `MRET-${company?.subdomain?.toUpperCase() || 'TX'}-${period}`;

    const existing = await prisma.monthlyReturn.findUnique({ where: { returnNumber } });

    const returnData = {
      returnNumber,
      companyId: targetCompanyId,
      userId: req.user.id,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      openingStockSnapshot: JSON.stringify({}),
      inboundSnapshot: JSON.stringify(inboundRows || []),
      outboundSnapshot: JSON.stringify(outboundRows || []),
      closingStockSnapshot: JSON.stringify(closingStock || []),
      checklistData: JSON.stringify(checklist || []),
      status: status || 'draft',
      remarks: remarks || '',
      submittedAt: status === 'submitted' ? new Date() : null
    };

    let monthlyReturn;
    if (existing) {
      monthlyReturn = await prisma.monthlyReturn.update({
        where: { id: existing.id },
        data: returnData
      });
    } else {
      monthlyReturn = await prisma.monthlyReturn.create({
        data: returnData
      });
    }

    res.status(201).json(monthlyReturn);
  } catch (error) {
    console.error('Save monthly return error:', error);
    res.status(500).json({ error: 'Failed to save monthly return: ' + error.message });
  }
});

/**
 * @route GET /api/monthly-returns
 * @desc Get all saved monthly returns
 */
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.company) whereClause.companyId = req.company.id;

    const returns = await prisma.monthlyReturn.findMany({
      where: whereClause,
      include: { company: true, user: true },
      orderBy: { period: 'desc' }
    });
    res.json({ returns });
  } catch (error) {
    console.error('List monthly returns error:', error);
    res.status(500).json({ error: 'Failed to list monthly returns.' });
  }
});

/**
 * @route GET /api/monthly-returns/:id/preview/report
 * @desc Render printable HTML Monthly Return Reconciliation Statement
 */
router.get('/:id/preview/report', async (req, res) => {
  try {
    const ret = await prisma.monthlyReturn.findUnique({
      where: { id: req.params.id },
      include: { company: true, user: true }
    });
    if (!ret) return res.status(404).send('Monthly return not found.');

    const company = ret.company;
    const inbound = JSON.parse(ret.inboundSnapshot || '[]');
    const outbound = JSON.parse(ret.outboundSnapshot || '[]');
    const closing = JSON.parse(ret.closingStockSnapshot || '[]');
    const checklist = JSON.parse(ret.checklistData || '[]');

    const inboundRowsHtml = inbound.map((item, idx) => `
      <tr>
        <td style="text-align:center; border:1px solid #000; padding:4px;">${idx + 1}</td>
        <td style="border:1px solid #000; padding:4px;"><b>${item.docNumber}</b><br>${formatDate(item.date)}</td>
        <td style="border:1px solid #000; padding:4px;">${item.bondNumber}</td>
        <td style="border:1px solid #000; padding:4px;">${item.partyName}</td>
        <td style="border:1px solid #000; padding:4px;">${item.commodityName}</td>
        <td style="text-align:center; border:1px solid #000; padding:4px;">${item.qty} ${item.unit || 'Cases'}</td>
        <td style="text-align:right; border:1px solid #000; padding:4px;">Rs. ${Number(item.assessableValueInr || 0).toFixed(2)}</td>
        <td style="text-align:right; border:1px solid #000; padding:4px;">Rs. ${Number(item.dutyAmountInr || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const outboundRowsHtml = outbound.map((item, idx) => `
      <tr>
        <td style="text-align:center; border:1px solid #000; padding:4px;">${idx + 1}</td>
        <td style="border:1px solid #000; padding:4px;"><b>${item.docNumber}</b><br>${formatDate(item.date)}</td>
        <td style="border:1px solid #000; padding:4px;">${item.bondNumber}</td>
        <td style="border:1px solid #000; padding:4px;">${item.partyName}</td>
        <td style="border:1px solid #000; padding:4px;">${item.commodityName}</td>
        <td style="text-align:center; border:1px solid #000; padding:4px;">${item.qty} ${item.unit || 'Cases'}</td>
        <td style="border:1px solid #000; padding:4px;">${item.docType}</td>
        <td style="text-align:right; border:1px solid #000; padding:4px;">Rs. ${Number(item.dutyDebitedINR || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Monthly Warehouse Return - ${ret.period}</title>
      <style>
        html, body { font-family: 'Times New Roman', serif; font-size: 11px; margin: 0; padding: 15mm; color: #000000 !important; background-color: #ffffff !important; line-height: 1.4; }
        .page { page-break-after: always; background-color: #ffffff !important; color: #000000 !important; }
        .page:last-child { page-break-after: auto; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11px; vertical-align: top; }
        th { background-color: #f3f4f6; text-align: left; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        h2 { text-align: center; font-size: 14px; margin: 5px 0; text-transform: uppercase; text-decoration: underline; }
      </style>
      </head><body>
      <div class="page">
        ${company.letterheadBase64
          ? `<div style="text-align:center; margin-bottom:10px;"><img src="${company.letterheadBase64}" style="max-height:90px; max-width:100%;"></div>`
          : `<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:10px;">
               <div style="font-size:16px; font-weight:bold;">${company.legalName}</div>
               <div>${company.address}, ${company.city}</div>
               <div>Warehouse Code: ${company.warehouseCode || '_________'}</div>
             </div>`}

        <h2>MONTHLY BONDED WAREHOUSE RETURN &amp; STOCK RECONCILIATION STATEMENT</h2>
        <p class="center" style="font-size:12px; margin-bottom:15px;"><b>PERIOD:</b> ${ret.period} &nbsp;&nbsp;|&nbsp;&nbsp; <b>RETURN REF NO:</b> ${ret.returnNumber} &nbsp;&nbsp;|&nbsp;&nbsp; <b>STATUS:</b> ${ret.status.toUpperCase()}</p>

        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
          <div>
            <b>Customs House:</b> ${company.customStation || 'Custom House Kandla'}<br>
            <b>Bond Section:</b> Special Bonded Warehouse (${company.warehouseCode || 'N/A'})
          </div>
          <div style="text-align:right;">
            <b>Generated On:</b> ${formatDate(ret.createdAt)}<br>
            <b>Prepared By:</b> ${ret.user?.name || 'Admin'}
          </div>
        </div>

        <div class="bold" style="font-size:12px; margin-bottom:6px;">SECTION 1: INBOUND STOCK RECEIVED (GR PURCHASES / INWARD BE)</div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width:4%;">SR</th>
              <th style="width:18%;">Doc No &amp; Date</th>
              <th style="width:16%;">Bond Number</th>
              <th style="width:20%;">Vendor / Supplier</th>
              <th style="width:20%;">Commodity Name</th>
              <th class="center" style="width:8%;">Qty</th>
              <th class="right" style="width:14%;">Assessable Value</th>
              <th class="right" style="width:10%;">Duty (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${inboundRowsHtml || '<tr><td colspan="8" class="center">No inward receipts for this month.</td></tr>'}
          </tbody>
        </table>

        <div class="bold" style="font-size:12px; margin-bottom:6px; margin-top:20px;">SECTION 2: OUTBOUND DISPATCHES &amp; EX-BOND SALES (SHIPPING BILLS / GR TRANSFERS)</div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width:4%;">SR</th>
              <th style="width:18%;">Doc No &amp; Date</th>
              <th style="width:16%;">Bond Number</th>
              <th style="width:20%;">Consignee / Buyer</th>
              <th style="width:20%;">Commodity Name</th>
              <th class="center" style="width:8%;">Qty</th>
              <th style="width:14%;">Dispatch Type</th>
              <th class="right" style="width:10%;">Duty Debited</th>
            </tr>
          </thead>
          <tbody>
            ${outboundRowsHtml || '<tr><td colspan="8" class="center">No outward dispatches for this month.</td></tr>'}
          </tbody>
        </table>

        <div class="bold" style="font-size:12px; margin-bottom:6px; margin-top:20px;">SECTION 3: COMPLIANCE CHECKLIST STATUS</div>
        <table>
          <thead>
            <tr>
              <th class="center" style="width:5%;">SR</th>
              <th>Checklist Compliance Item</th>
              <th class="center" style="width:15%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${checklist.map((c, i) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td>${c.text}</td>
                <td class="center bold" style="color:${c.completed ? 'green' : 'red'};">${c.completed ? '✓ COMPLIED' : '✗ PENDING'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display:flex; justify-content:space-between; margin-top:50px;">
          <div>
            <p>Prepared &amp; Reconciled By</p>
            <br><br>
            <p><b>For ${company.legalName}</b></p>
            <br>
            <p>Authorized Signatory</p>
          </div>
          <div style="text-align:center;">
            <p>Verified By Customs P.O.</p>
            <br><br>
            <p>Signature: _______________</p>
            <p>(Preventive Officer)</p>
          </div>
          <div style="text-align:right;">
            <p>Approved By</p>
            <br><br>
            <p>Superintendent (Bond)</p>
            <p>Custom House Kandla</p>
          </div>
        </div>
      </div>
      </body></html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Monthly return preview report error:', error);
    res.status(500).send('<h3>Failed to generate monthly return report: ' + error.message + '</h3>');
  }
});

module.exports = router;
