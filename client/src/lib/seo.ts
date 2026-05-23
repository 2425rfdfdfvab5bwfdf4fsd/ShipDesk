import { useEffect } from "react";

const SITE_NAME = "ShipDesk";
const BASE_URL = "https://shipdesk-delta.vercel.app";
const DEFAULT_DESCRIPTION =
  "ShipDesk connects to GitHub and uses AI to write your weekly client status reports. Branded client portals, invoicing, file sharing, and messaging for freelance developers.";

interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noindex = false,
}: SEOOptions) {
  useEffect(() => {
    const fullTitle =
      title === SITE_NAME ? SITE_NAME : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    setMetaName("description", description);
    setMetaName("robots", noindex ? "noindex, nofollow" : "index, follow");

    const canonicalUrl =
      canonical ?? `${BASE_URL}${window.location.pathname.replace(/\/$/, "") || "/"}`;
    setCanonical(canonicalUrl);

    setMetaProperty("og:title", fullTitle);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);

    return () => {
      document.title = `${SITE_NAME} — AI Client Portal for Freelance Developers`;
      setMetaName(
        "description",
        DEFAULT_DESCRIPTION
      );
      setMetaName("robots", "index, follow");
      setCanonical(`${BASE_URL}/`);
    };
  }, [title, description, canonical, noindex]);
}
