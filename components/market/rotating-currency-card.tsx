"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import type { CurrencyMarketItem } from "@/lib/types/market";

const ROTATION_DELAY = 3000;
const FADE_DELAY = 120;

type RotatingCurrencyCardProps = {
  currencies: readonly CurrencyMarketItem[];
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RotatingCurrencyCard({ currencies }: RotatingCurrencyCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [manualReset, setManualReset] = useState(0);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectCurrency = useCallback(
    (nextIndex: number, manual = false) => {
      const normalizedIndex = (nextIndex + currencies.length) % currencies.length;

      if (manual) {
        setManualReset((value) => value + 1);
      }

      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        setCurrentIndex(normalizedIndex);
        setIsVisible(true);
        return;
      }

      setIsVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setCurrentIndex(normalizedIndex);
        setIsVisible(true);
      }, FADE_DELAY);
    },
    [currencies.length],
  );

  useEffect(() => {
    if (isHovered || isFocusWithin || currencies.length < 2) {
      return;
    }

    const rotationTimer = setTimeout(() => {
      selectCurrency(currentIndex + 1);
    }, ROTATION_DELAY);

    return () => clearTimeout(rotationTimer);
  }, [currencies.length, currentIndex, isFocusWithin, isHovered, manualReset, selectCurrency]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectCurrency(currentIndex - 1, true);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectCurrency(currentIndex + 1, true);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocusWithin(false);
    }
  }

  if (currencies.length === 0) {
    return null;
  }

  const currency = currencies[currentIndex];
  const directionClass = currency.direction === "down" ? "text-[#FCA5A5]" : "text-[#86EFAC]";

  return (
    <div
      aria-label="Rotating sample currency rates. Use left and right arrow keys to change currency."
      className="min-w-0 rounded-[10px] border border-white/15 bg-white/[0.07] px-1 py-0.5 focus-within:border-[#60A5FA]"
      onBlurCapture={handleBlur}
      onFocusCapture={() => setIsFocusWithin(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          aria-label="Show previous currency"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] motion-reduce:transition-none"
          onClick={() => selectCurrency(currentIndex - 1, true)}
          type="button"
        >
          <ChevronIcon direction="left" />
        </button>

        <div
          className={`min-w-0 flex-1 text-center transition-opacity duration-150 motion-reduce:transition-none ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <p className="truncate text-[10px] font-semibold leading-3 text-slate-300 sm:text-[11px]">{currency.label}</p>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-sm font-bold leading-4 tabular-nums text-white">{currency.value}</span>
            <span className={`hidden text-[10px] font-semibold tabular-nums sm:inline ${directionClass}`}>
              {currency.change}
            </span>
          </div>
          <span className="sr-only">Currency {currentIndex + 1} of {currencies.length}</span>
          <div aria-hidden="true" className="mt-0.5 flex h-1 justify-center gap-0.5">
            {currencies.map((item, index) => (
              <span
                key={item.id}
                className={`h-1 rounded-full transition-[width,background-color] duration-150 motion-reduce:transition-none ${
                  index === currentIndex ? "w-2 bg-[#60A5FA]" : "w-1 bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          aria-label="Show next currency"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] motion-reduce:transition-none"
          onClick={() => selectCurrency(currentIndex + 1, true)}
          type="button"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

    </div>
  );
}
