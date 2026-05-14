// ─── DOM refs ───
const titleEl = document.getElementById("title");
const priceEl = document.getElementById("price");
const taxsEl = document.getElementById("taxs");
const discountEl = document.getElementById("discount");
const totalEl = document.getElementById("total");
const countEl = document.getElementById("count");
const categoryEl = document.getElementById("category");
const createBtn = document.getElementById("create");
const cancelEditBtn = document.getElementById("cancel-edit");
const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");
const paginationContainer = document.getElementById("pagination");
const modal = document.getElementById("duplicate-modal");
const modalMessage = document.getElementById("modal-message");
const confirmAddBtn = document.getElementById("confirm-add");
const cancelAddBtn = document.getElementById("cancel-add");
const emptyState = document.getElementById("empty-state");
const delAllSection = document.getElementById("delall-section");
const formTitleLabel = document.getElementById("form-title-label");
const btnLabel = document.getElementById("btn-label");

let products = JSON.parse(localStorage.getItem("products") || "[]");
let filteredProducts = [...products];
let mode = "create";
let indexToUpdate = null;
let currentPage = 1;
const perPage = 15;

// ─── Init ───
refresh();

// ─── Compute total ───
function getTotal() {
  const p = parseFloat(priceEl.value) || 0;
  const t = parseFloat(taxsEl.value) || 0;
  const d = parseFloat(discountEl.value) || 0;
  if (priceEl.value.trim() !== "") {
    totalEl.value = `$${(p + t - d).toFixed(2)}`;
    totalEl.style.color = "var(--green)";
  } else {
    totalEl.value = "—";
    totalEl.style.color = "var(--text-3)";
  }
}

// ─── Create / Update ───
createBtn.onclick = () => {
  const tVal = titleEl.value.trim();
  const pVal = priceEl.value.trim();
  const cVal = categoryEl.value.trim();
  if (!tVal || !pVal || !cVal) {
    showAlert();
    return;
  }

  const newProduct = {
    title: tVal,
    price: parseFloat(pVal),
    taxs: parseFloat(taxsEl.value) || 0,
    discount: parseFloat(discountEl.value) || 0,
    total: parseFloat(totalEl.value.replace("$", "")) || parseFloat(pVal),
    count: parseInt(countEl.value) || 1,
    category: cVal,
  };

  if (mode === "update") {
    products[indexToUpdate] = newProduct;
    resetForm();
    save();
    refresh();
    toast("Product updated successfully.", "success");
    return;
  }

  const existing = products.findIndex(
    (p) =>
      p.title.toLowerCase() === newProduct.title.toLowerCase() &&
      p.category.toLowerCase() === newProduct.category.toLowerCase(),
  );

  if (existing !== -1) {
    modalMessage.textContent = `"${newProduct.title}" already exists at #${existing + 1}. Increase its count by ${newProduct.count}?`;
    modal.classList.remove("hidden");
    confirmAddBtn.onclick = () => {
      products[existing].count += newProduct.count;
      modal.classList.add("hidden");
      save();
      refresh();
      resetForm();
      toast("Stock count updated.", "success");
      confirmAddBtn.onclick = cancelAddBtn.onclick = null;
    };
    cancelAddBtn.onclick = () => {
      modal.classList.add("hidden");
      resetForm();
      confirmAddBtn.onclick = cancelAddBtn.onclick = null;
    };
    return;
  }

  products.push(newProduct);
  save();
  refresh();
  resetForm();
  toast("Product created.", "success");
};

cancelEditBtn.onclick = () => {
  resetForm();
  toast("Edit cancelled.", "info");
};

// ─── Save ───
function save() {
  localStorage.setItem("products", JSON.stringify(products));
}

// ─── Refresh all views ───
function refresh() {
  filteredProducts = applySearch(searchInput.value);
  renderTable();
  renderPagination();
  updateStats();
  updateDeleteAllBtn();
}

function applySearch(val) {
  const v = val.toLowerCase().trim();
  if (!v) return [...products];
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(v) || p.category.toLowerCase().includes(v),
  );
}

// ─── Render table ───
function renderTable() {
  const start = (currentPage - 1) * perPage;
  const pageData = filteredProducts.slice(start, start + perPage);

  tbody.innerHTML = "";

  if (filteredProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  pageData.forEach((p, i) => {
    const gi = start + i;
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${gi + 1}</td>
        <td class="td-title">${escHtml(p.title)}</td>
        <td class="td-price">$${Number(p.price).toFixed(2)}</td>
        <td class="td-number">${p.taxs ? "$" + Number(p.taxs).toFixed(2) : "—"}</td>
        <td class="td-number">${p.discount ? "$" + Number(p.discount).toFixed(2) : "—"}</td>
        <td class="td-total">$${Number(p.total).toFixed(2)}</td>
        <td><span class="count-badge">${p.count}</span></td>
        <td><span class="badge">${escHtml(p.category)}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn icon-btn-edit" title="Edit" onclick="editProduct(${gi})"><i class="fas fa-pen"></i></button>
            <button class="icon-btn icon-btn-minus" title="Decrease Count" onclick="decreaseCount(${gi})"><i class="fas fa-minus"></i></button>
            <button class="icon-btn icon-btn-del" title="Remove" onclick="removeProduct(${gi})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

// ─── Pagination ───
function renderPagination() {
  paginationContainer.innerHTML = "";
  const total = Math.ceil(filteredProducts.length / perPage);
  if (total <= 1) return;

  // Prev
  const prev = document.createElement("button");
  prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination();
    }
  };
  paginationContainer.appendChild(prev);

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderTable();
      renderPagination();
    };
    paginationContainer.appendChild(btn);
  }

  // Next
  const next = document.createElement("button");
  next.innerHTML = '<i class="fas fa-chevron-right"></i>';
  next.disabled = currentPage === total;
  next.onclick = () => {
    if (currentPage < total) {
      currentPage++;
      renderTable();
      renderPagination();
    }
  };
  paginationContainer.appendChild(next);
}

