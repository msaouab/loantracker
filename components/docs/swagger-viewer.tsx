"use client";

import { useEffect } from "react";

type SwaggerUIGlobal = (options: Record<string, unknown>) => void;

/**
 * Renders self-hosted Swagger UI (assets under /public/swagger, no external CDN).
 * The container forces a light color scheme + solid background so the docs stay
 * readable when the app is in dark mode.
 */
export function SwaggerViewer() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/swagger/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "/swagger/swagger-ui-bundle.js";
    script.onload = () => {
      const SwaggerUIBundle = (window as unknown as { SwaggerUIBundle?: SwaggerUIGlobal })
        .SwaggerUIBundle;
      SwaggerUIBundle?.({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <div
      id="swagger-ui"
      style={{ colorScheme: "light", background: "#ffffff", minHeight: "100dvh" }}
    />
  );
}
