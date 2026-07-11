import type { ProductCardProduct } from "@/components/product/product-card";

export const sampleProducts = [
  { id: "aurora", name: "Aurora Pro Wireless Headphones", brand: "Northstar Audio", imageSrc: "/products/aurora-headphones.svg", imageAlt: "Blue Aurora Pro over-ear wireless headphones", price: 7499, storeCount: 6, productHref: "/products/aurora-pro-wireless-headphones", dealsHref: "/products/aurora-pro-wireless-headphones#deals" },
  { id: "pulse", name: "Pulse Active Smart Watch", brand: "Vela", imageSrc: "/products/pulse-watch.svg", imageAlt: "Black Pulse Active smart watch with a blue display", price: 4299, storeCount: 4, productHref: "/products/pulse-active-smart-watch", dealsHref: "/products/pulse-active-smart-watch#deals", initiallyWishlisted: true },
  { id: "echo", name: "Echo Mini Portable Speaker", brand: "Sonora", imageSrc: "/products/echo-speaker.svg", imageAlt: "Compact blue Echo Mini wireless speaker", price: 2799, storeCount: 3, productHref: "/products/echo-mini-portable-speaker", dealsHref: "/products/echo-mini-portable-speaker#deals" },
  { id: "studio", name: "Studio Max Noise-Cancelling Headphones", brand: "Northstar Audio", imageSrc: "/products/aurora-headphones.svg", imageAlt: "Blue Studio Max over-ear headphones", price: 9999, storeCount: 8, productHref: "/products/studio-max-headphones", dealsHref: "/products/studio-max-headphones#deals" },
  { id: "active", name: "Active Fit GPS Smartwatch", brand: "Vela", imageSrc: "/products/pulse-watch.svg", imageAlt: "Black Active Fit GPS smartwatch", price: 5999, storeCount: 5, productHref: "/products/active-fit-smartwatch", dealsHref: "/products/active-fit-smartwatch#deals" },
  { id: "sonic", name: "Sonic Go Wireless Speaker", brand: "Sonora", imageSrc: "/products/echo-speaker.svg", imageAlt: "Blue Sonic Go wireless speaker", price: 3499, storeCount: 7, productHref: "/products/sonic-go-speaker", dealsHref: "/products/sonic-go-speaker#deals" },
] satisfies ProductCardProduct[];
