"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <p>Something went wrong loading the menu.</p>
      <button onClick={() => reset()} className="underline">
        Try again
      </button>
    </div>
  );
}
