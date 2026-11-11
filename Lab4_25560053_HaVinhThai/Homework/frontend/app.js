// app.js - ShopAdmin Web UI
// Every create/edit/delete control is shown to every logged-in user on purpose:
// permissions are enforced by the backend, and the UI simply displays the error it returns.

const API_BASE = window.APP_CONFIG.API_BASE;
const API_ORIGIN = new URL(API_BASE).origin;

const state = {
    token: null,
    user: null,
    categories: [],
    products: []
};

const $ = (id) => document.getElementById(id);

// ============================================================
// Helpers
// ============================================================

// Accept both MongoDB (_id) and SQL (id) style identifiers
const getId = (obj) => (obj && typeof obj === 'object' ? (obj.id ?? obj._id) : obj);

// Accept both { data: ... } envelopes and bare JSON bodies
const unwrap = (body) => (body && typeof body === 'object' && 'data' in body ? body.data : body);

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Call the API. Adds the JWT, parses JSON, throws ApiError on non-2xx responses.
async function api(path, { method = 'GET', body, auth = true } = {}) {
    const headers = {};
    if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

    let payload = body;
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(API_BASE + path, { method, headers, body: payload });
    } catch (err) {
        throw new ApiError(0, `Cannot reach the API at ${API_BASE}. Is the backend running? (see DevTools Console)`);
    }

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null; // Not JSON (e.g. an HTML error page)
    }

    if (!response.ok) {
        const message = (data && (data.message || data.error)) || response.statusText || 'Request failed';
        // Token missing/expired on a protected call -> back to the login screen
        if (response.status === 401 && auth && state.token) {
            logout();
            throw new ApiError(401, 'Your session has expired. Please log in again.');
        }
        throw new ApiError(response.status, message);
    }
    return data;
}

// Read the payload of a JWT (no verification - that's the server's job)
function decodeToken(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch {
        return {};
    }
}

function toast(message, type = 'success', title = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    if (title) {
        const strong = document.createElement('strong');
        strong.textContent = title;
        el.appendChild(strong);
    }
    el.appendChild(document.createTextNode(message));
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), type === 'error' ? 6000 : 3000);
}

const STATUS_TEXT = {
    0: 'Network error', 400: 'Bad request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not found', 409: 'Conflict', 413: 'Payload too large', 500: 'Server error'
};

function showError(err) {
    console.error(err);
    const status = err.status ?? 0;
    const title = status ? `${status} ${STATUS_TEXT[status] || 'Error'}` : STATUS_TEXT[0];
    toast(err.message, 'error', title);
}

function formatPrice(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('en-US') : '–';
}

// Absolute URL for an avatar, or a generated placeholder with the user's initial
function avatarSrc(user) {
    const url = user && user.avatarUrl;
    if (url) return /^https?:\/\//.test(url) ? url : API_ORIGIN + (url.startsWith('/') ? '' : '/') + url;

    const initial = ((user && user.fullName) || '?').trim().charAt(0).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#c7d2fe"/>
        <text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial" font-size="44" fill="#4338ca">${initial}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function formToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
}

// ============================================================
// Session
// ============================================================

function saveSession(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    if ($('modal').open) $('modal').close();
    showAuthView();
}

async function loadMe() {
    const body = await api('/auth/me');
    state.user = unwrap(body);
    renderUser();
}

// ============================================================
// Views
// ============================================================

function showAuthView() {
    $('appView').hidden = true;
    $('authView').hidden = false;
}

async function showAppView() {
    $('authView').hidden = true;
    $('appView').hidden = false;
    renderUser();
    showPage('products');
    await loadCategories();
    await loadProducts();
}

function renderUser() {
    const user = state.user || {};
    // Role comes from the user object, falling back to the JWT payload
    const role = user.type || decodeToken(state.token || '').type || 'normal';

    $('headerName').textContent = user.fullName || user.email || 'User';
    $('headerRole').textContent = role;
    $('headerRole').className = 'role-badge' + (role === 'admin' ? ' admin' : '');
    $('headerAvatar').src = avatarSrc(user);
    $('profileAvatar').src = avatarSrc(user);

    const form = $('profileForm');
    form.fullName.value = user.fullName ?? '';
    form.age.value = user.age ?? '';
    form.gender.value = user.gender ?? 'male';
    form.email.value = user.email ?? '';
    form.type.value = role;
}

function showPage(page) {
    document.querySelectorAll('.page').forEach((el) => { el.hidden = el.id !== `page-${page}`; });
    document.querySelectorAll('.nav-link').forEach((el) => {
        el.classList.toggle('active', el.dataset.page === page);
    });
}

// ============================================================
// Categories
// ============================================================

async function loadCategories() {
    try {
        const body = await api('/categories');
        state.categories = unwrap(body) || [];
    } catch (err) {
        state.categories = [];
        showError(err);
    }
    renderCategories();
    renderCategoryFilter();
}

