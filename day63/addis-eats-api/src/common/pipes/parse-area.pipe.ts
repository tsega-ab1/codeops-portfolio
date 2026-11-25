import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { AREAS } from "../area.js";
import type { Area } from "../area.js";

// "bole" and "BOLE" both become "Bole"; "adama" is a 400.
// A pipe may TRANSFORM, not only reject. It does shape and normalisation, never business logic.
@Injectable()
export class ParseAreaPipe implements PipeTransform<string | undefined, Area> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Area {
    if (value === undefined || value === "") {
      throw new BadRequestException(`${metadata.data} is required`);
    }
    const match = AREAS.find((area) => area.toLowerCase() === value.toLowerCase());
    if (!match) {
      throw new BadRequestException(
        `${metadata.data} must be one of: ${AREAS.join(", ")}`,
      );
    }
    return match;
  }
}
