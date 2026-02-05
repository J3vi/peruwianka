"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  intervalMs?: number;
};

type Banner = {
  image_url: string;
  link_url: string | null;
};

const FALLBACK_IMAGES = [
  "/banners/1.png",
  "/banners/2.png",
  "/banners/3.png",
  "/banners/4.png",
];

export default function BannerCarousel({ intervalMs = 4500 }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  // Determinar qué imágenes mostrar: fetched banners o fallback
  const images = useMemo(() => {
    if (banners.length > 0) {
      return banners.map((b) => b.image_url);
    }
    return FALLBACK_IMAGES;
  }, [banners]);

  const links = useMemo(() => {
    if (banners.length > 0) {
      return banners.map((b) => {
        const trimmed = b.link_url?.trim();
        return trimmed ? trimmed : null;
      });
    }
    return FALLBACK_IMAGES.map(() => null);
  }, [banners]);

  // Fetch banners desde Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("banners")
          .select("image_url, link_url")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error fetching banners:", error);
          // En caso de error, usar fallback
          return;
        }

        if (data && data.length > 0) {
          setBanners(data);
        }
        // Si data está vacío o null, usamos fallback (no hacemos nada)
      } catch (err) {
        console.error("Exception fetching banners:", err);
        // En caso de excepción, usar fallback
      }
    };

    fetchBanners();
  }, []);

  // Asegurar que index nunca quede fuera de rango
  useEffect(() => {
    if (index >= images.length) {
      setIndex(0);
    }
  }, [images.length, index]);

  // Intervalo del carousel
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  const goTo = (i: number) => setIndex(i);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  const currentLink = links[index];

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl border bg-transparent">
        {/* Altura controlada (responsive) */}
        <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[480px]">
          {currentLink ? (
            <a
              href={currentLink}
              target="_blank"
              rel="noreferrer"
              className="block w-full h-full"
            >
              <Image
                key={images[index]}
                src={images[index]}
                alt={`Banner ${index + 1}`}
                fill
                priority
                className="object-cover object-[75%_50%]"
                sizes="100vw"
              />
            </a>
          ) : (
            <Image
              key={images[index]}
              src={images[index]}
              alt={`Banner ${index + 1}`}
              fill
              priority
              className="object-cover object-[75%_50%]"
              sizes="100vw"
            />
          )}
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
