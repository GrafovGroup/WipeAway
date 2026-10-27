import type { MetadataRoute } from "next";
import { articles, cities, productDetails } from "./content";

export default function sitemap():MetadataRoute.Sitemap{
  const base="https://wipeaway.ca";
  const fixed=["","/about","/products","/order","/locations","/clients-that-use-our-wipe-stands","/blog"];
  return [
    ...fixed.map((path,i)=>({url:`${base}${path}`,lastModified:new Date("2026-10-27"),changeFrequency:(i===0?"weekly":"monthly") as "weekly"|"monthly",priority:i===0?1:.7})),
    ...Object.keys(productDetails).map(slug=>({url:`${base}/products/${slug}`,lastModified:new Date("2026-10-27"),changeFrequency:"monthly" as const,priority:.8})),
    ...cities.map(city=>({url:`${base}/locations/${city.slug}`,lastModified:new Date("2026-10-27"),changeFrequency:"monthly" as const,priority:.65})),
    ...Object.keys(articles).map(slug=>({url:`${base}/blog/${slug}`,lastModified:new Date("2026-10-27"),changeFrequency:"monthly" as const,priority:.6})),
  ];
}
