export default function SignOutButton() {
  return (
    <form action="/api/signout" method="post">
      <button type="submit">Sign out</button>
    </form>
  );
}
