// Customer Management System - JavaScript

// Data Store (using localStorage for persistence)
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let purchases = JSON.parse(localStorage.getItem("purchases")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];

// DOM Elements
const customerForm = document.getElementById("customerForm");
const purchaseForm = document.getElementById("purchaseForm");
const paymentForm = document.getElementById("paymentForm");
const customerTableBody = document.getElementById("customerTableBody");
const purchaseCustomerSelect = document.getElementById("purchaseCustomer");
const paymentCustomerSelect = document.getElementById("paymentCustomer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const purchaseModal = document.getElementById("purchaseModal");
const closeModal = document.querySelector(".close-modal");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeDates();
  loadData();
  updateStats();
  renderCustomerTable();
  updateCustomerSelects();
});

// Initialize date fields with current date
function initializeDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("purchaseDate").value = today;
  document.getElementById("paymentDate").value = today;
}

// Load data from localStorage
function loadData() {
  customers = JSON.parse(localStorage.getItem("customers")) || [];
  purchases = JSON.parse(localStorage.getItem("purchases")) || [];
  payments = JSON.parse(localStorage.getItem("payments")) || [];
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("customers", JSON.stringify(customers));
  localStorage.setItem("purchases", JSON.stringify(purchases));
  localStorage.setItem("payments", JSON.stringify(payments));
}

// Update Statistics
function updateStats() {
  document.getElementById("totalCustomers").textContent = customers.length;

  const totalPurchases = purchases.length;
  document.getElementById("totalPurchases").textContent = totalPurchases;

  let totalRevenue = 0;
  let totalRemainder = 0;

  customers.forEach((customer) => {
    const customerPurchases = purchases.filter(
      (p) => p.customerId === customer.id,
    );
    const customerPayments = payments.filter(
      (p) => p.customerId === customer.id,
    );

    const totalSpent = customerPurchases.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0,
    );
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

    totalRevenue += totalSpent;
    totalRemainder += totalSpent - totalPaid;
  });

  document.getElementById("totalRevenue").textContent =
    formatCurrency(totalRevenue);
  document.getElementById("totalRemainder").textContent =
    formatCurrency(totalRemainder);
}

// Format currency
function formatCurrency(amount) {
  return "$" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Customer Form Submit
customerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const customer = {
    id: generateId(),
    name: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("customerPhone").value.trim(),
    email: document.getElementById("customerEmail").value.trim(),
    address: document.getElementById("customerAddress").value.trim(),
    createdAt: new Date().toISOString(),
  };

  customers.push(customer);
  saveData();

  customerForm.reset();
  initializeDates();
  updateStats();
  renderCustomerTable();
  updateCustomerSelects();

  showToast("Customer added successfully!", "success");
  animateCard(".customer-form-section");
});

// Purchase Form Submit
purchaseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const purchase = {
    id: generateId(),
    customerId: document.getElementById("purchaseCustomer").value,
    item: document.getElementById("purchaseItem").value.trim(),
    quantity: parseInt(document.getElementById("purchaseQuantity").value),
    price: parseFloat(document.getElementById("purchasePrice").value),
    date: document.getElementById("purchaseDate").value,
    createdAt: new Date().toISOString(),
  };

  purchases.push(purchase);
  saveData();

  purchaseForm.reset();
  initializeDates();
  updateStats();
  renderCustomerTable();

  showToast("Purchase added successfully!", "success");
  animateCard(".purchase-form-section");
});

// Payment Form Submit
paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const payment = {
    id: generateId(),
    customerId: document.getElementById("paymentCustomer").value,
    amount: parseFloat(document.getElementById("paymentAmount").value),
    date: document.getElementById("paymentDate").value,
    createdAt: new Date().toISOString(),
  };

  payments.push(payment);
  saveData();

  paymentForm.reset();
  initializeDates();
  updateStats();
  renderCustomerTable();

  showToast("Payment recorded successfully!", "success");
  animateCard(".payment-form-section");
});

// Update customer selects
function updateCustomerSelects() {
  const options = customers
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
  const defaultOption = '<option value="">-- Select Customer --</option>';

  purchaseCustomerSelect.innerHTML = defaultOption + options;
  paymentCustomerSelect.innerHTML = defaultOption + options;
}

// Render customer table
function renderCustomerTable() {
  let filteredCustomers = [...customers];

  // Search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredCustomers = filteredCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm) ||
        c.phone.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm),
    );
  }

  // Sort
  const sortBy = sortSelect.value;
  switch (sortBy) {
    case "name":
      filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "date":
      filteredCustomers.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      break;
    case "remainder":
      filteredCustomers.sort((a, b) => {
        const remainderA = calculateCustomerRemainder(a.id);
        const remainderB = calculateCustomerRemainder(b.id);
        return remainderB - remainderA;
      });
      break;
  }

  if (filteredCustomers.length === 0) {
    customerTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No customers found</p>
                </td>
            </tr>
        `;
    return;
  }

  customerTableBody.innerHTML = filteredCustomers
    .map((customer) => {
      const customerPurchases = purchases.filter(
        (p) => p.customerId === customer.id,
      );
      const customerPayments = payments.filter(
        (p) => p.customerId === customer.id,
      );

      const totalSpent = customerPurchases.reduce(
        (sum, p) => sum + p.quantity * p.price,
        0,
      );
      const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainder = totalSpent - totalPaid;

      const remainderClass =
        remainder > 0 ? "remainder-positive" : "remainder-zero";
      const remainderText = remainder > 0 ? formatCurrency(remainder) : "Paid";

      return `
            <tr>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.phone}</td>
                <td>${customerPurchases.length}</td>
                <td>${formatCurrency(totalSpent)}</td>
                <td>${formatCurrency(totalPaid)}</td>
                <td class="${remainderClass}">${remainderText}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="viewPurchaseHistory('${customer.id}')">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");
}

