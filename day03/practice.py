"""
Day 3 Practice — Collections, Files & Errors
Module 1 · Foundation
"""

# ---------------------------------------------------------------
# 1. Unique cities
# ---------------------------------------------------------------
cities = ["Addis Ababa", "Adama", "Addis Ababa", "Hawassa", "Adama", "Bahir Dar"]
unique_cities = set(cities)
print("1. Unique cities:", unique_cities)
print("   Count:", len(unique_cities))

# ---------------------------------------------------------------
# 2. Price report
# ---------------------------------------------------------------
prices = {"Bread": 50, "Milk": 80, "Eggs": 120, "Rice": 150, "Sugar": 90}  # ETB
print("\n2. Price report:")
for item, price in prices.items():
    print(f"   {item}: {price} ETB")

# ---------------------------------------------------------------
# 3. Tax comprehension
# ---------------------------------------------------------------
prices_list = [100, 250, 400, 80]
with_tax = [p * 1.15 for p in prices_list]
print("\n3. Prices with 15% tax:", with_tax)

# ---------------------------------------------------------------
# 4. Cheap items
# ---------------------------------------------------------------
cheap = [p for p in prices_list if p < 200]
print("4. Cheap items (under 200):", cheap)

# ---------------------------------------------------------------
# 5. Write & read
# ---------------------------------------------------------------
names = ["Almaz Bekele", "Dawit Tesfaye", "Samuel Girma"]

with open("names.txt", "w") as f:
    for name in names:
        f.write(name + "\n")

print("\n5. Names read back from file:")
with open("names.txt") as f:
    for line in f:
        print("  ", line.strip())

# ---------------------------------------------------------------
# 6. Safe division
# ---------------------------------------------------------------
print("\n6. Safe division:")
try:
    amount = int(input("   Enter a number to divide 1000 by: "))
    result = 1000 / amount
except ValueError:
    print("   Please enter a valid number")
except ZeroDivisionError:
    print("   Amount can't be zero")
else:
    print("   Result:", result)
finally:
    print("   Done")
