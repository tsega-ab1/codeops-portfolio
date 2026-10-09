import SearchBox from "./SearchBox";
import PaginatedMenu from "./PaginatedMenu";
import TanStackMenu from "./TanStackMenu";
import CartCount from "./CartCount";

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-4xl font-bold">Addis Eats Menu</h1>
      <p className="mb-8 text-gray-600">Search for your favorite Ethiopian dishes.</p>

      <SearchBox />

      <hr className="my-10" />
      <h2 className="mb-4 text-2xl font-bold">Browse by Page (SWR)</h2>
      <PaginatedMenu />

      <hr className="my-10" />
      <h2 className="mb-4 text-2xl font-bold">Quick Order (TanStack Query)</h2>
      <CartCount />
      <TanStackMenu />
    </main>
  );
}
