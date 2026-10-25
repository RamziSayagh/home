"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

type Photo = { src: string; alt: string };
type GalleryContextValue = {
  photos: Photo[];
  open: (index: number, trigger: HTMLImageElement) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function Gallery({ photos, children }: { photos: Photo[]; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLImageElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const photo = index === null ? null : photos[index];

  function open(nextIndex: number, element: HTMLImageElement) {
    trigger.current = element;
    setIndex(nextIndex);
    dialog.current?.showModal();
  }

  function move(offset: number) {
    setIndex((current) =>
      current === null ? null : (current + offset + photos.length) % photos.length,
    );
  }

  return (
    <GalleryContext value={{ photos, open }}>
      {children}
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label="Galerie photo"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onClose={() => trigger.current?.focus()}
      >
        <div className="gallery-toolbar">
          <button type="button" className="gallery-close" aria-label="Fermer la galerie" onClick={() => dialog.current?.close()}>
            Fermer ✕
          </button>
        </div>
        <div className="gallery-content">
          <button type="button" className="gallery-prev" aria-label="Photo précédente" onClick={() => move(-1)}>
            ←
          </button>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- Load the original full-size photo only when opened.
            <img className="gallery-image" src={photo.src} alt={photo.alt} />
          ) : null}
          <button type="button" className="gallery-next" aria-label="Photo suivante" onClick={() => move(1)}>
            →
          </button>
        </div>
        <div className="gallery-controls">
          <span className="gallery-caption" aria-live="polite">{photo?.alt}</span>
          <span className="gallery-count">{index === null ? "" : `${index + 1} / ${photos.length}`}</span>
        </div>
      </dialog>
    </GalleryContext>
  );
}

export function GalleryPhoto({ index }: { index: number }) {
  const gallery = useContext(GalleryContext);
  if (!gallery) throw new Error("GalleryPhoto must be inside Gallery.");
  const photo = gallery.photos[index];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Preserve the original before/after image sizing and loading.
    <img
      src={photo.src}
      alt={photo.alt}
      loading="lazy"
      tabIndex={0}
      role="button"
      aria-label={`Agrandir : ${photo.alt}`}
      onClick={(event) => gallery.open(index, event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          gallery.open(index, event.currentTarget);
        }
      }}
    />
  );
}

export function RoomMenu({ children }: { children: ReactNode }) {
  return (
    <details
      className="site-menu"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest(".menu-panel a")) {
          event.currentTarget.open = false;
        }
      }}
    >
      {children}
    </details>
  );
}
