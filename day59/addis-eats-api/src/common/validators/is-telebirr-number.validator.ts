import { registerDecorator, ValidationOptions } from "class-validator";

export const TELEBIRR = /^(?:\+251|0)9\d{8}$/;

// 0912345678 and +251912345678 are valid. 251912345678, 0812345678 and 09123456789 are not.
export function IsTeleBirrNumber(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isTeleBirrNumber",
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) =>
          typeof value === "string" && TELEBIRR.test(value),
        defaultMessage: () =>
          "phone must be a TeleBirr number: 09xxxxxxxx or +2519xxxxxxxx",
      },
    });
  };
}
