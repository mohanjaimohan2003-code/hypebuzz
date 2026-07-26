"use client";

/* eslint-disable @next/next/no-img-element -- previews may use administrator-provided hosts. */
import { useRef, useState, type DragEvent } from "react";
import { ProductImageEditor } from "./product-image-editor";

export type ProductImageValue = {
  id: string;
  imageUrl: string;
  sourceType: "upload" | "external";
  isPrimary: boolean;
  sortOrder: number;
};

type Item = {
  key: string;
  kind: "existing" | "external" | "upload";
  id?: string;
  url: string;
  originalUrl?: string;
  originalFile?: File;
  fileIndex?: number;
  name: string;
  size?: number;
  loadError?: boolean;
  edited?: boolean;
};

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export function ProductImagesField({
  initialImages,
  disabled,
  error,
}: {
  initialImages: ProductImageValue[];
  disabled: boolean;
  error?: string;
}) {
  const sortedInitialImages = [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder);
  const [items, setItems] = useState<Item[]>(
    sortedInitialImages.map((image) => ({
      key: image.id,
      kind: "existing",
      id: image.id,
      url: image.imageUrl,
      name: image.sourceType === "upload" ? "Uploaded image" : "External image",
    })),
  );
  const [primary, setPrimary] = useState(Math.max(0, sortedInitialImages.findIndex((image) => image.isPrimary)));
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);

  const manifest = items.map((item, index) => ({
    kind: item.kind,
    id: item.id,
    url: item.kind === "external" ? item.url : undefined,
    fileIndex: item.fileIndex,
    isPrimary: index === primary,
  }));

  function syncFileInput() {
    const transfer = new DataTransfer();
    filesRef.current.forEach((file) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  function remove(index: number) {
    const removed = items[index];
    if (removed.kind === "upload" && removed.fileIndex !== undefined) {
      const removedFileIndex = removed.fileIndex;
      filesRef.current = filesRef.current.filter((_, fileIndex) => fileIndex !== removedFileIndex);
      syncFileInput();
      setItems((current) => current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item) => item.kind === "upload" && (item.fileIndex ?? 0) > removedFileIndex
          ? { ...item, fileIndex: (item.fileIndex ?? 1) - 1 }
          : item));
    } else {
      setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }
    setPrimary((current) => current === index ? 0 : current > index ? current - 1 : current);
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    setItems(copy);
    setPrimary((current) => {
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
  }

  function addUrl() {
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      if (items.length >= MAX_IMAGES) {
        setLocalError("You can add up to 8 product images.");
        return;
      }
      setItems((current) => [...current, {
        key: crypto.randomUUID(),
        kind: "external",
        url: parsed.toString(),
        name: "External image",
      }]);
      setUrl("");
      setLocalError("");
    } catch {
      setLocalError("Enter a complete HTTP or HTTPS image URL.");
    }
  }

  function selectFiles(fileList: FileList | null) {
    if (!fileList) return;
    const accepted = Array.from(fileList);
    if (!accepted.length) return;
    if (items.length + accepted.length > MAX_IMAGES) {
      setLocalError("You can upload up to 8 product images.");
      return;
    }
    if (accepted.some((file) => !ACCEPTED_TYPES.includes(file.type))) {
      setLocalError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (accepted.some((file) => file.size > MAX_FILE_SIZE)) {
      setLocalError("Each image must be 5 MB or smaller.");
      return;
    }
    const base = filesRef.current.length;
    filesRef.current = [...filesRef.current, ...accepted];
    syncFileInput();
    setItems((current) => [...current, ...accepted.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        key: crypto.randomUUID(),
        kind: "upload" as const,
        url: objectUrl,
        originalUrl: objectUrl,
        originalFile: file,
        fileIndex: base + index,
        name: file.name,
        size: file.size,
      };
    })]);
    setLocalError("");
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsFileDragActive(false);
    if (!disabled) selectFiles(event.dataTransfer.files);
  }

  function applyEdit(index: number, file: File) {
    const item = items[index];
    if (item.kind !== "upload" || item.fileIndex === undefined) return;
    filesRef.current[item.fileIndex] = file;
    syncFileInput();
    setItems((current) => current.map((value, itemIndex) => itemIndex === index
      ? { ...value, url: URL.createObjectURL(file), name: file.name, size: file.size, edited: true }
      : value));
    setEditingIndex(null);
  }

  function beginEdit(index: number) {
    setEditingIndex(index);
    setEditingUrl(items[index].url);
  }

  function applyUrlEdit() {
    if (editingIndex === null) return;
    try {
      const parsed = new URL(editingUrl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      setItems((current) => current.map((item, index) => index === editingIndex
        ? { ...item, url: parsed.toString(), loadError: false, edited: true }
        : item));
      setEditingIndex(null);
      setLocalError("");
    } catch {
      setLocalError("Enter a complete HTTP or HTTPS image URL.");
    }
  }

  return (
    <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
      <legend className="px-1 text-lg font-bold">Product images</legend>
      <p className="mt-2 text-sm text-[#6B7280]">Upload images, add external URLs, or use both. Maximum 8 images and 5 MB each.</p>
      <input name="imageManifest" type="hidden" value={JSON.stringify(manifest)} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-xl border-2 border-dashed p-3 transition-colors ${isFileDragActive ? "border-[#2563EB] bg-[#DBEAFE]" : "border-[#93C5FD] bg-[#EFF6FF]"}`}
          onDragEnter={(event) => { event.preventDefault(); if (!disabled) setIsFileDragActive(true); }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFileDragActive(false); }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFileDrop}
        >
          <input ref={inputRef} accept={ACCEPTED_TYPES.join(",")} className="sr-only" disabled={disabled} id="product-images" multiple name="uploadedImages" onChange={(event) => selectFiles(event.target.files)} type="file" />
          <input accept={ACCEPTED_TYPES.join(",")} capture="environment" className="sr-only" disabled={disabled} id="product-camera-image" onChange={(event) => selectFiles(event.target.files)} type="file" />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] bg-white px-3 text-center font-semibold text-[#1D4ED8] ring-1 ring-[#93C5FD]" htmlFor="product-images">Choose images</label>
            <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] bg-white px-3 text-center font-semibold text-[#1D4ED8] ring-1 ring-[#93C5FD]" htmlFor="product-camera-image">Use camera</label>
          </div>
          <p className="mt-2 text-center text-xs text-[#6B7280]">Drag and drop here, or use your phone gallery, camera, or computer.</p>
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="product-image-url">Add image URL</label>
          <div className="mt-2 flex gap-2">
            <input className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[#D1D5DB] px-3" disabled={disabled} id="product-image-url" onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/image.jpg" type="url" value={url} />
            <button className="min-h-12 rounded-[10px] border border-[#2563EB] px-4 font-semibold text-[#1D4ED8]" disabled={disabled || !url.trim()} onClick={addUrl} type="button">Add</button>
          </div>
        </div>
      </div>

      {localError || error ? <p className="mt-3 text-sm font-medium text-[#B91C1C]" role="alert">{localError || error}</p> : null}
      {items.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <article
              className={`overflow-hidden rounded-xl border bg-white ${draggedIndex === index ? "opacity-60" : ""} ${index === primary ? "border-[#2563EB] ring-2 ring-[#BFDBFE]" : "border-[#E5E7EB]"}`}
              draggable={!disabled}
              key={item.key}
              onDragEnd={() => setDraggedIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedIndex(index)}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (draggedIndex !== null) reorder(draggedIndex, index);
                setDraggedIndex(null);
              }}
            >
              <div className="relative aspect-square bg-[#F8FAFC]">
                <img alt={`Product image preview ${index + 1}`} className="h-full w-full object-contain p-2" onError={() => setItems((current) => current.map((value) => value.key === item.key ? { ...value, loadError: true } : value))} src={item.url} />
                {index === primary ? <span className="absolute left-2 top-2 rounded-full bg-[#1D4ED8] px-2 py-1 text-[10px] font-bold text-white" title="Primary image">★ Primary</span> : null}
                {item.edited ? <span className="absolute right-2 top-2 rounded-full bg-[#166534] px-2 py-1 text-[10px] font-bold text-white">Edited</span> : null}
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs font-semibold">{item.name}</p>
                {item.size ? <p className="text-xs text-[#6B7280]">{formatSize(item.size)}</p> : null}
                {item.loadError ? <p className="text-xs text-[#B91C1C]">Preview could not load.</p> : null}
                <p className="hidden text-[10px] text-[#6B7280] sm:block">Drag this card to reorder</p>
                <button className="min-h-11 w-full rounded border border-[#93C5FD] text-xs font-semibold text-[#1D4ED8]" disabled={disabled} onClick={() => beginEdit(index)} type="button">Edit</button>
                <button className={`min-h-11 w-full rounded border text-xs font-bold ${index === primary ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#D1D5DB] text-[#374151]"}`} disabled={disabled || index === primary} onClick={() => setPrimary(index)} type="button">{index === primary ? "★ Primary image" : "☆ Set as primary"}</button>
                <div className="grid grid-cols-2 gap-1">
                  <button aria-label={`Move image ${index + 1} earlier`} className="min-h-11 rounded border" disabled={disabled || index === 0} onClick={() => reorder(index, index - 1)} type="button">←</button>
                  <button aria-label={`Move image ${index + 1} later`} className="min-h-11 rounded border" disabled={disabled || index === items.length - 1} onClick={() => reorder(index, index + 1)} type="button">→</button>
                </div>
                <button className="min-h-11 w-full rounded border border-[#FCA5A5] text-xs font-semibold text-[#B91C1C]" disabled={disabled} onClick={() => remove(index)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="mt-5 rounded-xl bg-[#F8FAFC] p-5 text-center text-sm text-[#6B7280]">No images selected. Existing URL-only products can still be saved without images.</p>}

      {editingIndex !== null && items[editingIndex]?.kind === "upload" && items[editingIndex].originalFile ? (
        <ProductImageEditor file={items[editingIndex].originalFile} isPrimary={editingIndex === primary} onApply={(file) => applyEdit(editingIndex, file)} onCancel={() => setEditingIndex(null)} sourceUrl={items[editingIndex].originalUrl!} />
      ) : null}
      {editingIndex !== null && items[editingIndex]?.kind !== "upload" ? (
        <div aria-labelledby="edit-image-url-title" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-bold" id="edit-image-url-title">Edit image URL</h2>
            <label className="mt-4 block text-sm font-semibold" htmlFor="edit-product-image-url">Image URL</label>
            <input autoFocus className="mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] px-3" id="edit-product-image-url" onChange={(event) => setEditingUrl(event.target.value)} type="url" value={editingUrl} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="min-h-12 rounded-[10px] border border-[#D1D5DB] font-semibold" onClick={() => setEditingIndex(null)} type="button">Cancel</button>
              <button className="min-h-12 rounded-[10px] bg-[#2563EB] font-bold text-white" onClick={applyUrlEdit} type="button">Save URL</button>
            </div>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
