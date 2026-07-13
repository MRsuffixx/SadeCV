"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "light";
          size: "flexible";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileField({ className = "" }: { className?: string }) {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState(
    !siteKey && process.env.NODE_ENV !== "production"
      ? "development-bypass"
      : "",
  );

  const renderWidget = useCallback(() => {
    if (
      !ready ||
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetId.current
    ) {
      return;
    }

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
      theme: "light",
      size: "flexible",
    });
  }, [ready, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget]);

  return (
    <div className={className}>
      {siteKey ? (
        <>
          <Script
            id={`turnstile-${generatedId}`}
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={() => setReady(true)}
          />
          <div ref={containerRef} className="min-h-[65px] overflow-hidden" />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[#277b67]/30 bg-[#eff8f4] px-3 py-2.5 text-xs leading-5 text-[#466158]">
          Turnstile is in local development mode. Add its site and secret keys
          before production.
        </div>
      )}
      <input type="hidden" name="turnstileToken" value={token} />
    </div>
  );
}

