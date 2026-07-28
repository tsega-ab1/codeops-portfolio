"""
Day 9 Practice — Trees, Graphs & Heaps
Module 1 · Foundation
"""

import heapq


# =================================================================
# 1. Binary Search Tree -- insert + in-order traversal
# =================================================================
print("1. Binary Search Tree")

class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


def insert(root, value):
    if root is None:              # base case -- found the empty spot
        return TreeNode(value)
    if value < root.value:
        root.left = insert(root.left, value)     # smaller -- go left
    else:
        root.right = insert(root.right, value)   # bigger -- go right
    return root


def in_order(root, result=None):
    """Left -> Node -> Right. On a BST this always comes out sorted."""
    if result is None:
        result = []
    if root is None:              # base case -- nothing here
        return result
    in_order(root.left, result)
    result.append(root.value)
    in_order(root.right, result)
    return result


bst_root = None
for n in [50, 30, 70, 20, 40, 60, 80]:
    bst_root = insert(bst_root, n)

print("   In-order (should be sorted):", in_order(bst_root))


# =================================================================
# 2. Graph as an adjacency list + BFS
# =================================================================
print("\n2. Graph -- BFS (breadth-first, level by level)")

# accounts as vertices, transfers as directed edges
transfers = {
    "Almaz":  ["Dawit", "Samuel"],
    "Dawit":  ["Hanna"],
    "Samuel": ["Hanna"],
    "Hanna":  [],
}


def bfs(graph, start):
    """Explore level by level using a queue -- closest neighbours first."""
    from collections import deque
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        current = queue.popleft()     # take from the FRONT -- fair, level by level
        order.append(current)
        for neighbour in graph[current]:
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)   # add to the BACK -- wait your turn
    return order


reachable = bfs(transfers, "Almaz")
print("   Reachable from Almaz (BFS order):", reachable)


# =================================================================
# 3. Graph -- DFS (depth-first, follow one path as far as possible)
# =================================================================
print("\n3. Graph -- DFS (depth-first, one path at a time)")

def dfs(graph, start, visited=None, order=None):
    if visited is None:
        visited = set()
        order = []
    visited.add(start)
    order.append(start)
    for neighbour in graph[start]:
        if neighbour not in visited:
            dfs(graph, neighbour, visited, order)   # go as deep as possible first
    return order


dfs_order = dfs(transfers, "Almaz")
print("   Reachable from Almaz (DFS order):", dfs_order)


# =================================================================
# 4. Heap -- priority queue, most urgent always on top
# =================================================================
print("\n4. Heap -- priority queue")

payments = []
heapq.heappush(payments, (1, "Rent"))       # lower number = more urgent
heapq.heappush(payments, (3, "Snacks"))
heapq.heappush(payments, (2, "Electricity"))

print("   Processing payments by urgency:")
while payments:
    priority, name = heapq.heappop(payments)   # always pulls the smallest/most urgent
    print(f"     Processing: {name} (priority {priority})")
