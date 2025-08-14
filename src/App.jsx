import { useEffect, useState } from "react";

const defaultShopItems = {
  Hobby: [
    { id: "h1", name: "10 minutes of Meditation", cost: 10 },
    { id: "h2", name: "10 minutes of Drawing", cost: 10 },
  ],
  Entertainment: [
    { id: "e1", name: "Watch 1 episode of Anime", cost: 25 },
    { id: "e2", name: "Go out to a bar", cost: 150 },
  ],
  Travel: [
    { id: "t1", name: "Travel to the beach", cost: 300 },
    { id: "t2", name: "Travel to another city", cost: 1000 },
  ],
  Food: [
    { id: "f1", name: "Monster Energy Drink", cost: 20 },
    { id: "f2", name: "Beer", cost: 30 },
    { id: "f3", name: "Buy food from iFood", cost: 50 },
  ],
};

const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const appKey = import.meta.env.VITE_APP_KEY;

export default function App() {
  const [xpHistory, setXpHistory] = useState([]);
  const [shopItemsData, setShopItemsData] = useState(defaultShopItems);
  const [xpBalance, setXpBalance] = useState(0);
  const [totalXpAcquired, setTotalXpAcquired] = useState(0);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // --- API ---
  const loadData = async () => {
    try {
      const res = await fetch(apiUrl, {
        headers: { "X-ACCESS-KEY": apiKey },
      });
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const data = await res.json();
      setXpHistory(data.xpHistory || []);
      setShopItemsData(data.shopItems || defaultShopItems);
    } catch (err) {
      console.error(err);
      setShopItemsData(defaultShopItems);
    }
  };

  const saveData = async (history = xpHistory, shop = shopItemsData) => {
    try {
      await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-ACCESS-KEY": apiKey,
        },
        body: JSON.stringify({ xpHistory: history, shopItems: shop }),
      });
    } catch (err) {
      console.error("Erro ao salvar", err);
    }
  };

  // --- Atualiza valores sempre que xpHistory mudar ---
  useEffect(() => {
    const balance = xpHistory.reduce((sum, e) => sum + e.amount, 0);
    const acquired = xpHistory
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    setXpBalance(balance);
    setTotalXpAcquired(acquired);
  }, [xpHistory]);

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---
  const handleAddXp = (e) => {
    e.preventDefault();
    const form = e.target;
    const amount = parseInt(form.amount.value);
    const description = form.description.value.trim();
    if (isNaN(amount) || !description) return;
    const newHistory = [
      ...xpHistory,
      { amount, description, date: new Date().toISOString() },
    ];
    setXpHistory(newHistory);
    saveData(newHistory, shopItemsData);
    form.reset();
  };

  const handleBuyItem = (item) => {
    if (xpBalance < item.cost) return alert("Not enough XP!");
    const newHistory = [
      ...xpHistory,
      {
        amount: -item.cost,
        description: `Bought: ${item.name}`,
        date: new Date().toISOString(),
      },
    ];
    setXpHistory(newHistory);
    saveData(newHistory, shopItemsData);
  };

  const handleDeleteItem = (category, id) => {
    const updated = {
      ...shopItemsData,
      [category]: shopItemsData[category].filter((i) => i.id !== id),
    };
    setShopItemsData(updated);
    saveData(xpHistory, updated);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const cost = parseInt(form.cost.value);
    const category = form.category.value.trim();
    if (!name || isNaN(cost) || !category) return;
    const updated = {
      ...shopItemsData,
      [category]: [
        ...(shopItemsData[category] || []),
        { id: crypto.randomUUID(), name, cost },
      ],
    };
    setShopItemsData(updated);
    saveData(xpHistory, updated);
    form.reset();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === appKey) {
      setUnlocked(true);
    } else {
      alert("Senha incorreta");
      setPassword("");
    }
  };

  return (
    <div className="p-4">
      {!unlocked ? (
        <form onSubmit={handlePasswordSubmit}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
          />
          <button type="submit">Entrar</button>
        </form>
      ) : (
        <>
          <h1>XP Tracker</h1>
          <p>Total XP: {totalXpAcquired}</p>
          <p>Saldo XP: {xpBalance}</p>

          <form onSubmit={handleAddXp}>
            <input name="amount" type="number" placeholder="XP" />
            <input name="description" placeholder="Descrição" />
            <button>Adicionar XP</button>
          </form>

          <h2>Histórico</h2>
          <ul>
            {[...xpHistory].reverse().map((entry, i) => (
              <li key={i}>
                {entry.description} - {entry.amount} XP (
                {new Date(entry.date).toLocaleString()})
              </li>
            ))}
          </ul>

          <h2>Loja</h2>
          {Object.keys(shopItemsData).map((cat) => (
            <div key={cat}>
              <h3>{cat}</h3>
              {shopItemsData[cat].map((item) => (
                <div key={item.id}>
                  {item.name} - {item.cost} XP{" "}
                  <button onClick={() => handleBuyItem(item)}>Comprar</button>
                  <button onClick={() => handleDeleteItem(cat, item.id)}>
                    Deletar
                  </button>
                </div>
              ))}
            </div>
          ))}

          <form onSubmit={handleAddItem}>
            <input name="name" placeholder="Nome" />
            <input name="cost" type="number" placeholder="Custo XP" />
            <input name="category" placeholder="Categoria" />
            <button>Adicionar Item</button>
          </form>
        </>
      )}
    </div>
  );
}
