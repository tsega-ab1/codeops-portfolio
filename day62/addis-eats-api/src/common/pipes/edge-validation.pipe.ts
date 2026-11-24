import { ArgumentMetadata, PipeTransform, ValidationPipe } from "@nestjs/common";

// Bodies are writes: an undeclared field is a 400 that names it (forbidNonWhitelisted).
// Query strings are reads: an undeclared parameter is quietly stripped (whitelist only).
// Both build the DTO instance (transform) and report EVERY failure at once.
export class EdgeValidationPipe implements PipeTransform {
  private readonly strict = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: false,
  });

  private readonly lenient = new ValidationPipe({
    whitelist: true,
    transform: true,
    stopAtFirstError: false,
  });

  transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    const pipe = metadata.type === "body" ? this.strict : this.lenient;
    return pipe.transform(value, metadata);
  }
}
