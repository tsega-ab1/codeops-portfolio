"""
Addis Bank -- Account Management System
Day 9: Trees, Graphs & Heaps (V6)

Adds:
  - Branch: a tree of sub-branches and accounts, with a recursive
    total_balance() that sums a branch and everything nested beneath it
  - bfs(transfers, start): breadth-first search over a transfers graph,
    finding every account reachable from a starting account
  - AccountRegistry.pay_bills(): a heap-based priority queue so the most
    urgent payments (lowest priority number) always process first
"""

import heapq
from collections import deque


class AlertService:
    def notify(self, message):
        print(f"ALERT: {message}")


def SMSAlert(message):
    print(f"[SMS] {message}")


class Account:
    def __init__(self, owner, number, balance=0, alert_service=None):
        self.owner = owner
        self.account_number = number
        self.__balance = balance
        self.alert_service = alert_service or AlertService()
        self._observers = []
        self.history = []

    @property
    def balance(self):
        return self.__balance

    def subscribe(self, observer):
        self._observers.append(observer)

    def _notify(self, message):
        for observer in self._observers:
            observer(message)

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.__balance += amount
        self.history.append(amount)

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.__balance:
            raise ValueError("Insufficient funds")
        self.__balance -= amount
        self.history.append(-amount)
        if amount > 1000:
            self._notify(
                f"Large withdrawal of {amount:,.2f} ETB from {self.owner}'s account"
            )

    def undo_last(self):
        if not self.history:
            print(f"   No transactions to undo for {self.owner}")
            return
        last = self.history.pop()
        self.__balance -= last
        print(f"   Undid transaction of {last:,.2f} ETB for {self.owner}")

    def total_transactions(self):
        def _sum(items):
            if len(items) == 0:
                return 0
            return items[0] + _sum(items[1:])
        return _sum(self.history)

    def statement(self):
        print(f"{self.owner} | {self.account_number} | {self.balance:,.2f} ETB")


class SavingsAccount(Account):
    def __init__(self, owner, number, balance=0, rate=0.05, alert_service=None):
        super().__init__(owner, number, balance, alert_service)
        self.rate = rate

    def add_interest(self):
        interest = self.balance * self.rate
        self.deposit(interest)

    def statement(self):
        print(f"[Savings] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (rate: {self.rate:.0%})")


class CurrentAccount(Account):
    def __init__(self, owner, number, balance=0, overdraft=1000, alert_service=None):
        super().__init__(owner, number, balance, alert_service)
        self.overdraft = overdraft

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.balance + self.overdraft:
            raise ValueError("Over overdraft limit")
        self._Account__balance -= amount
        self.history.append(-amount)
        if amount > 1000:
            self._notify(
                f"Large withdrawal of {amount:,.2f} ETB from {self.owner}'s account"
            )

    def statement(self):
        print(f"[Current] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (overdraft limit: {self.overdraft:,.2f} ETB)")


class AccountFactory:
    @staticmethod
    def create(kind, owner, number, balance=0, **kwargs):
        if kind == "savings":
            return SavingsAccount(owner, number, balance, **kwargs)
        elif kind == "current":
            return CurrentAccount(owner, number, balance, **kwargs)
        else:
            raise ValueError(f"Unknown account kind: {kind}")


class AccountRegistry:
    def __init__(self):
        self._accounts = {}
        self._payment_queue = []   # heap: (priority, description)

    def add(self, account):
        self._accounts[account.account_number] = account

    def find(self, number):
        return self._accounts.get(number)

    def list_all(self):
        for number in sorted(self._accounts):
            self._accounts[number].statement()

    def top_by_balance(self, n):
        all_accounts = list(self._accounts.values())
        ranked = sorted(all_accounts, key=lambda acc: acc.balance, reverse=True)
        return ranked[:n]

    def find_by_number(self, number):
        sorted_numbers = sorted(self._accounts.keys())
        low, high = 0, len(sorted_numbers) - 1
        while low <= high:
            mid = (low + high) // 2
            mid_number = sorted_numbers[mid]
            if mid_number == number:
                return self._accounts[mid_number]
            elif mid_number < number:
                low = mid + 1
            else:
                high = mid - 1
        return None

    def queue_payment(self, priority, description):
        """Lower priority number = more urgent (rent=1 beats snacks=3)."""
        heapq.heappush(self._payment_queue, (priority, description))

    def process_payments(self):
        """Process every queued payment, most urgent first."""
        print("   Processing payments by urgency:")
        while self._payment_queue:
            priority, description = heapq.heappop(self._payment_queue)
            print(f"     Processing: {description} (priority {priority})")


class Branch:
    """A tree node -- a bank branch that can hold accounts and sub-branches."""

    def __init__(self, name):
        self.name = name
        self.accounts = []       # leaves at this level
        self.sub_branches = []   # children -- nested branches

    def add_account(self, account):
        self.accounts.append(account)

    def add_sub_branch(self, branch):
        self.sub_branches.append(branch)

    def total_balance(self):
        """Recursive -- sum this branch's own accounts, plus every child branch."""
        total = sum(acc.balance for acc in self.accounts)   # this level's accounts
        for child in self.sub_branches:
            total += child.total_balance()                  # recurse into children
        return total


def bfs(graph, start):
    """Level-by-level exploration -- who is reachable from `start`, and in what order."""
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        current = queue.popleft()
        order.append(current)
        for neighbour in graph.get(current, []):
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)
    return order


if __name__ == "__main__":
    registry = AccountRegistry()

    hanna = Account("Hanna Alemu", "CBE-1001", 1500)
    almaz = AccountFactory.create("savings", "Almaz Bekele", "CBE-1002", 1500, rate=0.05)
    dawit = AccountFactory.create("current", "Dawit Tesfaye", "CBE-1003", 800, overdraft=1000)

    registry.add(hanna)
    registry.add(almaz)
    registry.add(dawit)

    almaz.add_interest()

    # ---------------- Branch tree ----------------
    print("Branch hierarchy (tree):")
    addis_main = Branch("Addis Ababa Main")
    bole_sub = Branch("Bole Sub-Branch")
    piassa_sub = Branch("Piassa Sub-Branch")

    addis_main.add_account(hanna)
    bole_sub.add_account(almaz)
    piassa_sub.add_account(dawit)

    addis_main.add_sub_branch(bole_sub)
    addis_main.add_sub_branch(piassa_sub)

    print(f"   Total balance across Addis Main + all sub-branches: "
          f"{addis_main.total_balance():,.2f} ETB")

    # ---------------- Transfers graph ----------------
    print("\nTransfers graph (BFS):")
    transfers = {
        "CBE-1002": ["CBE-1003"],       # Almaz paid Dawit
        "CBE-1003": ["CBE-1001"],       # Dawit paid Hanna
        "CBE-1001": [],
    }
    reachable = bfs(transfers, "CBE-1002")
    print(f"   Reachable from CBE-1002: {reachable}")

    # ---------------- Payment priority queue ----------------
    print("\nPayment priority queue (heap):")
    registry.queue_payment(3, "Snacks")
    registry.queue_payment(1, "Rent")
    registry.queue_payment(2, "Electricity")
    registry.process_payments()
