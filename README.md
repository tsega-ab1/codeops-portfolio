# CodeOps Portfolio

This repository holds my work for the IBT College Canada CodeOps program.

**Name:** Tsegaye Abate

# Addis Bank — Account Management System

A Python banking system built incrementally across Module 1 of the CodeOps
Full Stack Software Development program (IBT College Canada). Each day's
folder contains that day's practice exercises, plus a snapshot of the bank
project as it stood after that day's lesson — so the project's growth is
visible day by day.

## How to run

Every day's project lives at `dayXX/module1-project/account.py`. Each file
is self-contained and runnable on its own:

```bash
cd day09/module1-project
python3 account.py
```

Each `practice.py` is also runnable standalone:

```bash
cd day09
python3 practice.py
```

No external dependencies — everything uses Python's standard library
(`abc`, `heapq`, `collections`).

## What each day added

| Day | Practice topic | Project addition |
|-----|-----------------|-------------------|
| 03 | Collections, files & error handling | — |
| 04 | Classes, objects & encapsulation | `Account` — encapsulated `__balance`, `@property`, validated `deposit()`/`withdraw()` |
| 05 | Inheritance, polymorphism & abstraction | `SavingsAccount` and `CurrentAccount` extend `Account`; polymorphic `statement()` loop |
| 06 | SOLID principles & design patterns | `AlertService` (Single Responsibility), Observer pattern (`subscribe`/`_notify`), `AccountFactory` (Open/Closed) |
| 07 | Linear structures & Big-O | `AccountRegistry` — dict-based O(1) lookup by account number; per-account transaction-history stack |
| 08 | Recursion, searching & sorting | `top_by_balance()` (leaderboard via `sorted()`), `find_by_number()` (real binary search), `total_transactions()` (recursive sum) |
| 09 | Trees, graphs & heaps | `Branch` — recursive tree of sub-branches with `total_balance()`; `bfs()` over a transfers graph; heap-based payment priority queue |

## Design decisions

- **Encapsulation**: `Account.__balance` is private and only ever changes
  through `deposit()`/`withdraw()`, which validate every input — the object
  can never end up in an invalid state.
- **Inheritance & polymorphism**: `SavingsAccount`/`CurrentAccount` reuse
  `Account`'s constructor via `super()`, and override `statement()` and
  `withdraw()` where their behavior genuinely differs. A single loop can
  drive every account type without checking what type it is.
- **SOLID**: alert logic is split out of `Account` into its own class
  (`AlertService`) so `Account` has exactly one job — managing money.
  New account types are added by writing a new class, not editing existing
  code (`AccountFactory`).
- **Data structures matched to the problem**: a dict for instant lookup by
  account number, a stack for "undo the most recent transaction," a graph
  for "who can this account reach through transfers," and a heap for
  "process the most urgent payment first, regardless of arrival order."

## One thing I'd improve with more time

Add a persistent storage layer (currently everything lives in memory and
resets each run) — likely a `AccountRepository` class following the same
Single Responsibility split already used for alerts, so `Account` still
never has to know *how* it gets saved.

## Repository structure

```
day03/practice.py
day04/practice.py
day04/module1-project/account.py
day05/practice.py
day05/module1-project/account.py
day06/practice.py
day06/module1-project/account.py
day07/practice.py
day07/module1-project/account.py
day08/practice.py
day08/module1-project/account.py
day09/practice.py
day09/module1-project/account.py
```
