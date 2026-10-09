export const PAGE_SIZE = 4;

const dishes = [
  { id: "kitfo", name: "Kitfo", price: 320, summary: "Minced beef mixed with mitmita and Ethiopian spices.", image: "/images/kitfo.svg" },
  { id: "doro-wat", name: "Doro Wat", price: 450, summary: "Spicy Ethiopian chicken stew served with injera.", image: "/images/doro-wat.svg" },
  { id: "tibs", name: "Tibs", price: 380, summary: "Sautéed beef with onions, peppers and Ethiopian spices.", image: "/images/tibs.svg" },
  { id: "shiro", name: "Shiro", price: 220, summary: "Silky chickpea stew simmered with berbere and garlic.", image: "/images/shiro.svg" },
  { id: "firfir", name: "Firfir", price: 260, summary: "Shredded injera tossed in spicy berbere sauce.", image: "/images/firfir.svg" },
  { id: "beyaynetu", name: "Beyaynetu", price: 300, summary: "A fasting platter of lentils, greens and vegetable stews.", image: "/images/beyaynetu.svg" },
  { id: "dulet", name: "Dulet", price: 340, summary: "Minced tripe, liver and beef sautéed with chili and butter.", image: "/images/dulet.svg" },
  { id: "genfo", name: "Genfo", price: 240, summary: "Warm barley porridge served with spiced butter and berbere.", image: "/images/genfo.svg" }
];

export async function getDishes() {
  return dishes;
}

export async function getDish(id) {
  return dishes.find((dish) => dish.id === id);
}

export async function searchDishes({ q = "", page = 1 } = {}) {
  const term = q.trim().toLowerCase();
  const matches = term
    ? dishes.filter((d) => `${d.name} ${d.summary}`.toLowerCase().includes(term))
    : dishes;

  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * PAGE_SIZE;

  return {
    items: matches.slice(start, start + PAGE_SIZE),
    total: matches.length,
    page: current,
    pages
  };
}
