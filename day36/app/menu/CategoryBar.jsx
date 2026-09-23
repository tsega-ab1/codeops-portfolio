const categories = ["All", "Main", "Vegan", "Grill"];

export default function CategoryBar() {
  return (
    <div className="flex gap-2 my-4">
      {categories.map((c) => (
        <span key={c} className="rounded-full border px-3 py-1 text-sm">
          {c}
        </span>
      ))}
    </div>
  );
}
