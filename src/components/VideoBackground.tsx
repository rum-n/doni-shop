"use client";

import { useState, useEffect } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  posterSrc?: string;
  fallbackImage?: string;
  overlayOpacity?: number;
  className?: string;
}

export default function VideoBackground({
  videoSrc = "/home-vid.mp4",
  posterSrc = "/video-poster.jpg",
  fallbackImage,
  overlayOpacity = 0.2,
  className = "",
}: VideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);

  useEffect(() => {
    // Reset states when video source changes
    setIsVideoLoaded(false);
    setIsVideoError(false);
  }, [videoSrc]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoError(true);
  };

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* Video Background */}
      {!isVideoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={posterSrc}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc.replace(".mp4", ".webm")} type="video/webm" />
          <source src={videoSrc.replace(".mp4", ".ogg")} type="video/ogg" />
        </video>
      )}

      {/* Fallback Background */}
      {(isVideoError || !isVideoLoaded) && (
        <div className="absolute inset-0">
          {fallbackImage && (
            <img
              src={fallbackImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Overlay for content readability */}
      <div
        className="absolute inset-0 bg-black/20"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      ></div>

      {/* Loading indicator */}
      {!isVideoLoaded && !isVideoError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/50"></div>
        </div>
      )}
    </div>
  );
}
