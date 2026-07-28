"""
Day 6 Practice — SOLID Principles & Design Patterns
Module 1 · Foundation
"""

from abc import ABC, abstractmethod


# =================================================================
# S — Single Responsibility Principle
# One reason to change. Split concerns into separate classes.
# =================================================================
print("1. Single Responsibility Principle")

class Invoice:
    """Only knows about invoice data -- nothing about saving or printing."""
    def __init__(self, customer, amount):
        self.customer = customer
        self.amount = amount


class InvoiceRepository:
    """Only knows how to save an invoice -- not what's in it or how to print it."""
    def save(self, invoice):
        print(f"   Saved invoice for {invoice.customer}: {invoice.amount} ETB")


class InvoicePrinter:
    """Only knows how to print an invoice."""
    def print_invoice(self, invoice):
        print(f"   INVOICE -- {invoice.customer}: {invoice.amount} ETB")


inv = Invoice("Almaz Bekele", 2500)
InvoiceRepository().save(inv)
InvoicePrinter().print_invoice(inv)
# Each class has exactly one job -- and one reason to ever change.


# =================================================================
# O — Open/Closed Principle
# Open for extension, closed for modification.
# =================================================================
print("\n2. Open/Closed Principle")

class Discount(ABC):
    @abstractmethod
    def apply(self, price):
        ...


class NoDiscount(Discount):
    def apply(self, price):
        return price


class StudentDiscount(Discount):
    def apply(self, price):
        return price * 0.9


class LoyaltyDiscount(Discount):
    def apply(self, price):
        return price * 0.85


def checkout(price, discount: Discount):
    return discount.apply(price)


print("   No discount:", checkout(1000, NoDiscount()))
print("   Student:", checkout(1000, StudentDiscount()))
print("   Loyalty:", checkout(1000, LoyaltyDiscount()))
# Adding a new discount type means writing a NEW class --
# checkout() never needs to be edited, no matter how many are added.


# =================================================================
# L — Liskov Substitution Principle
# A subclass must be safely usable wherever the parent is expected.
# =================================================================
print("\n3. Liskov Substitution Principle")

class Bird:
    def move(self):
        print("   Moving")


class Sparrow(Bird):
    def move(self):
        print("   Flying")


class Ostrich(Bird):
    def move(self):
        print("   Running (can't fly, but still moves)")


def make_it_move(bird: Bird):
    bird.move()   # caller trusts ANY Bird can do this safely


for bird in [Sparrow(), Ostrich()]:
    make_it_move(bird)
# Both subclasses honour the contract: calling move() never surprises
# the caller or raises an unexpected error. That's what LSP protects.


# =================================================================
# I — Interface Segregation Principle
# Don't force a class to implement methods it doesn't need.
# =================================================================
print("\n4. Interface Segregation Principle")

class Payable(ABC):
    @abstractmethod
    def pay(self, amount):
        ...


class InterestBearing(ABC):
    @abstractmethod
    def calculate_interest(self):
        ...


class CurrentAccount(Payable):
    """Only implements Payable -- current accounts don't earn interest,
    so they are NOT forced to implement calculate_interest()."""
    def pay(self, amount):
        print(f"   Paid {amount} ETB from current account")


class SavingsAccount(Payable, InterestBearing):
    """Implements both, since savings accounts genuinely need both."""
    def pay(self, amount):
        print(f"   Paid {amount} ETB from savings account")

    def calculate_interest(self):
        return 150.0


CurrentAccount().pay(200)
s = SavingsAccount()
s.pay(100)
print("   Interest earned:", s.calculate_interest())
# Two small, focused interfaces instead of one fat one that would force
# CurrentAccount to implement an interest method it has no use for.


# =================================================================
# D — Dependency Inversion Principle
# Depend on abstractions, not concrete classes.
# =================================================================
print("\n5. Dependency Inversion Principle")

class Notifier(ABC):
    @abstractmethod
    def send(self, message):
        ...


class EmailNotifier(Notifier):
    def send(self, message):
        print(f"   Email sent: {message}")


class SMSNotifier(Notifier):
    def send(self, message):
        print(f"   SMS sent: {message}")


class AccountAlert:
    """Depends on the Notifier ABSTRACTION, not on a specific class."""
    def __init__(self, notifier: Notifier):
        self.notifier = notifier   # injected -- swappable at will

    def alert_large_withdrawal(self, amount):
        self.notifier.send(f"Large withdrawal of {amount} ETB detected")


AccountAlert(EmailNotifier()).alert_large_withdrawal(5000)
AccountAlert(SMSNotifier()).alert_large_withdrawal(5000)
# Swapping Email for SMS never requires touching AccountAlert's code --
# only the notifier passed in at construction time changes.


# =================================================================
# Singleton (Creational pattern)
# Guarantee exactly one shared instance everywhere.
# =================================================================
print("\n6. Singleton Pattern")

class BankConfig:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.interest_rate = 0.05
            cls._instance.overdraft_limit = 1000
        return cls._instance


config1 = BankConfig()
config2 = BankConfig()
print("   Same instance?", config1 is config2)
config1.interest_rate = 0.07
print("   config2 sees the change too:", config2.interest_rate)
# Both variables point to the exact same object -- there's only ever one.


# =================================================================
# Factory (Creational pattern)
# Centralize object creation so callers don't hard-code constructors.
# =================================================================
print("\n7. Factory Pattern")

class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance


class SavingsAcc(Account):
    def __init__(self, owner, balance=0):
        super().__init__(owner, balance)
        self.kind = "savings"


class CurrentAcc(Account):
    def __init__(self, owner, balance=0):
        super().__init__(owner, balance)
        self.kind = "current"


class AccountFactory:
    @staticmethod
    def create(kind, owner, balance=0):
        if kind == "savings":
            return SavingsAcc(owner, balance)
        elif kind == "current":
            return CurrentAcc(owner, balance)
        else:
            raise ValueError(f"Unknown account kind: {kind}")


acc1 = AccountFactory.create("savings", "Dawit Tesfaye", 1000)
acc2 = AccountFactory.create("current", "Samuel Girma", 500)
print(f"   Created {acc1.kind} account for {acc1.owner}")
print(f"   Created {acc2.kind} account for {acc2.owner}")
# Callers just ask for a type by NAME -- they never import or call
# SavingsAcc/CurrentAcc directly. Adding a new type means editing the
# factory only, not every place accounts get created.


# =================================================================
# Observer (Behavioral pattern)
# Many observers react automatically when a subject's state changes.
# =================================================================
print("\n8. Observer Pattern")

class ObservableAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self._observers = []

    def subscribe(self, observer):
        self._observers.append(observer)

    def _notify(self, message):
        for observer in self._observers:
            observer(message)

    def withdraw(self, amount):
        self.balance -= amount
        if amount > 1000:
            self._notify(f"Large withdrawal: {amount} ETB from {self.owner}'s account")


def sms_alert(message):
    print(f"   [SMS] {message}")


def audit_log(message):
    print(f"   [AUDIT LOG] {message}")


acc = ObservableAccount("Hanna Alemu", 5000)
acc.subscribe(sms_alert)
acc.subscribe(audit_log)
acc.withdraw(2000)
# The account never imports sms_alert or audit_log directly -- it just
# calls whoever subscribed. Add or remove observers freely at runtime.
