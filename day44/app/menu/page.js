import MenuSearch from "./MenuSearch";
import { getDishes } from "../lib/dishes";

export const metadata = {
  title: "Menu",
  description:
    "Explore Doro Wat, Tibs, Kitfo, Shiro and other Ethiopian dishes available from Addis Eats.",
  alternates: { canonical: "/menu" }
};

export default async function MenuPage() {
  const dishes = await getDishes();

  return (
    <main>
      <h1>Addis Eats Menu</h1>
      <p>Explore Ethiopian dishes available for delivery across Addis Ababa.</p>
      <MenuSearch dishes={dishes} />
    </main>
  );
}
