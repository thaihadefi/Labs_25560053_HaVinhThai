const API_URL = 'http://localhost:5001/api/v1/products';

const tableBody = document.querySelector('#productTable tbody');
const form = document.getElementById('productForm');
const filterSelect = document.getElementById('categoryFilter');
const messageBox = document.getElementById('message');

let products = [];      // rows currently shown in the table
let editingId = null;   // id of the row being edited inline, if any

const formatPrice = (price) => new Intl.NumberFormat('en-US').format(price) + ' VND';

function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = type === 'success' ? 'alert success' : 'alert';
  if (type === 'success') setTimeout(hideMessage, 2500);
}

function hideMessage() {
  messageBox.className = 'alert hidden';
}

// Calls the API and throws an Error with the server's message on any 4xx/5xx
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
  return result;
}

// Fills the dropdown with the distinct categories of ALL products (not only the filtered ones)
async function loadCategories() {
  const result = await request(API_URL);
  const selected = filterSelect.value;
  const categories = [...new Set(result.data.map(p => p.category))].sort();

  filterSelect.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterSelect.appendChild(option);
  });
  // Keep the current choice if that category still exists
  filterSelect.value = categories.includes(selected) ? selected : '';
}

async function loadProducts() {
  const category = filterSelect.value;
  const url = category ? `${API_URL}?category=${encodeURIComponent(category)}` : API_URL;
  const result = await request(url);
  products = result.data;
  renderTable();
}

// Reloads both the dropdown and the table, showing any failure in the UI
async function refresh() {
  try {
    await loadCategories();
    await loadProducts();
  } catch (error) {
    products = [];
    renderTable();
    showMessage('Error fetching products: ' + error.message);
  }
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function inputCell(value, type = 'text') {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  td.appendChild(input);
  return { td, input };
}

function button(label, className, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = className;
  btn.addEventListener('click', onClick);
  return btn;
}

function renderTable() {
  tableBody.innerHTML = '';
  products.forEach(product => {
    const tr = document.createElement('tr');
    tr.appendChild(cell(product.id));
    const actions = document.createElement('td');

    if (product.id === editingId) {
      const name = inputCell(product.name);
      const price = inputCell(product.price, 'number');
      const category = inputCell(product.category);
      tr.append(name.td, price.td, category.td);
      actions.append(
        button('Save', 'btn-save', () => updateProduct(product.id, {
          name: name.input.value.trim(),
          price: price.input.value,
          category: category.input.value.trim()
        })),
        button('Cancel', 'btn-cancel', () => { editingId = null; renderTable(); })
      );
    } else {
      tr.append(cell(product.name), cell(formatPrice(product.price)), cell(product.category));
      actions.append(
        button('Edit', 'btn-edit', () => { editingId = product.id; renderTable(); }),
        button('Delete', 'btn-delete', () => deleteProduct(product.id))
      );
    }

    tr.appendChild(actions);
    tableBody.appendChild(tr);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = {
    name: document.getElementById('name').value.trim(),
    price: document.getElementById('price').value,
    category: document.getElementById('category').value.trim()
  };
  try {
    const result = await request(API_URL, { method: 'POST', body: JSON.stringify(body) });
    form.reset();
    showMessage(result.message, 'success');
    await refresh();
  } catch (error) {
    showMessage('Error adding product: ' + error.message);
  }
});

async function updateProduct(id, body) {
  try {
    const result = await request(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    editingId = null;
    showMessage(result.message, 'success');
    await refresh();
  } catch (error) {
    showMessage('Error updating product: ' + error.message);
  }
}

async function deleteProduct(id) {
  if (!confirm(`Delete product ID ${id}?`)) return;
  try {
    const result = await request(`${API_URL}/${id}`, { method: 'DELETE' });
    showMessage(result.message, 'success');
    await refresh();
  } catch (error) {
    showMessage('Error deleting product: ' + error.message);
  }
}

filterSelect.addEventListener('change', async () => {
  try {
    hideMessage();
    await loadProducts();
  } catch (error) {
    showMessage('Error fetching products: ' + error.message);
  }
});

refresh();
