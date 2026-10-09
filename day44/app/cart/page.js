export const metadata = {
  title: "Cart",
  robots: { index: false, follow: false }
};

export default function CartPage() {
  return (
    <main>
      <h1>Your cart</h1>
      <p>Private page: not indexed, not in the sitemap.</p>
    </main>
  );
}
