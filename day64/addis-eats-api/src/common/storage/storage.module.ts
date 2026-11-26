import { Global, Module } from "@nestjs/common";
import { ImageService } from "../images/image.service.js";
import { LocalStorageService } from "./local-storage.service.js";
import { STORAGE } from "./storage.service.js";

// THE line Module 7 changes:  useClass: LocalStorageService  ->  useClass: S3StorageService
@Global()
@Module({
  providers: [{ provide: STORAGE, useClass: LocalStorageService }, ImageService],
  exports: [STORAGE, ImageService],
})
export class StorageModule {}
