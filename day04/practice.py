"""
Day 4 Practice — Classes, Objects & Encapsulation
Module 1 · Foundation
"""

# ---------------------------------------------------------------
# 1. Book class
# ---------------------------------------------------------------
class Book:
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages

    def describe(self):
        print(f"'{self.title}' by {self.author} ({self.pages} pages)")


book1 = Book("Things Fall Apart", "Chinua Achebe", 209)
book2 = Book("Oromay", "Baalu Girma", 375)

print("1. Book class:")
book1.describe()
book2.describe()

# ---------------------------------------------------------------
# 2-4. Product class — with private quantity, @property, and validation
# ---------------------------------------------------------------
class Product:
    def __init__(self, name, price, quantity):
        self.name = name
        self.price = price          # ETB
        self.__quantity = quantity  # private

    @property
    def quantity(self):
        """Read-only view of stock level."""
        return self.__quantity

    def restock(self, n):
        if n <= 0:
            raise ValueError("Restock amount must be positive")
        self.__quantity += n

    def sell(self, n):
        if n <= 0:
            raise ValueError("Sell amount must be positive")
        if n > self.__quantity:
            raise ValueError("Not enough stock to sell that many")
        self.__quantity -= n


print("\n2-4. Product class:")
paracetamol = Product("Paracetamol", 15, 50)
amoxicillin = Product("Amoxicillin", 40, 30)

paracetamol.restock(20)
paracetamol.sell(10)
print(f"   {paracetamol.name}: {paracetamol.quantity} in stock")

try:
    amoxicillin.sell(100)
except ValueError as e:
    print(f"   Blocked bad sale: {e}")

# ---------------------------------------------------------------
# 5. Prove independence
# ---------------------------------------------------------------
print("\n5. Independence check:")
p1 = Product("Bandages", 5, 100)
p2 = Product("Syringes", 8, 200)
p3 = Product("Gauze", 3, 150)

p1.sell(20)

print(f"   Bandages: {p1.quantity}")   # changed
print(f"   Syringes: {p2.quantity}")   # unaffected
print(f"   Gauze:    {p3.quantity}")   # unaffected

assert p2.quantity == 200
assert p3.quantity == 150
print("   Passed: p2 and p3 unaffected by p1's sale.")
