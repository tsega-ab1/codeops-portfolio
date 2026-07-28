"""
Addis Bank -- Account Management System
Day 8: Recursion, Searching & Sorting (V5)

Adds to AccountRegistry:
  - top_by_balance(n): leaderboard using sorted() + key=
  - find_by_number(): binary search over sorted account numbers -- O(log n)
  - total_transactions(): recursive sum of a single account's history
"""


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
        self.history = []          # stack: newest transaction on top

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
        self.history.append(amount)          # store the signed amount now

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.__balance:
            raise ValueError("Insufficient funds")
        self.__balance -= amount
        self.history.append(-amount)         # negative -- a withdrawal
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
        """Recursive sum of this account's history -- same shape as recursive_sum()."""
        def _sum(items):
            if len(items) == 0:            # base case
                return 0
            return items[0] + _sum(items[1:])   # recursive case
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
    """The filing cabinet -- accounts stored in a dict for O(1) lookup by number."""

    def __init__(self):
        self._accounts = {}   # account_number -> Account object

    def add(self, account):
        self._accounts[account.account_number] = account

    def find(self, number):
        """O(1) -- goes straight to the right drawer, no scanning."""
        return self._accounts.get(number)

    def list_all(self):
        """Ordered listing -- sorted by account number for consistency."""
        for number in sorted(self._accounts):
            self._accounts[number].statement()

    def top_by_balance(self, n):
        """Leaderboard -- the n richest accounts, highest balance first."""
        all_accounts = list(self._accounts.values())
        ranked = sorted(all_accounts, key=lambda acc: acc.balance, reverse=True)
        return ranked[:n]

    def find_by_number(self, number):
        """Binary search over sorted account numbers -- O(log n) instead of scanning."""
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


if __name__ == "__main__":
    registry = AccountRegistry()

    hanna = Account("Hanna Alemu", "CBE-1001", 1500)
    almaz = AccountFactory.create("savings", "Almaz Bekele", "CBE-1002", 1500, rate=0.05)
    dawit = AccountFactory.create("current", "Dawit Tesfaye", "CBE-1003", 800, overdraft=1000)

    dawit.subscribe(SMSAlert)

    registry.add(hanna)
    registry.add(almaz)
    registry.add(dawit)

    almaz.add_interest()
    dawit.withdraw(1500)
    hanna.deposit(500)
    hanna.withdraw(200)

    print("All accounts (via registry):")
    registry.list_all()

    print("\nO(1) lookup by number:")
    found = registry.find("CBE-1003")
    found.statement()

    print("\nBinary search lookup by number:")
    found2 = registry.find_by_number("CBE-1001")
    found2.statement()

    print("\nLeaderboard -- top 2 by balance:")
    for acc in registry.top_by_balance(2):
        acc.statement()

    print("\nRecursive total of transactions (Hanna):")
    print(f"   Net change from history: {hanna.total_transactions():,.2f} ETB")
