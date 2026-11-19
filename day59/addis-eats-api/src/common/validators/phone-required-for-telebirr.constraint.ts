import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "phoneRequiredForTeleBirr", async: false })
export class PhoneRequiredForTeleBirr implements ValidatorConstraintInterface {
  validate(phone: unknown, args: ValidationArguments): boolean {
    // args.object is the WHOLE dto: that is the entire trick
    const dto = args.object as { paymentMethod?: string };
    if (dto.paymentMethod !== "TELEBIRR") return true; // the rule does not apply
    return typeof phone === "string" && phone.length > 0;
  }

  defaultMessage(): string {
    return "phone is required when paymentMethod is TELEBIRR";
  }
}
