import re

with open("grdocs/index.html", "r") as f:
    html = f.read()

# 1. Update Global Details Form
global_form_old = """
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Global Details Form -->
                <div>
                    <h2 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Global / Transaction Details</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="text" v-model="global.date" placeholder="e.g. 15/05/2026" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exchange Rate (USD to INR)</label>
                            <input type="number" step="0.01" v-model="global.exchangeRate" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input type="text" v-model="global.invoiceNumber" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">DC Number</label>
                            <input type="text" v-model="global.dcNumber" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Present Duty Balance (INR)</label>
                            <input type="number" v-model="global.presentDutyBalance" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>
                
                <!-- Buyer Details Form -->
                <div>
                    <h2 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Consignee (Buyer) Details</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                            <input type="text" v-model="global.buyerName" placeholder="M/S RUBY SHIPPING" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer Address</label>
                            <textarea v-model="global.buyerAddress" rows="2" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer GSTIN</label>
                            <input type="text" v-model="global.buyerGSTIN" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Warehouse Code</label>
                            <input type="text" v-model="global.warehouseCode" placeholder="e.g. IXY1S004" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>
            </div>
"""

global_form_new = """
            <form @submit.prevent="printDocs" id="grForm">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Global Details Form -->
                <div>
                    <h2 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Global / Transaction Details</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div class="flex">
                                <input type="date" v-model="global.date" required class="w-full p-2 border rounded-l focus:ring-blue-500 focus:border-blue-500">
                                <button type="button" @click="setToday" class="bg-gray-200 px-3 border border-l-0 rounded-r hover:bg-gray-300 text-sm">Today</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exchange Rate (USD to INR)</label>
                            <input type="number" step="0.01" v-model="global.exchangeRate" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input type="text" v-model="global.invoiceNumber" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">DC Number</label>
                            <input type="text" v-model="global.dcNumber" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Present Duty Balance (INR)</label>
                            <input type="number" v-model="global.presentDutyBalance" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>
                
                <!-- Buyer Details Form -->
                <div>
                    <h2 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Consignee (Buyer) Details</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                            <input type="text" v-model="global.buyerName" placeholder="M/S RUBY SHIPPING" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer Address</label>
                            <textarea v-model="global.buyerAddress" rows="2" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Buyer GSTIN</label>
                            <input type="text" v-model="global.buyerGSTIN" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Warehouse Code</label>
                            <input type="text" v-model="global.warehouseCode" placeholder="e.g. IXY1S004" required class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>
            </div>
"""
if global_form_old in html:
    html = html.replace(global_form_old, global_form_new)

# 2. Add required to item inputs
html = html.replace('v-model="item.item" class="w-32', 'v-model="item.item" required class="w-32')
html = html.replace('v-model="item.qty" class="w-20', 'v-model="item.qty" required min="1" class="w-20')
html = html.replace('v-model="item.packing" class="w-24', 'v-model="item.packing" required class="w-24')
html = html.replace('v-model="item.pricePerCaseUSD" class="w-24', 'v-model="item.pricePerCaseUSD" required min="0" class="w-24')
html = html.replace('v-model="item.beDetails" class="w-32', 'v-model="item.beDetails" required class="w-32')
html = html.replace('v-model="item.bondDetails" class="w-32', 'v-model="item.bondDetails" required class="w-32')
html = html.replace('v-model="item.balanceInBond" class="w-24', 'v-model="item.balanceInBond" required class="w-24')

# 3. Fix percentage formatting
html = html.replace('dutyPercentageStr: (dutyPercentage * 100) + \'%\',', 'dutyPercentageStr: (dutyPercentage * 100).toFixed(0) + \'%\',')

# 4. Update the "Generate" button type and position
btn_old = """                <button @click="printDocs" class="mt-4 md:mt-0 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transform hover:scale-105 transition duration-200 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Generate GR Documents
                </button>
            </div>
            
        </div>
    </div>"""
btn_new = """                <button type="submit" class="mt-4 md:mt-0 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transform hover:scale-105 transition duration-200 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Generate GR Documents
                </button>
            </div>
            </form>
        </div>
    </div>"""
if btn_old in html:
    html = html.replace(btn_old, btn_new)

# 5. Fix setToday method in Vue setup
setup_old = "const printDocs = () => {"
setup_new = """            const setToday = () => {
                const today = new Date();
                global.value.date = today.toISOString().split('T')[0];
            };

            const printDocs = () => {"""
if setup_old in html and "setToday" not in html:
    html = html.replace(setup_old, setup_new)
    html = html.replace("removeItem, printDocs", "removeItem, printDocs, setToday")

# 6. Page Breaks and Page Height Fixes
# We will use display: flex; flex-direction: column; on portrait-page and landscape-page
# and define strict heights so page breaks don't misbehave.
css_old = """
            .portrait-page { 
                page: portrait-page;
                width: 210mm; 
                min-height: 297mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
            }
            
            .landscape-page { 
                page: landscape-page;
                width: 297mm; 
                min-height: 210mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
            }
"""
css_new = """
            .portrait-page { 
                page: portrait-page;
                width: 210mm; 
                height: 295mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .landscape-page { 
                page: landscape-page;
                width: 297mm; 
                height: 208mm; 
                margin: 0;
                padding: 10mm 15mm; 
                box-sizing: border-box;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .mt-auto { margin-top: auto; }
"""
if css_old in html:
    html = html.replace(css_old, css_new)

with open("grdocs/index.html", "w") as f:
    f.write(html)

