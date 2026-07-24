"""
Day 7 Practice — Linear Structures & Big-O
Module 1 · Foundation
"""

import time


# =================================================================
# 1. O(1) vs O(n) — feel the difference, not just read about it
# =================================================================
print("1. List search (O(n)) vs Dict lookup (O(1))")

names_list = [f"customer_{i}" for i in range(1_000_000)]
names_dict = {name: True for name in names_list}

target = "customer_999999"   # the very last one -- worst case for a list

start = time.time()
found = target in names_list   # Python checks every item, one by one
list_time = time.time() - start

start = time.time()
found = target in names_dict   # Python jumps straight there
dict_time = time.time() - start

print(f"   List search took:  {list_time:.5f} seconds")
print(f"   Dict lookup took:  {dict_time:.5f} seconds")


# =================================================================
# 2. Stack — LIFO (Last In, First Out)
# =================================================================
print("\n2. Stack (LIFO)")

stack = []
stack.append("deposit 100")
stack.append("withdraw 50")
stack.append("deposit 200")

print("   Stack right now:", stack)
last_action = stack.pop()
print("   Undo most recent:", last_action)
print("   Stack after undo:", stack)


# =================================================================
# 3. Queue — FIFO (First In, First Out)
# =================================================================
print("\n3. Queue (FIFO)")

from collections import deque

queue = deque()
queue.append("transfer to Almaz")
queue.append("transfer to Dawit")
queue.append("transfer to Samuel")

print("   Queue right now:", list(queue))
next_to_process = queue.popleft()
print("   Processing:", next_to_process)
print("   Queue after processing:", list(queue))