// ─── Edit ───
function editProduct(i) {
  const p = products[i];
  titleEl.value = p.title;
  priceEl.value = p.price;
  taxsEl.value = p.taxs;
  discountEl.value = p.discount;
  countEl.value = p.count;
  categoryEl.value = p.category;
  getTotal();
  mode = "update";
  indexToUpdate = i;
  btnLabel.textContent = "Update Product";
  createBtn.classList.add("btn-update-mode");
  createBtn.classList.remove("btn-primary");
  formTitleLabel.textContent = "Edit Product";
  cancelEditBtn.style.display = "inline-flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Decrease count / remove ───
function decreaseCount(i) {
  if (products[i].count > 1) {
    products[i].count--;
    toast("Stock decreased.", "info");
  } else {
    const name = products[i].title;
    products.splice(i, 1);
    currentPage = 1;
    toast(`"${name}" removed.`, "error");
  }
  save();
  refresh();
}

function removeProduct(i) {
  const name = products[i].title;
  products.splice(i, 1);
  currentPage = 1;
  save();
  refresh();
  toast(`"${name}" deleted.`, "error");
}

// ─── Delete All ───
function updateDeleteAllBtn() {
  if (products.length > 0) {
    delAllSection.innerHTML = `
        <button class="btn btn-danger" style="width:100%;margin-bottom:12px" onclick="deleteAll()">
          <i class="fas fa-trash-can"></i> Delete All Products (${products.length})
        </button>`;
  } else {
    delAllSection.innerHTML = "";
  }
}

function deleteAll() {
  if (
    !confirm(`Delete all ${products.length} products? This cannot be undone.`)
  )
    return;
  localStorage.removeItem("products");
  products = [];
  currentPage = 1;
  refresh();
  toast("All products deleted.", "error");
}

// ─── Stats ───
function updateStats() {
  document.getElementById("stat-count").textContent = products.length;
  document.getElementById("stat-stock").textContent = products.reduce(
    (a, p) => a + (p.count || 0),
    0,
  );
  const val = products.reduce(
    (a, p) => a + Number(p.total) * (p.count || 1),
    0,
  );
  document.getElementById("stat-value").textContent =
    "$" + val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ─── Search ───
searchInput.addEventListener("input", () => {
  filteredProducts = applySearch(searchInput.value);
  currentPage = 1;
  renderTable();
  renderPagination();
});

// ─── Reset form ───
function resetForm() {
  titleEl.value =
    priceEl.value =
    taxsEl.value =
    discountEl.value =
    countEl.value =
    categoryEl.value =
      "";
  totalEl.value = "—";
  totalEl.style.color = "var(--text-3)";
  mode = "create";
  indexToUpdate = null;
  btnLabel.textContent = "Create Product";
  createBtn.classList.remove("btn-update-mode");
  createBtn.classList.add("btn-primary");
  formTitleLabel.textContent = "Add New Product";
  cancelEditBtn.style.display = "none";
}

// ─── Alert ───
function showAlert() {
  const el = document.getElementById("alert-msg");
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ─── Toast ───
function toast(msg, type = "info") {
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
  };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── Escape HTML ───
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── PDF Export ───
document.getElementById("exportPDF").onclick = () => {
  if (!products.length) {
    toast("No products to export.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Product Manager — Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  const totalVal = products.reduce((a, p) => a + Number(p.total) * p.count, 0);
  doc.text(
    `Date: ${new Date().toLocaleDateString()}  |  Products: ${products.length}  |  Portfolio: $${totalVal.toFixed(2)}`,
    14,
    26,
  );
  doc.autoTable({
    startY: 34,
    head: [
      [
        "#",
        "Title",
        "Price",
        "Taxes",
        "Discount",
        "Total",
        "Count",
        "Category",
      ],
    ],
    body: products.map((p, i) => [
      i + 1,
      p.title,
      `$${Number(p.price).toFixed(2)}`,
      `$${Number(p.taxs).toFixed(2)}`,
      `$${Number(p.discount).toFixed(2)}`,
      `$${Number(p.total).toFixed(2)}`,
      p.count,
      p.category,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [91, 127, 255],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 249, 252] },
  });
  doc.save("Product-Report.pdf");
  toast("PDF downloaded.", "success");
};

// ─── Excel Export ───
document.getElementById("exportExcel").onclick = () => {
  if (!products.length) {
    toast("No products to export.", "error");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(products);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "products.xlsx");
  toast("Excel downloaded.", "success");
};

// ─── Excel Import ───
document.getElementById("importExcel").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const wb = XLSX.read(new Uint8Array(ev.target.result), {
        type: "array",
      });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      let added = 0;
      rows.forEach((r) => {
        products.push({
          title: r.title || "",
          price: r.price || 0,
          taxs: r.taxs || 0,
          discount: r.discount || 0,
          total: r.total || 0,
          count: r.count || 1,
          category: r.category || "",
        });
        added++;
      });
      save();
      currentPage = 1;
      refresh();
      toast(`Imported ${added} products.`, "success");
    } catch (err) {
      toast("Failed to import file.", "error");
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = "";
});
