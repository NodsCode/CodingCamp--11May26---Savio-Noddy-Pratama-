const STORAGE_KEY = 'expense_visualizer_transactions';
const THEME_KEY = 'expense_visualizer_theme';

const form = document.getElementById('transactionForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const customCategoryInput = document.getElementById('customCategory');
const formError = document.getElementById('formError');
const transactionList = document.getElementById('transactionList');
const totalBalance = document.getElementById('totalBalance');
const sortBy = document.getElementById('sortBy');
const themeToggle = document.getElementById('themeToggle');

let transactions = loadTransactions();
let spendingChart;

initializeTheme();
renderAll();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const itemName = itemNameInput.value.trim();
  const amount = Number(amountInput.value);
  const selectedCategory = categorySelect.value;
  const customCategory = customCategoryInput.value.trim();
  const category = customCategory || selectedCategory;

  if (!itemName || !amountInput.value || !category) {
    formError.textContent = 'Please fill in all required fields.';
    return;
  }

  formError.textContent = '';
  transactions.unshift({
    id: crypto.randomUUID(),
    itemName,
    amount,
    category,
    createdAt: Date.now()
  });

  saveTransactions();
  renderAll();
  form.reset();
});

sortBy.addEventListener('change', renderList);

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function renderAll() {
  renderBalance();
  renderList();
  renderChart();
}

function renderBalance() {
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  totalBalance.textContent = `$${total.toFixed(2)}`;
}

function renderList() {
  transactionList.innerHTML = '';
  const sorted = [...transactions];

  switch (sortBy.value) {
    case 'amountAsc':
      sorted.sort((a, b) => a.amount - b.amount);
      break;
    case 'amountDesc':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
    default:
      sorted.sort((a, b) => b.createdAt - a.createdAt);
  }

  if (sorted.length === 0) {
    transactionList.innerHTML = '<li class="item-meta">No transactions yet.</li>';
    return;
  }

  sorted.forEach((tx) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(tx.itemName)}</strong>
        <div class="item-meta">$${tx.amount.toFixed(2)} • ${escapeHtml(tx.category)}</div>
      </div>
      <button class="delete-btn" data-id="${tx.id}" type="button">Delete</button>
    `;

    li.querySelector('.delete-btn').addEventListener('click', () => {
      transactions = transactions.filter((item) => item.id !== tx.id);
      saveTransactions();
      renderAll();
    });

    transactionList.appendChild(li);
  });
}

function renderChart() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach((tx) => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(totals).filter((cat) => totals[cat] > 0);
  const values = labels.map((cat) => totals[cat]);

  if (spendingChart) {
    spendingChart.destroy();
  }

  spendingChart = new Chart(document.getElementById('spendingChart'), {
    type: 'pie',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: ['#4f46e5', '#0ea5e9', '#f59e0b', '#22c55e', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️ Light Mode';
  }
}

function escapeHtml(text) {
  const temp = document.createElement('div');
  temp.textContent = text;
  return temp.innerHTML;
}