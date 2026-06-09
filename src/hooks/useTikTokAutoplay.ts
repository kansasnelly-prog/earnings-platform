import { useEffect } from "react";

export function useTikTokAutoplay(videoRefs: React.RefObject<React.RefObject<HTMLVideoElement>[]> | React.MutableRefObject<React.RefObject<HTMLVideoElement>[]>) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            // Ensure video is muted for autoplay to work
            video.muted = true;
            video.play().catch((err) => {
              console.error('Autoplay failed:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current?.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [videoRefs]);
}
