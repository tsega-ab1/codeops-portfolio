import Image from "next/image";

// The hero is the likely LCP element, so it is the ONE image we preload.
export default function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Traditional Ethiopian food served at Addis Eats"
      width={1200}
      height={700}
      sizes="100vw"
      preload
      style={{ width: "100%", height: "auto" }}
    />
  );
}
