import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  if (typeof window !== "undefined") return path;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`;
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}

export function constructMetadata({
  title = "DocChat - Talk to PDFs ",
  description = "DocChat is a app for chatting to PDFs.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          alt: title,
        },
      ],
      siteName: title,
      type: "website",
      locale: "en_US",
      countryName: "India",
      url: absoluteUrl("/"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: "@DocChat",
      creator: "@r0ld3x",
    },
    icons,
    metadataBase: new URL("https://doctalk.pro"),
    ...(noIndex
      ? { noIndex }
      : {
          robots: {
            index: false,
            follow: false,
          },
        }),
  };
}
