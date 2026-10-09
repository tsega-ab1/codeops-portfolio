const dishes = [
  {
    id: "kitfo",
    name: "Kitfo",
    price: 320,
    summary: "Minced beef mixed with mitmita and Ethiopian spices.",
    image: "/images/kitfo.jpg"
  },
  {
    id: "doro-wat",
    name: "Doro Wat",
    price: 450,
    summary: "Spicy Ethiopian chicken stew served with injera.",
    image: "/images/doro-wat.jpg"
  },
  {
    id: "tibs",
    name: "Tibs",
    price: 380,
    summary: "Sautéed beef with onions, peppers and Ethiopian spices.",
    image: "/images/tibs.jpg"
  },
  {
    id: "shiro",
    name: "Shiro",
    price: 220,
    summary: "Silky chickpea stew simmered with berbere and garlic.",
    image: "/images/shiro.jpg"
  }
];

export async function getDishes() {
  return dishes;
}

export async function getDish(id) {
  return dishes.find((dish) => dish.id === id);
}
