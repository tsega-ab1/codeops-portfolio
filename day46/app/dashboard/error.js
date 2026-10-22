"use client"; // error boundaries must be client components

export default function Error({ error, reset }) {
  return (
    <main className="mx-auto max-w-6xl p-6" role="alert">
      <h1 className="text-2xl font-bold">The dashboard could not load</h1>
      <p className="mt-2 text-gray-600">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 min-h-11 rounded-lg bg-[#1B4D8E] px-4 text-white"
      >
        Try again
      </button>
    </main>
  );
}
