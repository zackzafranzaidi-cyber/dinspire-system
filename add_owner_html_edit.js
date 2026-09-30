const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// Add "Edit Request" badge on the slider menu (Orders icon)
html = html.replace(
    '<a href="#" class="sidebar-link" data-tab="orders"><i class="fas fa-shopping-cart"></i> Pesanan Produk & Cuti</a>',
    '<a href="#" class="sidebar-link" data-tab="orders"><i class="fas fa-shopping-cart"></i> Pesanan, Cuti & Edit <span class="badge" id="badge-orders" style="display:none; background:red; color:white; border-radius:50%; padding:2px 6px; font-size:10px; margin-left:5px;">0</span></a>'
);

// Add the Edit Requests UI inside the Orders tab
const editRequestsUI = `
            <!-- SENARAI PERMOHONAN EDIT -->
            <div class="card" style="margin-top: 20px;">
                <h3 style="display:flex; justify-content:space-between; align-items:center;">
                    Permohonan Edit Sejarah Staf
                    <span id="badge-edit-requests" class="badge" style="background:red; color:white; border-radius:50%; padding:4px 8px; font-size:12px; display:none;">0</span>
                </h3>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">Staf yang tersalah kunci masuk harga atau butiran transaksi akan dipaparkan di sini untuk kelulusan Tuan.</p>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Staf</th>
                                <th>Sebab Edit</th>
                                <th>Harga Asal -> Baru</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody id="editRequestsTableBody">
                            <tr><td colspan="4" style="text-align:center;">Memuat turun...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
`;

if (!html.includes('Permohonan Edit Sejarah Staf')) {
    html = html.replace('<!-- REKOD CUTI (Hanya dipaparkan dalam Orders Tab) -->', editRequestsUI + '\n\n            <!-- REKOD CUTI (Hanya dipaparkan dalam Orders Tab) -->');
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Updated owner HTML");
}
