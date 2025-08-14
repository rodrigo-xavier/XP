// --- CONFIG & DATA ---
const API_URL = "https://api.jsonbin.io/v3/b/689cc622ae596e708fc94eda"
const API_KEY = "$2a$10$zMkN5phpFeYKOMzUjhoJHeWQy6.z6cCuX/HZEUOOB7w9rh6lXZ4T2"
const APP_KEY = "lolipop"

const defaultShopItems = {
    "Hobby": [
        { id: 'h1', name: '10 minutes of Meditation', cost: 10 },
        { id: 'h2', name: '10 minutes of Drawing', cost: 10 }
    ],
    "Entertainment": [
        { id: 'e1', name: 'Watch 1 episode of Anime', cost: 25 },
        { id: 'e2', name: 'Go out to a bar', cost: 150 }
    ],
    "Travel": [
        { id: 't1', name: 'Travel to the beach', cost: 300 },
        { id: 't2', name: 'Travel to another city', cost: 1000 }
    ],
    "Food": [
        { id: 'f1', name: 'Monster Energy Drink', cost: 20 },
        { id: 'f2', name: 'Beer', cost: 30 },
        { id: 'f3', name: 'Buy food from iFood', cost: 50 }
    ]
};

let shopItemsData = {};
let xpHistory = [];
let xpBalance = 0;
let totalXpAcquired = 0;

// --- DOM ELEMENTS ---
const passwordOverlay = document.getElementById('password-overlay');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const lockedContent = document.querySelectorAll('.locked');

const totalXpAcquiredEl = document.getElementById('total-xp-acquired');
const totalXpBalanceEl = document.getElementById('total-xp-balance');
const addXpForm = document.getElementById('add-xp-form');
const xpAmountInput = document.getElementById('xp-amount');
const xpDescriptionInput = document.getElementById('xp-description');
const shopItemsContainer = document.getElementById('shop-items');
const historyList = document.getElementById('history-list');
const addItemForm = document.getElementById('add-item-form');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');

// --- LOCAL STORAGE ---
const loadData = async () => {
    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: { 'X-ACCESS-KEY': API_KEY },
        });

        if (!response.ok) throw new Error('Erro ao carregar dados da API');

        const data = await response.json();
        xpHistory = data.record?.xpHistory || [];
        shopItemsData = data.record?.shopItems || JSON.parse(JSON.stringify(defaultShopItems));
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        shopItemsData = JSON.parse(JSON.stringify(defaultShopItems));
    }
};

const updateXpHistory = async () => {
    try {
        await fetch(`${API_URL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-ACCESS-KEY': API_KEY },
            body: JSON.stringify({ xpHistory })
        });
    } catch (error) {
        console.error('Erro ao salvar XP:', error);
    }
};

const updateShopItems = async () => {
    try {
        await fetch(`${API_URL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-ACCESS-KEY': API_KEY },
            body: JSON.stringify({ shopItems: shopItemsData })
        });
    } catch (error) {
        console.error('Erro ao salvar shop items:', error);
    }
};

// --- RENDER FUNCTIONS ---
const calculateXpValues = async () => {
    xpBalance = xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
    totalXpAcquired = xpHistory
        .filter(entry => entry.amount > 0)
        .reduce((sum, entry) => sum + entry.amount, 0);
};

const renderXpValues = async () => {
    totalXpAcquiredEl.textContent = totalXpAcquired;
    totalXpBalanceEl.textContent = xpBalance;
};

const renderHistory = async () => {
    historyList.innerHTML = '';
    if (xpHistory.length === 0) {
        historyList.innerHTML = '<li>No XP history yet. Go earn some!</li>';
        return;
    }

    [...xpHistory].reverse().forEach(entry => {
        const li = document.createElement('li');
        const type = entry.amount > 0 ? 'earn' : 'spend';
        li.className = type;

        const date = new Date(entry.date).toLocaleString();
        li.innerHTML = `
            <div class="history-details">
                <span class="history-description">${entry.description}</span>
                <span class="history-date">${date}</span>
            </div>
            <span class="history-amount ${type}">
                ${entry.amount > 0 ? '+' : ''}${entry.amount} XP
            </span>
        `;
        historyList.appendChild(li);
    });
};

