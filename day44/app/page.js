export const metadata = {
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return (
    <main>
      <h1>Addis Eats</h1>
      <p>Discover Ethiopian food in Addis Ababa.</p>
      <p><a href="/menu">Browse the menu</a></p>
    </main>
  );
}
