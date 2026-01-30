"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Props = {
  intervalMs?: number;
};

export default function BannerCarousel({ intervalMs = 4500 }: Props) {
  const images = useMemo(
    () => ["/banners/1.png", "/banners/2.png", "/banners/3.png", "/banners/4.png"],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  const goTo = (i: number) => setIndex(i);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border bg-transparent">
        {/* Altura controlada (responsive) */}
<div className="relative w-full h-[260px] sm:h-[360px] lg:h-[480px]">
  <Image
    key={images[index]}
    src={images[index]}
    alt={`Banner ${index + 1}`}
    fill
    priority
    className="object-contain bg-white object-center bg-[#fff7e6]"
    sizes="100vw"
  />
</div>


        {/* Flechas */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/70"
          aria-label="Anterior"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/70"
          aria-label="Siguiente"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Ir al banner ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
