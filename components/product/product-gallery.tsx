"use client";

/* eslint-disable @next/next/no-img-element -- external catalog hosts remain administrator-configurable. */
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const fallbackImage = "/products/aurora-headphones.svg";
const autoplayDelayMs = 3500;
const swipeThresholdPx = 40;

export type GalleryImage = { id: string; imageUrl: string; altText: string | null };
type GesturePoint = { x: number; y: number };

export function swipeTargetIndex(start: GesturePoint, end: GesturePoint, currentIndex: number, imageCount: number) {
  if (imageCount < 2) return currentIndex;
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (Math.abs(deltaX) < swipeThresholdPx || Math.abs(deltaX) <= Math.abs(deltaY)) return currentIndex;
  return (currentIndex + (deltaX < 0 ? 1 : -1) + imageCount) % imageCount;
}

function validImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function normalizeGalleryImages(images: GalleryImage[], imageUrl: string | null, productName: string) {
  const source = images.length ? images : imageUrl ? [{ id: "primary", imageUrl, altText: productName }] : [];
  const seen = new Set<string>();
  const normalized = source.flatMap((image, index) => {
    const url = image.imageUrl?.trim();
    if (!url || !validImageUrl(url) || seen.has(url)) return [];
    seen.add(url);
    return [{ ...image, imageUrl: url, altText: image.altText?.trim() || (index === 0 ? productName : `${productName} — alternate view ${index + 1}`) }];
  });
  return normalized.length ? normalized : [{ id: "fallback", imageUrl: fallbackImage, altText: productName }];
}

function ProductImage({ src, alt, preload = false, onError }: { src: string; alt: string; preload?: boolean; onError: () => void }) {
  const classes = "h-full w-full object-contain p-5 sm:p-8";
  if (src.startsWith("/")) {
    return <Image alt={alt} className={classes} fill onError={onError} preload={preload} sizes="(max-width: 1023px) 100vw, 50vw" src={src} />;
  }
  return <img alt={alt} className={classes} fetchPriority={preload ? "high" : undefined} onError={onError} src={src} />;
}

export function ProductGallery({ action, imageUrl, images, productName }: { action?: ReactNode; imageUrl: string | null; images: GalleryImage[]; productName: string }) {
  const gallery = useMemo(() => normalizeGalleryImages(images, imageUrl, productName), [imageUrl, images, productName]);
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState(gallery[0].id);
  const [manualRevision, setManualRevision] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const pointerStart = useRef<(GesturePoint & { pointerId: number }) | null>(null);
  const autoplayTimer = useRef<number | null>(null);
  const fallback = useMemo<GalleryImage>(() => ({ id: "fallback", imageUrl: fallbackImage, altText: productName }), [productName]);
  const visibleImages = useMemo(() => {
    const available = gallery.filter((image) => !failedIds.has(image.id));
    return available.length ? available : [fallback];
  }, [failedIds, fallback, gallery]);
  const selectedIndex = Math.max(0, visibleImages.findIndex((image) => image.id === selectedId));
  const multiple = visibleImages.length > 1;
  const autoplayPaused = hovered || focused || interacting || !pageVisible;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const visibilityChanged = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => document.removeEventListener("visibilitychange", visibilityChanged);
  }, []);

  useEffect(() => {
    if (autoplayTimer.current !== null) window.clearTimeout(autoplayTimer.current);
    autoplayTimer.current = null;
    if (!multiple || reducedMotion || autoplayPaused) return;
    autoplayTimer.current = window.setTimeout(() => {
      const index = Math.max(0, visibleImages.findIndex((image) => image.id === selectedId));
      setSelectedId(visibleImages[(index + 1) % visibleImages.length].id);
      autoplayTimer.current = null;
    }, autoplayDelayMs);
    return () => {
      if (autoplayTimer.current !== null) window.clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    };
  }, [autoplayPaused, manualRevision, multiple, reducedMotion, selectedId, visibleImages]);

  useEffect(() => {
    if (!multiple) return;
    const next = visibleImages[(selectedIndex + 1) % visibleImages.length];
    const preload = new window.Image();
    preload.src = next.imageUrl;
  }, [multiple, selectedIndex, visibleImages]);

  function select(index: number, manual = true) {
    if (!visibleImages.length) return;
    const wrapped = (index + visibleImages.length) % visibleImages.length;
    setSelectedId(visibleImages[wrapped].id);
    if (manual) setManualRevision((value) => value + 1);
  }

  function imageFailed(image: GalleryImage) {
    if (image.id === "fallback") return;
    console.error("Product gallery image failed", { imageId: image.id, imageUrl: image.imageUrl });
    setFailedIds((currentIds) => new Set(currentIds).add(image.id));
  }

  return (
    <section aria-label={`${productName} gallery`}>
      <div
        aria-label={`Product image ${selectedIndex + 1} of ${visibleImages.length}`}
        className="group relative aspect-[4/3] touch-pan-y overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onFocusCapture={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); select(selectedIndex - 1); }
          if (event.key === "ArrowRight") { event.preventDefault(); select(selectedIndex + 1); }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerCancel={() => { pointerStart.current = null; setInteracting(false); }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.pointerType === "mouse") return;
          pointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
          setInteracting(true);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          setInteracting(false);
          if (!start || start.pointerId !== event.pointerId || !multiple) return;
          const target = swipeTargetIndex(start, { x: event.clientX, y: event.clientY }, selectedIndex, visibleImages.length);
          if (target !== selectedIndex) select(target);
        }}
        role="region"
        tabIndex={multiple ? 0 : -1}
      >
        {visibleImages.map((image, index) => (
          <div aria-hidden={index !== selectedIndex} className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${index === selectedIndex ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`} key={image.id}>
            <ProductImage alt={index === selectedIndex ? image.altText || productName : ""} onError={() => imageFailed(image)} preload={index === 0} src={image.imageUrl} />
          </div>
        ))}
        {action ? <div className="absolute right-3 top-3 z-30 sm:right-4 sm:top-4" data-gallery-action onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>{action}</div> : null}
        {multiple ? <div aria-label="Choose product image" className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm" role="group">
          {visibleImages.map((image, index) => <button aria-label={`View product image ${index + 1}`} aria-pressed={index === selectedIndex} className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${index === selectedIndex ? "w-6 bg-[#2563EB]" : "w-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]"}`} key={image.id} onClick={() => select(index)} type="button" />)}
        </div> : null}
      </div>
      <p aria-live="polite" className="sr-only">Showing product image {selectedIndex + 1} of {visibleImages.length}</p>
    </section>
  );
}
