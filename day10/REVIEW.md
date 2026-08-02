# Day 10 — Module 1 Review & Exam Prep

No new project code today. This day was spent reviewing Days 1–9 and
polishing the repository (README.md added, project structure confirmed
clean, each day's account.py re-run end to end to confirm no errors).

## Self-test recap

1. Four pillars — encapsulation (private __balance), inheritance
   (SavingsAccount/CurrentAccount extend Account), polymorphism (one
   statement() loop, three behaviors), abstraction (ABC + @abstractmethod).
2. Patterns — Singleton (one shared BankConfig), Factory (create accounts
   by name), Observer (subscribe/_notify, decoupled alerts).
3. Big-O fastest to slowest: O(1) < O(log n) < O(n) < O(n log n) < O(n^2)
4. Dict is O(1) via hashing (jumps straight to the slot); list is O(n)
   (scans item by item).
5. Binary search needs sorted data; O(log n).
6. In-order traversal (Left -> Node -> Right) returns a BST in sorted
   order, because everything smaller lives left and everything bigger
   lives right at every node.
7. Branch hierarchy -> tree (recursive total_balance); transfer network
   -> graph (bfs); payment urgency -> heap (heapq).

Ready for the assessment.
