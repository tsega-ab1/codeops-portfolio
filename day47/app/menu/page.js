import MenuBrowser from "@/components/MenuBrowser";
import { searchDishes } from "@/lib/dishes";

export const metadata = {
  title: "Menu",
  description:
    "Explore Doro Wat, Tibs, Kitfo, Shiro and other Ethiopian dishes available from Addis Eats.",
  alternates: { canonical: "/menu" }
};

export default async function MenuPage() {
  // Server renders page 1, so the menu is in the HTML crawlers and phones receive.
  const initialData = await searchDishes({ page: 1 });

  return (
    <section>
      <h1>Addis Eats Menu</h1>
      <p>Explore Ethiopian dishes available for delivery across Addis Ababa.</p>
      <MenuBrowser initialData={initialData} />
    </section>
  );
}
