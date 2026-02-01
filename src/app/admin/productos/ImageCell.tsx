"use client";

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
      <img
        src={imageUrl}
        alt={productName}
        className="h-12 w-12 rounded-md object-cover border"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
          const next = target.nextElementSibling as HTMLElement | null;
          if (next) next.style.display = "inline-flex";
        }}
      />
      <span className="hidden h-12 w-12 items-center justify-center rounded-md border bg-gray-50 text-xs text-gray-500">
        Sin imagen
      </span>
    </>
  );
}

