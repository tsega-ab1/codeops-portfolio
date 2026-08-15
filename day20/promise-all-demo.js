// Day 20 exercise: fetch a list, then fetch details for the first two
// items in parallel using Promise.all.
// Run with: node promise-all-demo.js

async function loadFirstTwoUsers() {
  const listRes = await fetch("https://jsonplaceholder.typicode.com/users");
  if (!listRes.ok) throw new Error("Could not fetch user list");
  const users = await listRes.json();

  const firstTwoIds = users.slice(0, 2).map(u => u.id);

  const details = await Promise.all(
    firstTwoIds.map(id =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then(res => {
        if (!res.ok) throw new Error(`Could not fetch user ${id}`);
        return res.json();
      })
    )
  );

  details.forEach(u => console.log(`${u.name} — ${u.email}`));
}

loadFirstTwoUsers().catch(err => console.log("Error:", err.message));
