"""
Addis Bank -- Account Management System
Day 6: SOLID Principles & Design Patterns

Built on top of Day 5's Account family (Account, SavingsAccount,
CurrentAccount). This version adds:

  - AlertService, split out of Account (Single Responsibility)
  - subscribe() / _notify() on Account, with SMSAlert as an observer
    (Observer pattern -- Account never knows who's listening)
  - AccountFactory.create(kind, ...), so callers open accounts by
    name instead of importing/calling concrete classes directly
    (Open/Closed -- new account types plug in without editing callers)
"""


class AlertService:
    """Owns the single job of deciding how alerts get delivered."""

    def notify(self, message):
        print(f"ALERT: {message}")


def SMSAlert(message):
    """An observer -- just a function that reacts to Account's broadcast."""
    print(f"[SMS] {message}")


class Account:
    """A single bank account with an encapsulated, self-protecting balance."""

    def __init__(self, owner, number, balance=0, alert_service=None):
        self.owner = owner
        self.account_number = number
        self.__balance = balance
        self.alert_service = alert_service or AlertService()
        self._observers = []          # subscribers for the Observer pattern

    @property
    def balance(self):
        return self.__balance

    def subscribe(self, observer):
        """Register something that wants to know about large withdrawals."""
        self._observers.append(observer)

    def _notify(self, message):
        """Tell every subscriber, one by one -- without knowing what they are."""
        for observer in self._observers:
            observer(message)

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.__balance += amount

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.__balance:
            raise ValueError("Insufficient funds")
        self.__balance -= amount
        if amount > 1000:
            self._notify(
                f"Large withdrawal of {amount:,.2f} ETB from {self.owner}'s account"
            )

    def statement(self):
        print(f"{self.owner} | {self.account_number} | {self.balance:,.2f} ETB")


class SavingsAccount(Account):
    """An Account that also earns interest."""

    def __init__(self, owner, number, balance=0, rate=0.05, alert_service=None):
        super().__init__(owner, number, balance, alert_service)
        self.rate = rate

    def add_interest(self):
        interest = self.balance * self.rate
        self.deposit(interest)   # reuse the parent's validated deposit()

    def statement(self):        # override to label the type
        print(f"[Savings] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (rate: {self.rate:.0%})")


class CurrentAccount(Account):
    """An Account that allows withdrawing into a fixed overdraft limit."""

    def __init__(self, owner, number, balance=0, overdraft=1000, alert_service=None):
        super().__init__(owner, number, balance, alert_service)
        self.overdraft = overdraft

    def withdraw(self, amount):   # override -- different rule than Account
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.balance + self.overdraft:
            raise ValueError("Over overdraft limit")
        self._Account__balance -= amount   # name-mangled parent attribute
        if amount > 1000:
            self._notify(
                f"Large withdrawal of {amount:,.2f} ETB from {self.owner}'s account"
            )

    def statement(self):          # override to label the type
        print(f"[Current] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (overdraft limit: {self.overdraft:,.2f} ETB)")


class AccountFactory:
    """Centralizes account creation -- callers ask for a type by name."""

    @staticmethod
    def create(kind, owner, number, balance=0, **kwargs):
        if kind == "savings":
            return SavingsAccount(owner, number, balance, **kwargs)
        elif kind == "current":
            return CurrentAccount(owner, number, balance, **kwargs)
        else:
            raise ValueError(f"Unknown account kind: {kind}")


if __name__ == "__main__":
    hanna = Account("Hanna Alemu", "CBE-1001", 1500)
    almaz = AccountFactory.create("savings", "Almaz Bekele", "CBE-1002", 1500, rate=0.05)
    dawit = AccountFactory.create("current", "Dawit Tesfaye", "CBE-1003", 800, overdraft=1000)

    dawit.subscribe(SMSAlert)   # attach the observer

    almaz.add_interest()
    dawit.withdraw(1500)        # over 1000 -> SMSAlert fires

    print("Polymorphic statement loop:")
    for acc in [hanna, almaz, dawit]:
        acc.statement()

    print()
    try:
        dawit.withdraw(10000)
    except ValueError as e:
        print(f"Blocked over-limit withdrawal: {e}")