// Calculate customer remainder
function calculateCustomerRemainder(customerId) {
  const customerPurchases = purchases.filter(
    (p) => p.customerId === customerId,
  );
  const customerPayments = payments.filter((p) => p.customerId === customerId);

  const totalSpent = customerPurchases.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0,
  );
  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

  return totalSpent - totalPaid;
}

// View purchase history
window.viewPurchaseHistory = function (customerId) {
  const customer = customers.find((c) => c.id === customerId);
  const customerPurchases = purchases.filter(
    (p) => p.customerId === customerId,
  );
  const customerPayments = payments.filter((p) => p.customerId === customerId);

  const totalSpent = customerPurchases.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0,
  );
  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainder = totalSpent - totalPaid;

  const purchasesHTML =
    customerPurchases.length > 0
      ? `
        <h4><i class="fas fa-shopping-cart"></i> Purchases</h4>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${customerPurchases
                  .map(
                    (p) => `
                    <tr>
                        <td>${p.item}</td>
                        <td>${p.quantity}</td>
                        <td>${formatCurrency(p.price)}</td>
                        <td>${formatCurrency(p.quantity * p.price)}</td>
                        <td>${formatDate(p.date)}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        <p><strong>Total Purchases: ${formatCurrency(totalSpent)}</strong></p>
    `
      : "<p>No purchases found.</p>";

  const paymentsHTML =
    customerPayments.length > 0
      ? `
        <h4 style="margin-top: 20px;"><i class="fas fa-money-bill-wave"></i> Payments</h4>
        <table>
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${customerPayments
                  .map(
                    (p) => `
                    <tr>
                        <td>${formatCurrency(p.amount)}</td>
                        <td>${formatDate(p.date)}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        <p><strong>Total Paid: ${formatCurrency(totalPaid)}</strong></p>
    `
      : "<p>No payments recorded.</p>";

  document.getElementById("purchaseHistoryContent").innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3><i class="fas fa-user"></i> ${customer.name}</h3>
            <p><i class="fas fa-phone"></i> ${customer.phone}</p>
            ${customer.email ? `<p><i class="fas fa-envelope"></i> ${customer.email}</p>` : ""}
        </div>
        ${purchasesHTML}
        ${paymentsHTML}
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4><i class="fas fa-calculator"></i> Summary</h4>
            <p><strong>Total Spent: ${formatCurrency(totalSpent)}</strong></p>
            <p><strong>Total Paid: ${formatCurrency(totalPaid)}</strong></p>
            <p class="${remainder > 0 ? "remainder-positive" : "remainder-zero"}">
                <strong>Remainder: ${formatCurrency(remainder)}</strong>
            </p>
        </div>
    `;

  purchaseModal.style.display = "block";
  animateModal();
};

// Delete customer
window.deleteCustomer = function (customerId) {
  if (
    confirm(
      "Are you sure you want to delete this customer? All associated purchases and payments will also be deleted.",
    )
  ) {
    customers = customers.filter((c) => c.id !== customerId);
    purchases = purchases.filter((p) => p.customerId !== customerId);
    payments = payments.filter((p) => p.customerId !== customerId);

    saveData();
    updateStats();
    renderCustomerTable();
    updateCustomerSelects();

    showToast("Customer deleted successfully!", "info");
  }
};

// Format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Close modal
closeModal.addEventListener("click", () => {
  purchaseModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === purchaseModal) {
    purchaseModal.style.display = "none";
  }
});

// Search input
searchInput.addEventListener("input", () => {
  renderCustomerTable();
});

// Sort select
sortSelect.addEventListener("change", () => {
  renderCustomerTable();
});

// Toast notification
function showToast(message, type = "info") {
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    info: "fas fa-info-circle",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "fadeInUp 0.3s ease reverse";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Animate card
function animateCard(selector) {
  const card = document.querySelector(selector);
  if (card) {
    card.style.animation = "none";
    card.offsetHeight; // Trigger reflow
    card.style.animation = "pulse 0.5s ease";
  }
}

// Animate modal
function animateModal() {
  const modalContent = document.querySelector(".modal-content");
  modalContent.style.animation = "none";
  modalContent.offsetHeight;
  modalContent.style.animation = "slideInDown 0.3s ease";
}

// Export data to CSV
function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent +=
    "Name,Phone,Email,Total Purchases,Total Spent,Total Paid,Remainder\n";

  customers.forEach((customer) => {
    const customerPurchases = purchases.filter(
      (p) => p.customerId === customer.id,
    );
    const customerPayments = payments.filter(
      (p) => p.customerId === customer.id,
    );

    const totalSpent = customerPurchases.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0,
    );
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainder = totalSpent - totalPaid;

    csvContent += `"${customer.name}","${customer.phone}","${customer.email}",${customerPurchases.length},${totalSpent},${totalPaid},${remainder}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "customer_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Data exported successfully!", "success");
}

// Clear all data
function clearAllData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This action cannot be undone.",
    )
  ) {
    customers = [];
    purchases = [];
    payments = [];
    saveData();
    updateStats();
    renderCustomerTable();
    updateCustomerSelects();
    showToast("All data cleared!", "info");
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Escape to close modal
  if (e.key === "Escape" && purchaseModal.style.display === "block") {
    purchaseModal.style.display = "none";
  }
});
