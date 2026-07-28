"""
Day 8 Practice — Recursion, Searching & Sorting
Module 1 · Foundation
"""


# =================================================================
# 1. Recursion — the "ask the person in front of you" pattern
# =================================================================
print("1. Recursion: sum of a list")

def recursive_sum(numbers):
    if len(numbers) == 0:          # base case -- the one who KNOWS the answer
        return 0
    return numbers[0] + recursive_sum(numbers[1:])   # ask the same question, smaller list

nums = [10, 20, 30, 40]
print(f"   Sum of {nums}:", recursive_sum(nums))


print("\n1b. Recursion: countdown")

def countdown(n):
    if n <= 0:                     # base case
        print("   Liftoff!")
        return
    print(f"   {n}...")
    countdown(n - 1)               # recursive case -- smaller problem

countdown(3)


# =================================================================
# 2. Linear search vs. Binary search
# =================================================================
print("\n2. Linear search vs. Binary search")

def linear_search(items, target):
    for i, item in enumerate(items):     # walk every seat in the theater
        if item == target:
            return i
    return -1

def binary_search(sorted_items, target):
    low, high = 0, len(sorted_items) - 1
    while low <= high:
        mid = (low + high) // 2          # flip to the middle page
        if sorted_items[mid] == target:
            return mid
        elif sorted_items[mid] < target:
            low = mid + 1                # throw away the left half
        else:
            high = mid - 1               # throw away the right half
    return -1

sorted_numbers = list(range(0, 1000, 2))   # 0, 2, 4, ... 998

print("   Linear search for 850:", linear_search(sorted_numbers, 850))
print("   Binary search for 850:", binary_search(sorted_numbers, 850))
print("   Binary search for 999 (not present):", binary_search(sorted_numbers, 999))


# =================================================================
# 3. Merge sort
# =================================================================
print("\n3. Merge sort")

def merge_sort(items):
    if len(items) <= 1:                  # base case -- a single item is already "sorted"
        return items

    mid = len(items) // 2
    left = merge_sort(items[:mid])       # sort the left half
    right = merge_sort(items[mid:])      # sort the right half
    return merge(left, right)            # merge two sorted halves together

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

messy = [38, 27, 43, 3, 9, 82, 10]
print("   Before:", messy)
print("   After: ", merge_sort(messy))


# =================================================================
# 4. Python's built-in sort with key=
# =================================================================
print("\n4. Built-in sort with key=")

accounts = [
    {"owner": "Hanna", "balance": 1500},
    {"owner": "Almaz", "balance": 3200},
    {"owner": "Dawit", "balance": 800},
]

ranked = sorted(accounts, key=lambda acc: acc["balance"], reverse=True)
print("   Ranked by balance (highest first):")
for acc in ranked:
    print(f"     {acc['owner']}: {acc['balance']} ETB")


# =================================================================
# 5. Two pointers
# =================================================================
print("\n5. Two pointers: find a pair that sums to target")

def two_sum_sorted(sorted_nums, target):
    left, right = 0, len(sorted_nums) - 1
    while left < right:
        total = sorted_nums[left] + sorted_nums[right]
        if total == target:
            return (sorted_nums[left], sorted_nums[right])
        elif total < target:
            left += 1           # too small -- move the short side up
        else:
            right -= 1          # too big -- move the tall side down
    return None

balances = [100, 250, 400, 550, 700, 900]
pair = two_sum_sorted(balances, 1150)
print(f"   Pair summing to 1150: {pair}")


# =================================================================
# 6. Sliding window
# =================================================================
print("\n6. Sliding window: best 3-transaction stretch")

def best_window_sum(transactions, window_size):
    window_sum = sum(transactions[:window_size])   # first window
    best = window_sum
    for i in range(window_size, len(transactions)):
        window_sum += transactions[i]                 # add the incoming
        window_sum -= transactions[i - window_size]   # drop the outgoing
        best = max(best, window_sum)
    return best

transaction_history = [200, -50, 300, 400, -100, 250, 150]
print("   Best 3-transaction stretch:", best_window_sum(transaction_history, 3))
