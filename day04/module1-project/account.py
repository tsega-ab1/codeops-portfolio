"""
Addis Bank -- Account Management System
Module 1 Project (V2 — Day 5): Inheritance, Polymorphism & Abstraction

Account is the base class. SavingsAccount and CurrentAccount extend it,
reusing deposit(), the balance property, and statement() where possible,
and overriding what needs to differ.
"""


class Account:
    """A single bank account with an encapsulated, self-protecting balance."""

    def __init__(self, owner, number, balance=0):
        self.owner = owner
        self.account_number = number
        self.__balance = balance

    @property
    def balance(self):
        return self.__balance

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

    def statement(self):
        print(f"{self.owner} | {self.account_number} | {self.balance:,.2f} ETB")


class SavingsAccount(Account):
    """An Account that also earns interest."""

    def __init__(self, owner, number, balance=0, rate=0.05):
        super().__init__(owner, number, balance)   # reuse parent setup
        self.rate = rate                            # new attribute

    def add_interest(self):
        interest = self.balance * self.rate
        self.deposit(interest)   # reuse the parent's deposit()

    def statement(self):        # override to label the type
        print(f"[Savings] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (rate: {self.rate:.0%})")


class CurrentAccount(Account):
    """An Account that allows withdrawing into a fixed overdraft limit."""

    def __init__(self, owner, number, balance=0, overdraft=1000):
        super().__init__(owner, number, balance)
        self.overdraft = overdraft

    def withdraw(self, amount):   # override -- different rule than Account
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.balance + self.overdraft:
            raise ValueError("Over overdraft limit")
        # name-mangled access to the parent's private balance, since this
        # account's withdraw rule is different from Account's
        self._Account__balance -= amount

    def statement(self):          # override to label the type
        print(f"[Current] {self.owner} | {self.account_number} | "
              f"{self.balance:,.2f} ETB (overdraft limit: {self.overdraft:,.2f} ETB)")


if __name__ == "__main__":
    # One base account, one savings, one current
    hanna = Account("Hanna Alemu", "CBE-1001", 1500)
    almaz = SavingsAccount("Almaz Bekele", "CBE-1002", 1500, rate=0.05)
    dawit = CurrentAccount("Dawit Tesfaye", "CBE-1003", 800, overdraft=1000)

    almaz.add_interest()          # Savings-only behaviour
    dawit.withdraw(1500)          # goes into overdraft, allowed

    # Polymorphism: one loop, three different statement() behaviours
    print("Polymorphic statement loop:")
    for acc in [hanna, almaz, dawit]:
        acc.statement()

    print()
    # Prove the overdraft limit is actually enforced
    try:
        dawit.withdraw(10000)
    except ValueError as e:
        print(f"Blocked over-limit withdrawal: {e}")
