import { FileTypeValidator, HttpStatus, MaxFileSizeValidator, ParseFilePipe } from "@nestjs/common";
import { MAX_IMAGE_BYTES } from "./image.service.js";

// The POLITE half: a clear error for the honest mistake (a customer picked a PDF), and it fails fast before the service runs.
// FileTypeValidator checks file.mimetype, which is a string the CALLER typed: it is a convenience, not a security control.
// The real check is detectImageType() on the bytes, inside ImageService.
// fileIsRequired is false so that a request with NO file is a 400 from the controller (a malformed request), while
// a file that is the WRONG KIND is a 422 from here (a well-formed request whose content is not acceptable).
export const imageFilePipe = (): ParseFilePipe =>
  new ParseFilePipe({
    fileIsRequired: false,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
      new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
    ],
  });
