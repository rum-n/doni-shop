"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface VideoBackgroundProps {
  videoSrc?: string;
  /** Still image shown underneath, and used on its own on poor connections. */
  fallbackImage?: string;
  overlayOpacity?: number;
  className?: string;
}

/** Connection hints, which only some browsers expose. */
type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

const SLOW_CONNECTIONS = ["slow-2g", "2g", "3g"];

/**
 * Hero background: the video is the default, the still is the fallback.
 *
 * `absolute`, not `fixed` — it fills the positioned section it is placed in,
 * so the page scrolls past it normally and the footer sits below rather than
 * sliding over the top.
 *
 * The still is painted first and the video fades in over it once frames are
 * actually rendering. That means no spinner and no hard swap: the hero is never
 * blank, and on a slow link the image simply stays. The video is skipped
 * outright when the browser reports a metered or slow connection, or when the
 * visitor prefers reduced motion.
 */
export default function VideoBackground({
  videoSrc = "/home-vid.mp4",
  fallbackImage,
  overlayOpacity = 0.2,
  className = "",
}: VideoBackgroundProps) {
  // Decided on the client, where motion preference and connection are known.
  const [useVideo, setUseVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;

    const metered = connection?.saveData === true;
    const slow = Boolean(
      connection?.effectiveType &&
        SLOW_CONNECTIONS.includes(connection.effectiveType)
    );

    setUseVideo(!prefersReducedMotion && !metered && !slow);
  }, []);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Painted first and never removed, so there is always something behind
          the video — and it is what remains if the video never arrives. */}
      {fallbackImage && (
        <Image
          src={fallbackImage}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      )}

      {useVideo && !failed && (
        <video
          // Only mp4 is shipped; the old .webm/.ogg sources pointed at files
          // that do not exist.
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          // `playing`, not `loadeddata`: by then real frames are on screen, so
          // the fade never reveals a black rectangle.
          onPlaying={() => setIsPlaying(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Darkens the background so the overlaid text stays readable. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
    </div>
  );
}
