"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Banner = {
  image_url?: string; // por si fallback
  link_url: string | null;
  created_at?: string;
  updated_at?: string | null;
  src?: string; // para slides
};

type Props = {
  intervalMs?: number;
  banners?: {
    image_url: string;
    link_url: string | null;
    created_at: string;
    updated_at: string | null;
  }[];
};

const FALLBACK_IMAGES = ["/banners/1.png", "/banners/2.png", "/banners/3.png", "/banners/4.png"];

export default function BannerCarousel({ intervalMs = 4500, banners: propsBanners = [] }: Props) {
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => {
    if (propsBanners.length > 0) {
      return propsBanners.map((b) => {
        const v = b.updated_at ?? b.created_at ?? Date.now();
        return {
          src: `${b.image_url}?v=${new Date(v).getTime()}`,
          link_url: b.link_url?.trim() ? b.link_url.trim() : null,
        };
      });
    }
    return FALLBACK_IMAGES.map((src) => ({ src, link_url: null as string | null }));
  }, [propsBanners]);

  // Asegurar index válido si cambia el número de slides
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  // Intervalo del carousel
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  const goTo = (i: number) => setIndex(i);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const current = slides[index];

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border bg-transparent">
        <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[480px]">
          {current?.link_url ? (
            <a href={current.link_url} target="_blank" rel="noreferrer" className="block w-full h-full">
              <Image
                key={current.src}
                src={current.src}
                alt={`Banner ${index + 1}`}
                fill
                priority
                className="object-cover object-[75%_50%]"
                sizes="100vw"
              />
            </a>
          ) : (
            <Image
              key={current?.src}
              src={current?.src ?? FALLBACK_IMAGES[0]}
              alt={`Banner ${index + 1}`}
              fill
              priority
              className="object-cover object-[75%_50%]"
              sizes="100vw"
            />
          )}
        </div>

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

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              aria-label={`Ir al banner ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}