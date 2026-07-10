def split_bill(total, people, tip_rate=0.10):
    """Return the per-person share of a bill, tip included."""
    total_with_tip = total + (total * tip_rate)
    return total_with_tip / people


def main():
    bill_total = 850          # ETB
    num_people = 4
    tip_rate = 0.10

    names = ["Almaz", "Dawit", "Tigist", "Selamawit"]

    per_person = split_bill(bill_total, num_people, tip_rate)

    print(f"Bill total: {bill_total} ETB")
    print(f"Tip rate: {int(tip_rate * 100)}%")
    print(f"Split between {num_people} people\n")

    for name in names:
        print(f"{name} owes: {per_person:.2f} ETB")


if __name__ == "__main__":
    main()