const renderShop = async () => {
    shopItemsContainer.innerHTML = '';
    const sortedCategories = Object.keys(shopItemsData).sort();

    for (const category of sortedCategories) {
        if (shopItemsData[category].length === 0) continue;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'shop-category';

        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);

        shopItemsData[category].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="shop-item-name">${item.name}</span>
                    <span class="shop-item-cost">${item.cost} XP</span>
                </div>
                <div class="shop-item-actions">
                     <button class="buy-btn" data-item-id="${item.id}" ${xpBalance < item.cost ? 'disabled' : ''}>Buy</button>
                     <button class="delete-btn" data-item-id="${item.id}" data-category="${category}">Delete</button>
                </div>
            `;
            categoryDiv.appendChild(itemDiv);
        });
        shopItemsContainer.appendChild(categoryDiv);
    }
};

const updateUI = async () => {
    await calculateXpValues();
    await renderXpValues();
    await renderHistory();
    await renderShop();
};

// --- EVENT HANDLERS ---
const handleAddXp = async (e) => {
    e.preventDefault();
    const amount = parseInt(xpAmountInput.value);
    const description = xpDescriptionInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !description) {
        alert('Please enter a valid amount and description.');
        return;
    }

    xpHistory.push({ amount, description, date: new Date().toISOString() });
    await updateXpHistory();
    await updateUI();
    addXpForm.reset();
};

const handleShopAction = async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const itemId = button.dataset.itemId;
    const category = button.dataset.category;
    if (!itemId || !category) return;

    if (button.classList.contains('buy-btn')) {
        await handleBuyItem(itemId);
    } else if (button.classList.contains('delete-btn')) {
        await handleDeleteItem(itemId, category);
    }
};

const handleBuyItem = async (itemId) => {
    let item;
    for (const category in shopItemsData) {
        const found = shopItemsData[category].find(i => i.id === itemId);
        if (found) { item = found; break; }
    }

    if (!item) return;

    if (xpBalance >= item.cost) {
        xpHistory.push({ amount: -item.cost, description: `Bought: ${item.name}`, date: new Date().toISOString() });
        await updateXpHistory();
        await updateUI();
    } else {
        alert("Not enough XP!");
    }
};

const handleDeleteItem = async (itemId, category) => {
    if (!shopItemsData[category]) return;
    shopItemsData[category] = shopItemsData[category].filter(item => item.id !== itemId);
    if (shopItemsData[category].length === 0) delete shopItemsData[category];
    await updateShopItems();
    await updateUI();
};

const handleAddItem = async (e) => {
    e.preventDefault();
    const name = e.target.elements['item-name'].value.trim();
    const cost = parseInt(e.target.elements['item-cost'].value);
    const category = e.target.elements['item-category'].value.trim();

    if (!name || isNaN(cost) || cost <= 0 || !category) {
        alert('Please fill out all fields for the new item.');
        return;
    }

    if (!shopItemsData[category]) shopItemsData[category] = [];

    shopItemsData[category].push({ id: crypto.randomUUID(), name, cost });
    await updateShopItems();
    await updateUI();
    addItemForm.reset();
};

// --- PASSWORD PROTECTION ---
const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordInput.value === APP_KEY) {
        passwordOverlay.style.display = 'none';
        lockedContent.forEach(el => el.classList.remove('locked'));
    } else {
        passwordError.style.visibility = 'visible';
        passwordInput.value = '';
        passwordInput.focus();
        if (window.navigator.vibrate) window.navigator.vibrate(200);
        passwordForm.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300, iterations: 1 });
    }
};

// --- DATA MANAGEMENT ---
const exportData = async () => {
    const dataToExport = { xpHistory, shopItems: shopItemsData };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xp-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        if (importedData.xpHistory && importedData.shopItems) {
            if (confirm('This will overwrite your current data. Are you sure?')) {
                xpHistory = importedData.xpHistory;
                shopItemsData = importedData.shopItems;
                await updateXpHistory();
                await updateShopItems();
                await updateUI();
            }
        } else alert('Invalid data file. Must contain xpHistory and shopItems.');
    } catch (error) {
        alert('Error reading file. Make sure it is a valid JSON file.');
        console.error("Import error:", error);
    } finally {
        importFileInput.value = '';
    }
};

// --- INITIALIZATION ---
const init = async () => {
    try {
        await loadData();
        await updateUI();

        addXpForm.addEventListener('submit', async (e) => await handleAddXp(e));
        shopItemsContainer.addEventListener('click', async (e) => await handleShopAction(e));
        addItemForm.addEventListener('submit', async (e) => await handleAddItem(e));
        exportDataBtn.addEventListener('click', async () => await exportData());
        importDataBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', async (e) => await importData(e));
        passwordForm.addEventListener('submit', async (e) => await handlePasswordSubmit(e));
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
};

init();