function categoryName(categoryRef) {
    // categoryId may be a plain id or a populated { id/_id, name } object
    if (categoryRef && typeof categoryRef === 'object' && categoryRef.name) return categoryRef.name;
    const found = state.categories.find((c) => String(getId(c)) === String(getId(categoryRef)));
    return found ? found.name : 'Unknown';
}

function renderCategories() {
    const tbody = $('categoryRows');
    tbody.innerHTML = '';

    $('categoryEmpty').hidden = state.categories.length > 0;
    $('categoryEmpty').textContent = 'No categories yet.';

    state.categories.forEach((category) => {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.textContent = category.name;
        tr.append(nameTd, actionsCell(
            () => openCategoryModal(category),
            () => deleteCategory(category)
        ));
        tbody.appendChild(tr);
    });
}

function renderCategoryFilter() {
    const select = $('productFilter');
    const current = select.value;
    select.innerHTML = '<option value="">All categories</option>';
    state.categories.forEach((c) => {
        const option = document.createElement('option');
        option.value = getId(c);
        option.textContent = c.name;
        select.appendChild(option);
    });
    // Keep the current filter if that category still exists
    select.value = state.categories.some((c) => String(getId(c)) === current) ? current : '';
}

function openCategoryModal(category) {
    const isEdit = Boolean(category);
    openModal({
        title: isEdit ? 'Edit category' : 'Add category',
        fields: [{ name: 'name', label: 'Name', type: 'text', value: category?.name ?? '', required: true }],
        onSubmit: async (values) => {
            if (isEdit) {
                await api(`/categories/${getId(category)}`, { method: 'PUT', body: values });
                toast('Category updated.');
            } else {
                await api('/categories', { method: 'POST', body: values });
                toast('Category created.');
            }
            await loadCategories();
            await loadProducts();
        }
    });
}

async function deleteCategory(category) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
        await api(`/categories/${getId(category)}`, { method: 'DELETE' });
        toast('Category deleted.');
        await loadCategories();
        await loadProducts();
    } catch (err) {
        showError(err);
    }
}

// ============================================================
// Products
// ============================================================

async function loadProducts() {
    const categoryId = $('productFilter').value;
    const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    try {
        const body = await api(`/products${query}`);
        state.products = unwrap(body) || [];
    } catch (err) {
        state.products = [];
        showError(err);
    }
    renderProducts();
}

function renderProducts() {
    const tbody = $('productRows');
    tbody.innerHTML = '';

    $('productEmpty').hidden = state.products.length > 0;
    $('productEmpty').textContent = $('productFilter').value
        ? 'No products in this category.'
        : 'No products yet.';

    state.products.forEach((product) => {
        const tr = document.createElement('tr');

        const name = document.createElement('td');
        name.textContent = product.name;

        const category = document.createElement('td');
        const pill = document.createElement('span');
        pill.className = 'category-pill';
        pill.textContent = categoryName(product.categoryId ?? product.category);
        category.appendChild(pill);

        const quantity = document.createElement('td');
        quantity.className = 'num';
        quantity.textContent = product.quantity;

        const price = document.createElement('td');
        price.className = 'num';
        price.textContent = formatPrice(product.price);

        tr.append(name, category, quantity, price, actionsCell(
            () => openProductModal(product),
            () => deleteProduct(product)
        ));
        tbody.appendChild(tr);
    });
}

