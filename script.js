// --- CONFIG & DATA ---
const apiUrl = "API_URL";
const apiKey = "API_KEY";
const appKey = "APP_KEY";

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
// Carregar dados da API
const loadData = async () => {
    try {
        const response = await fetch(`${apiUrl}`, {
            method: 'GET',
            headers: {
                'X-ACCESS-KEY': apiKey
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar dados da API');

        const data = await response.json();

        xpHistory = data.xpHistory || [];
        shopItemsData = data.shopItems || JSON.parse(JSON.stringify(defaultShopItems));
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        shopItemsData = JSON.parse(JSON.stringify(defaultShopItems)); // fallback
    }
};

// Salvar XP na API
const saveXpHistory = async () => {
    try {
        await fetch(`${apiUrl}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-ACCESS-KEY': apiKey
            },
            body: JSON.stringify({
                xpHistory,
                shopItems: shopItemsData
            })
        });
    } catch (error) {
        console.error('Erro ao salvar XP:', error);
    }
};

// --- RENDER FUNCTIONS ---
const calculateXpValues = () => {
    xpBalance = xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
    totalXpAcquired = xpHistory
        .filter(entry => entry.amount > 0)
        .reduce((sum, entry) => sum + entry.amount, 0);
};

const renderXpValues = () => {
    totalXpAcquiredEl.textContent = totalXpAcquired;
    totalXpBalanceEl.textContent = xpBalance;
};

const renderHistory = () => {
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

const renderShop = () => {
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

const updateUI = () => {
    calculateXpValues();
    renderXpValues();
    renderHistory();
    renderShop(); // Re-render shop to update button states
};

// --- EVENT HANDLERS ---
const handleAddXp = (e) => {
    e.preventDefault();
    const amount = parseInt(xpAmountInput.value);
    const description = xpDescriptionInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !description) {
        alert('Please enter a valid amount and description.');
        return;
    }

    xpHistory.push({
        amount,
        description,
        date: new Date().toISOString()
    });
    
    saveXpHistory();
    updateUI();

    addXpForm.reset();
};

const handleShopAction = (e) => {
    const target = e.target;
    const itemId = target.dataset.itemId;
    if (!itemId) return;

    if (target.classList.contains('buy-btn')) {
        handleBuyItem(itemId);
    } else if (target.classList.contains('delete-btn')) {
        const category = target.dataset.category;
        handleDeleteItem(itemId, category);
    }
};

const handleBuyItem = (itemId) => {
    let item;
    
    for (const category in shopItemsData) {
        const found = shopItemsData[category].find(i => i.id === itemId);
        if (found) {
            item = found;
            break;
        }
    }

    if (!item) return;

    if (xpBalance >= item.cost) {
        xpHistory.push({
            amount: -item.cost,
            description: `Bought: ${item.name}`,
            date: new Date().toISOString()
        });
        saveXpHistory();
        updateUI();
    } else {
        alert("Not enough XP!");
    }
};

const handleDeleteItem = (itemId, category) => {
    if (!shopItemsData[category]) return;

    shopItemsData[category] = shopItemsData[category].filter(item => item.id !== itemId);
    
    // Optional: remove category if it becomes empty
    if (shopItemsData[category].length === 0) {
        delete shopItemsData[category];
    }

    saveShopItems();
    updateUI();
};

const handleAddItem = (e) => {
    e.preventDefault();
    const name = e.target.elements['item-name'].value.trim();
    const cost = parseInt(e.target.elements['item-cost'].value);
    const category = e.target.elements['item-category'].value.trim();

    if (!name || isNaN(cost) || cost <= 0 || !category) {
        alert('Please fill out all fields for the new item.');
        return;
    }

    if (!shopItemsData[category]) {
        shopItemsData[category] = [];
    }

    const newItem = {
        id: crypto.randomUUID(),
        name,
        cost,
    };

    shopItemsData[category].push(newItem);
    saveShopItems();
    updateUI();
    addItemForm.reset();
};

// --- PASSWORD PROTECTION ---
const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.value === appKey) {
        passwordOverlay.style.display = 'none';
        lockedContent.forEach(el => el.classList.remove('locked'));
    } else {
        passwordError.style.visibility = 'visible';
        passwordInput.value = '';
        passwordInput.focus();
        // Vibrate and shake for feedback
        if (window.navigator.vibrate) window.navigator.vibrate(200);
        passwordForm.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 300,
            iterations: 1
        });
    }
};

// --- DATA MANAGEMENT ---
const exportData = () => {
    const dataToExport = {
        xpHistory,
        shopItems: shopItemsData
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xp-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            if (importedData.xpHistory && importedData.shopItems) {
                if (confirm('This will overwrite your current data. Are you sure?')) {
                    xpHistory = importedData.xpHistory;
                    shopItemsData = importedData.shopItems;
                    saveXpHistory();
                    saveShopItems();
                    updateUI();
                }
            } else {
                alert('Invalid data file. Make sure it contains xpHistory and shopItems.');
            }
        } catch (error) {
            alert('Error reading file. Make sure it is a valid JSON file.');
            console.error("Import error:", error);
        } finally {
            // Reset file input to allow importing the same file again
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
};

// --- INITIALIZATION ---
const init = () => {
    loadData();
    updateUI();

    addXpForm.addEventListener('submit', handleAddXp);
    shopItemsContainer.addEventListener('click', handleShopAction);
    addItemForm.addEventListener('submit', handleAddItem);
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    // Password protection
    passwordForm.addEventListener('submit', handlePasswordSubmit);
};

init();