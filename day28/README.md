# Day 28 — State & Events: useState

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program.

## What Today Covered

Components stop being static drawings and start responding to people. Today revises `useState`, event handling, controlled inputs, and lifting state up — building directly on the Day 27 menu.

## Key Concepts

### State vs Props
- **Props** come from outside a component and can never be changed by it
- **State** is a value the component owns, can change, and remembers between renders
- Changing state tells React to render the component again — that's what updates the screen
- A plain variable doesn't work: it's recreated on every render, and changing it never tells React to redraw

### useState
- Returns exactly two items you destructure: the current value and a setter function — `const [count, setCount] = useState(0)`
- The argument passed in is the initial value, used only on the first render
- Always name the pair `x` / `setX`
- Call `useState` at the top level only — never inside an `if`, a loop, or a nested function

### Handling Events
- Events are wired onto JSX elements as camelCase props (`onClick`, `onChange`, `onSubmit`) with a real function as the value, not a string
- Pass the function itself (`onClick={handleClick}`), never call it (`onClick={handleClick()}`)
- To pass an argument, wrap it in an arrow function: `onClick={() => addToOrder(dish.price)}`
- Common events: `onClick`, `onChange`, `onSubmit`, `onKeyDown`, `onMouseEnter`, `onFocus`/`onBlur`
- The event object is passed to every handler; `event.target.value` reads an input's current text; `event.preventDefault()` stops a form's default full-page reload

### Controlled Inputs
- A controlled input takes its value from state and reports every keystroke back through `onChange`
- State becomes the single source of truth for the form
- Supplying `value` without `onChange` gives a read-only field and a console warning
- Multiple fields can share one state object — give each input a `name` attribute and update just that key with `setForm({ ...form, [name]: value })`
- Never mutate state directly (`form.phone = value` breaks React's change detection) — always build a new object
- Anything derivable from state (like whether a phone number is valid) should be computed on the fly, not stored separately

### Lifting State Up
- State is private to the component that declares it, and data only flows down
- When sibling components need the same value, move the state to their closest common parent
- The parent passes the value down to whoever displays it, and the setter down to whoever changes it
- Children stay stateless and simple
- Put state in the lowest component that contains everyone who needs it — too low and siblings can't reach it, too high and unrelated parts re-render for nothing

## Mini-Project: The Interactive Addis Eats Menu

Turned yesterday's static menu into a working ordering screen — no DOM manipulation anywhere, only state:

- **Dish** — owns a `count` state with an "Add" button that increases it
- **Menu** — owns the `category` state and derives the filtered list from it; also holds the running order total
- **CategoryBar** — stateless, receives `selected` and `onSelect` as props; renders chips from an array with the active one styled differently
- **DishList** — renders the filtered dishes with stable `id` keys and an empty-state message
- **OrderForm** — a controlled form (name, phone, area) using one state object and one change handler
- **TeleBirr validation** — the phone number is checked live against `/^(?:\+251|0)9\d{8}$/`, with the submit button disabled until it passes
