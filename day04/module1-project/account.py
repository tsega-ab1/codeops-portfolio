"""
Addis Bank -- Account Management System
Day 4: Classes, Objects & Encapsulation (V1)
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


if __name__ == "__main__":
    almaz = Account("Almaz Bekele", "CBE-1001", 1500)
    dawit = Account("Dawit Tesfaye", "CBE-1002", 800)

    almaz.deposit(500)
    almaz.withdraw(200)
    dawit.deposit(1000)

    almaz.statement()
    dawit.statement()
