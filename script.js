// --- CONFIG & DATA ---
const API_URL = "https://api.jsonbin.io/v3/b/689cc622ae596e708fc94eda"
const API_KEY = "$2a$10$zMkN5phpFeYKOMzUjhoJHeWQy6.z6cCuX/HZEUOOB7w9rh6lXZ4T2"
const APP_KEY = "lolipop"

const historyLength = 15

const defaultShopItems = {
    "Hobby": [
        { id: 'h1', name: '10 min Meditando', cost: 0 },
        { id: 'h2', name: '10 min Desenhando', cost: 2 }
    ],
    "Entertainment": [
        { id: 'e1', name: '1 Episódio de Anime', cost: 6 },
        { id: 'e2', name: 'Barzinho', cost: 60 }
    ],
    "Travel": [
        { id: 't1', name: 'Praia', cost: 2500 },
    ],
    "Food": [
        { id: 'f1', name: 'Monster', cost: 8 },
        { id: 'f2', name: 'Cerveja', cost: 8 },
        { id: 'f3', name: 'iFood', cost: 50 }
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

const saveData = async () => {
    try {
        await fetch(`${API_URL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-ACCESS-KEY': API_KEY },
            body: JSON.stringify({
                xpHistory,
                shopItems: shopItemsData
            })
        });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
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

    const recentHistory = xpHistory.slice(-historyLength).reverse();

    recentHistory.forEach((entry, index) => {
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
            <button class="delete-btn" data-index="${xpHistory.length - 1 - index}">Delete</button>
        `;
        historyList.appendChild(li);
    });

    // Adicionar listener para deletar
    historyList.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;

        const idx = parseInt(btn.dataset.index);
        const confirmed = confirm(`Confirme deleção do registro: "${xpHistory[idx].description}"?`);
        if (!confirmed) return;

        xpHistory.splice(idx, 1);
        await saveData();
        await updateUI();
    });
};

const renderShop = async () => {
    shopItemsContainer.innerHTML = '';
    const sortedCategories = Object.keys(shopItemsData).sort();

    for (const category of sortedCategories) {
        if (shopItemsData[category].length === 0) continue;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'shop-category';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'shop-category-header';
        categoryHeader.style.cursor = 'pointer';
        categoryHeader.style.display = 'flex';
        categoryHeader.style.alignItems = 'center';
        categoryHeader.style.gap = '8px'; // espaço entre seta e nome

        // Setinha inicial (fechada)
        const arrow = document.createElement('span');
        arrow.className = 'category-arrow';
        arrow.textContent = '►'; // fechada

        const title = document.createElement('span');
        title.textContent = category;
        title.style.fontWeight = 'bold';

        categoryHeader.appendChild(arrow);
        categoryHeader.appendChild(title);
        categoryDiv.appendChild(categoryHeader);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'shop-items-container';

        shopItemsData[category].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="shop-item-name">${item.name}</span>
                    <span class="shop-item-cost">${item.cost} XP</span>
                </div>
                <div class="shop-item-actions">
                    <button class="buy-btn" data-item-id="${item.id}" data-category="${category}" ${xpBalance < item.cost ? 'disabled' : ''}>Buy</button>
                    <button class="edit-btn" data-item-id="${item.id}" data-category="${category}">Edit</button>
                    <button class="delete-btn" data-item-id="${item.id}" data-category="${category}">Delete</button>
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
        });


        categoryDiv.appendChild(itemsContainer);
        shopItemsContainer.appendChild(categoryDiv);

        // Inicialmente, categorias recolhidas
        itemsContainer.style.display = 'none';

        // Toggle ao clicar no header
        categoryHeader.addEventListener('click', () => {
            const isHidden = itemsContainer.style.display === 'none';
            itemsContainer.style.display = isHidden ? 'block' : 'none';
            arrow.textContent = isHidden ? '▼' : '►';
        });
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
    await saveData();
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
    } else if (button.classList.contains('edit-btn')) {
        await handleEditItem(itemId, category);
    }
    else if (button.classList.contains('delete-btn')) {
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
        await saveData();
        await updateUI();
    } else {
        alert("Not enough XP!");
    }
};

const handleEditItem = async (itemId, category) => {
    const item = shopItemsData[category].find(i => i.id === itemId);
    if (!item) return;

    const newName = prompt('Edit item name:', item.name);
    if (newName === null) return; // cancelou

    const newCostStr = prompt('Edit item cost:', item.cost);
    if (newCostStr === null) return;

    const newCost = parseInt(newCostStr);
    if (isNaN(newCost) || newCost <= 0) {
        alert('Invalid cost!');
        return;
    }

    item.name = newName.trim();
    item.cost = newCost;
    await saveData();
    await updateUI();
};


const handleDeleteItem = async (itemId, category) => {
    if (!shopItemsData[category]) return;

    const item = shopItemsData[category].find(i => i.id === itemId);
    if (!item) return;
    const confirmed = window.confirm(`Confirme deleção de "${item.name}" da categoria "${category}"?`);
    if (!confirmed) return;

    shopItemsData[category] = shopItemsData[category].filter(i => i.id !== itemId);
    if (shopItemsData[category].length === 0) delete shopItemsData[category];
    await saveData();
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
    await saveData();
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
                await saveData();
                await saveData();
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
