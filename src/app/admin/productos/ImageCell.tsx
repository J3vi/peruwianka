"use client";

import Image from "next/image";

type ImageCellProps = {
  imageUrl: string | null;
  productName: string;
};

export default function ImageCell({ imageUrl, productName }: ImageCellProps) {
  if (!imageUrl) {
    return (
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border bg-gray-50 text-xs text-gray-500">
        Sin imagen
      </span>
    );
  }

  return (
    <>
      <div className="relative h-12 w-12">
        <Image
          src={imageUrl}
          alt={productName}
          fill
          className="rounded-md object-cover border"
          sizes="48px"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            const next = target.parentElement?.nextElementSibling as HTMLElement | null;
            if (next) next.classList.remove("hidden");
          }}
        />
      </div>
      <span className="hidden h-12 w-12 items-center justify-center rounded-md border bg-gray-50 text-xs text-gray-500">
        Sin imagen
      </span>
    </>
  );
}

