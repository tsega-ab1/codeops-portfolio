"""
Addis Bank -- Account Management System
Module 1 Project: Classes, Objects & Encapsulation (V1)

This is the seed of the larger project. Today it's a single, well-encapsulated
Account class. Later it becomes the parent of SavingsAccount and
CurrentAccount via inheritance -- so keep this file clean, it gets extended,
not rewritten.
"""


class Account:
    """A single bank account with an encapsulated, self-protecting balance."""

    def __init__(self, owner, number, balance=0):
        self.owner = owner                  # public
        self.account_number = number        # public
        self.__balance = balance            # private -- only changes via methods below

    @property
    def balance(self):
        """Read-only view of the balance. No direct edits from outside."""
        return self.__balance

    def deposit(self, amount):
        """Add money to the account. Rejects non-positive amounts."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.__balance += amount

    def withdraw(self, amount):
        """Remove money from the account. Rejects non-positive amounts and overdrafts."""
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.__balance:
            raise ValueError("Insufficient funds")
        self.__balance -= amount

    def statement(self):
        """Print a one-line summary: owner, account number, balance in ETB."""
        print(f"{self.owner} | {self.account_number} | {self.__balance:,.2f} ETB")


if __name__ == "__main__":
    almaz = Account("Almaz Bekele", "CBE-1001", 1500)
    dawit = Account("Dawit Tesfaye", "CBE-1002", 800)

    almaz.deposit(500)
    almaz.withdraw(200)
    dawit.deposit(1000)

    almaz.statement()
    dawit.statement()

    assert almaz.balance == 1800
    assert dawit.balance == 1800
    print("\nIndependence check passed: each object keeps its own balance.")

    try:
        almaz.deposit(-10)
    except ValueError as e:
        print(f"Blocked bad deposit: {e}")

    try:
        almaz.withdraw(999999)
    except ValueError as e:
        print(f"Blocked overdraft: {e}")

    try:
        almaz.balance = -5
    except AttributeError as e:
        print(f"Blocked direct edit: {e}")
