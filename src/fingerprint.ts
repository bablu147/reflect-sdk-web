import { BrowserFingerprint } from "./types";

/**
 * Collect a lightweight browser fingerprint for web-to-app attribution matching.
 * This does NOT use third-party cookies or tracking pixels.
 */
export function collectFingerprint(): BrowserFingerprint {
  return {
    canvas_hash: getCanvasHash(),
    webgl_renderer: getWebGLRenderer(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    screen_resolution: `${screen.width}x${screen.height}`,
    color_depth: screen.colorDepth,
  };
}

function getCanvasHash(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Reflect.web", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("fingerprint", 4, 17);

    const data = canvas.toDataURL();
    return hashString(data);
  } catch {
    return undefined;
  }
}

function getWebGLRenderer(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return undefined;
    const glCtx = gl as WebGLRenderingContext;
    const ext = glCtx.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return undefined;
    return glCtx.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
  } catch {
    return undefined;
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
