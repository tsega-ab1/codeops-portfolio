// Three methods are the WHOLE interface: put it somewhere, remove it, tell me its URL.
// Everything else an S3 client offers is detail the services must never see: that is what keeps the Module 7 swap to one line.
export const STORAGE = Symbol("STORAGE");

export interface StorageService {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  urlFor(key: string): string;
}
