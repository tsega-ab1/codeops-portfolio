import SearchBox from "./SearchBox";
import PaginatedMenu from "./PaginatedMenu";

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-4xl font-bold">Addis Eats Menu</h1>
      <p className="mb-8 text-gray-600">Search for your favorite Ethiopian dishes.</p>

      <SearchBox />

      <hr className="my-10" />

      <h2 className="mb-4 text-2xl font-bold">Browse by Page</h2>
      <PaginatedMenu />
    </main>
  );
}
