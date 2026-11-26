import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

export const MAX_SANTIM = 10_000_000; // 100,000 ETB: a sanity ceiling, not a business limit

// The class form: reusable with @Validate(IsSantimConstraint) and easy to unit-test on its own.
// 24000 valid (240.00 ETB) | 240.5 not an integer | 0 not positive | 999999999 over the ceiling
@ValidatorConstraint({ name: "isSantim", async: false })
export class IsSantimConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= MAX_SANTIM
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return (
      `${args.property} must be a whole number of santim, ` +
      `between 1 and 10,000,000 (100,000 ETB)`
    );
  }
}
