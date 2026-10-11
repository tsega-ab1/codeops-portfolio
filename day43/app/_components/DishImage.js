import Image from "next/image";

// Container decides the size (fill). The aspect-ratio box reserves space up front,
// so the image cannot push the page around when it loads (CLS).
export default function DishImage({ src, alt }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        className="object-cover"
      />
    </div>
  );
}
