"use client";

export default function MenuError({ reset }) {
  return (
    <section>
      <h1>Something went wrong</h1>
      <p>We could not load the menu.</p>
      <button onClick={() => reset()}>Try again</button>
    </section>
  );
}