function openProductModal(product) {
    const isEdit = Boolean(product);
    const categoryOptions = state.categories.map((c) => ({ value: getId(c), label: c.name }));
    const currentCategory = product ? getId(product.categoryId ?? product.category) : $('productFilter').value;

    openModal({
        title: isEdit ? 'Edit product' : 'Add product',
        fields: [
            { name: 'name', label: 'Name', type: 'text', value: product?.name ?? '', required: true },
            { name: 'categoryId', label: 'Category', type: 'select', options: categoryOptions, value: currentCategory, required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', value: product?.quantity ?? 0, min: 0, required: true },
            { name: 'price', label: 'Price', type: 'number', value: product?.price ?? 0, min: 0, step: 'any', required: true }
        ],
        onSubmit: async (values) => {
            const body = { ...values, quantity: Number(values.quantity), price: Number(values.price) };
            if (isEdit) {
                await api(`/products/${getId(product)}`, { method: 'PUT', body });
                toast('Product updated.');
            } else {
                await api('/products', { method: 'POST', body });
                toast('Product created.');
            }
            await loadProducts();
        }
    });
}

async function deleteProduct(product) {
    if (!confirm(`Delete product "${product.name}"?`)) return;
    try {
        await api(`/products/${getId(product)}`, { method: 'DELETE' });
        toast('Product deleted.');
        await loadProducts();
    } catch (err) {
        showError(err);
    }
}

// Edit / Delete buttons for a table row
function actionsCell(onEdit, onDelete) {
    const td = document.createElement('td');
    td.className = 'actions-col';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn-link edit';
    edit.textContent = 'Edit';
    edit.addEventListener('click', onEdit);
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-link delete';
    del.textContent = 'Delete';
    del.addEventListener('click', onDelete);
    td.append(edit, del);
    return td;
}

// ============================================================
// Modal
// ============================================================

let modalSubmitHandler = null;

function openModal({ title, fields, onSubmit }) {
    $('modalTitle').textContent = title;
    const container = $('modalFields');
    container.innerHTML = '';

    fields.forEach((field) => {
        const label = document.createElement('label');
        label.textContent = field.label;

        let input;
        if (field.type === 'select') {
            input = document.createElement('select');
            if (field.options.length === 0) {
                input.appendChild(new Option('No categories - create one first', ''));
            }
            field.options.forEach((opt) => input.appendChild(new Option(opt.label, opt.value)));
            if (field.value) input.value = field.value;
        } else {
            input = document.createElement('input');
            input.type = field.type;
            input.value = field.value;
            if (field.min !== undefined) input.min = field.min;
            if (field.step) input.step = field.step;
        }
        input.name = field.name;
        input.required = Boolean(field.required);
        label.appendChild(input);
        container.appendChild(label);
    });

    modalSubmitHandler = onSubmit;
    $('modal').showModal();
    container.querySelector('input, select')?.focus();
}

$('modalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = $('modalSubmit');
    submitBtn.disabled = true;
    try {
        await modalSubmitHandler(formToObject(e.target));
        $('modal').close();
    } catch (err) {
        showError(err); // Keep the modal open so the user can see what they typed
    } finally {
        submitBtn.disabled = false;
    }
});

$('modalCancel').addEventListener('click', () => $('modal').close());

// ============================================================
// Auth events
// ============================================================

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((el) => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });
    $('loginForm').hidden = tab !== 'login';
    $('registerForm').hidden = tab !== 'register';
}

document.querySelectorAll('.auth-tab').forEach((el) => {
    el.addEventListener('click', () => switchAuthTab(el.dataset.tab));
});

$('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const body = await api('/auth/login', { method: 'POST', body: formToObject(e.target), auth: false });
        const data = unwrap(body) || {};
        const token = data.token ?? data.accessToken ?? body.token;
        if (!token) throw new ApiError(0, 'Login response did not contain a token.');

        saveSession(token, data.user ?? body.user ?? null);
        if (!state.user) await loadMe(); // Backend didn't return the user -> ask for it
        e.target.reset();
        toast(`Welcome, ${state.user.fullName || state.user.email}!`);
        await showAppView();
    } catch (err) {
        showError(err);
    } finally {
        btn.disabled = false;
    }
});

$('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const values = formToObject(e.target);
        values.age = Number(values.age);
        await api('/auth/register', { method: 'POST', body: values, auth: false });
        toast('Account created. You can log in now.');
        e.target.reset();
        switchAuthTab('login');
        $('loginForm').email.value = values.email;
        $('loginForm').password.focus();
    } catch (err) {
        showError(err);
    } finally {
        btn.disabled = false;
    }
});

$('logoutBtn').addEventListener('click', () => {
    logout();
    toast('Logged out.');
});

// ============================================================
// App events
// ============================================================

$('nav').addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link) showPage(link.dataset.page);
});

$('productFilter').addEventListener('change', loadProducts);
$('addProductBtn').addEventListener('click', () => openProductModal(null));
$('addCategoryBtn').addEventListener('click', () => openCategoryModal(null));

$('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const body = {
            fullName: form.fullName.value,
            age: form.age.value === '' ? undefined : Number(form.age.value),
            gender: form.gender.value
        };
        await api('/users/me', { method: 'PUT', body });
        await loadMe();
        toast('Profile updated.');
    } catch (err) {
        showError(err);
    } finally {
        btn.disabled = false;
    }
});

$('avatarInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    $('avatarFileName').textContent = file ? file.name : 'JPG, PNG, WEBP up to 2MB';
    $('avatarBtn').disabled = !file;
    if (file) $('profileAvatar').src = URL.createObjectURL(file); // Local preview before upload
});

$('avatarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = $('avatarInput').files[0];
    if (!file) return;

    const btn = $('avatarBtn');
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        await api('/users/me/avatar', { method: 'POST', body: formData });
        await loadMe();
        toast('Avatar updated.');
    } catch (err) {
        renderUser(); // Revert the local preview
        showError(err);
    } finally {
        e.target.reset();
        $('avatarFileName').textContent = 'JPG, PNG, WEBP up to 2MB';
        btn.textContent = 'Upload avatar';
    }
});

// ============================================================
// Start
// ============================================================

(async function init() {
    const token = localStorage.getItem('token');
    if (!token) return showAuthView();

    state.token = token;
    try {
        await loadMe();
        await showAppView();
    } catch (err) {
        if (err.status !== 401) showError(err);
        logout();
    }
})();
