"""
Addis Bank -- Account Management System
Day 7: Linear Structures & Big-O (V4)

Adds:
  - A transaction-history stack per account (LIFO -- undo the newest first)
  - AccountRegistry: a dict-based lookup so finding an account by number
    is O(1) instead of scanning a list one by one
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
        self.history.append(f"deposit {amount:,.2f}")   # push onto the stack

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.__balance:
            raise ValueError("Insufficient funds")
        self.__balance -= amount
        self.history.append(f"withdraw {amount:,.2f}")   # push onto the stack
        if amount > 1000:
            self._notify(
                f"Large withdrawal of {amount:,.2f} ETB from {self.owner}'s account"
            )

    def undo_last(self):
        """Pop the most recent transaction and reverse it."""
        if not self.history:
            print(f"   No transactions to undo for {self.owner}")
            return
        last = self.history.pop()   # take the newest one, off the top
        kind, amount_str = last.split()
        amount = float(amount_str.replace(",", ""))
        if kind == "deposit":
            self.__balance -= amount
        elif kind == "withdraw":
            self.__balance += amount
        print(f"   Undid: {last} for {self.owner}")

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
        self.history.append(f"withdraw {amount:,.2f}")
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

    print("All accounts (via registry):")
    registry.list_all()

    print("\nO(1) lookup by number:")
    found = registry.find("CBE-1003")
    found.statement()

    print("\nUndo the last transaction on Almaz's account:")
    almaz.undo_last()
    almaz.statement()
