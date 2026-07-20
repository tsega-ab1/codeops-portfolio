"""
Day 5 Practice — Inheritance, Polymorphism & Abstraction
Module 1 · Foundation
"""

from abc import ABC, abstractmethod

# ---------------------------------------------------------------
# 1. Inheritance & overriding
# ---------------------------------------------------------------
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        print(f"{self.name} makes a sound")


class Dog(Animal):
    def speak(self):  # override
        print(f"{self.name} barks")


class Cat(Animal):
    def speak(self):  # override
        print(f"{self.name} meows")


print("1. Inheritance & overriding:")
generic = Animal("Some animal")
rex = Dog("Rex")
whiskers = Cat("Whiskers")
generic.speak()
rex.speak()
whiskers.speak()

# ---------------------------------------------------------------
# 2. Polymorphism — one loop, many behaviours
# ---------------------------------------------------------------
print("\n2. Polymorphism:")
for animal in [generic, rex, whiskers]:
    animal.speak()

# ---------------------------------------------------------------
# 3. super() — extending, not replacing
# ---------------------------------------------------------------
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def describe(self):
        print(f"{self.name} earns {self.salary} ETB")


class Manager(Employee):
    def __init__(self, name, salary, team_size):
        super().__init__(name, salary)   # run parent's setup first
        self.team_size = team_size

    def describe(self):
        super().describe()               # extend, not fully replace
        print(f"  manages a team of {self.team_size}")


print("\n3. super() extending a parent method:")
m = Manager("Selam", 25000, 5)
m.describe()

# ---------------------------------------------------------------
# 4. Abstraction — abstract base class enforcing a contract
# ---------------------------------------------------------------
class Shape(ABC):
    @abstractmethod
    def area(self):
        ...


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2


class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2


print("\n4. Abstraction / abstract base class:")
shapes = [Circle(5), Square(4)]
for s in shapes:
    print(f"   {type(s).__name__} area: {s.area():.2f}")

try:
    Shape()   # can't instantiate an ABC directly
except TypeError as e:
    print(f"   Blocked direct instantiation: {e}")

# ---------------------------------------------------------------
# 5. Composition — "has-a" instead of "is-a"
# ---------------------------------------------------------------
class Engine:
    def __init__(self, horsepower):
        self.horsepower = horsepower

    def start(self):
        print(f"Engine with {self.horsepower}hp starting...")


class Car:
    def __init__(self, model, horsepower):
        self.model = model
        self.engine = Engine(horsepower)  # Car HAS-A Engine

    def start(self):
        print(f"{self.model}:")
        self.engine.start()


print("\n5. Composition (has-a):")
car = Car("Toyota Corolla", 140)
car.start()
