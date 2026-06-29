import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => {});
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 } // Play when 60% is visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      onClick={togglePlay}
      className="relative w-full h-full bg-black/60 cursor-pointer flex items-center justify-center group overflow-hidden"
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted={isMuted}
        playsInline
        className="w-full max-h-[450px] object-contain"
      />

      {/* Floating play/pause states */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="p-4 rounded-full bg-cyber-bg/80 border border-cyber-border text-cyber-accent shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300">
          {isPlaying ? <Pause size={24} className="stroke-[2.5]" /> : <Play size={24} className="stroke-[2.5]" />}
        </div>
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 rounded-xl bg-cyber-bg/85 border border-cyber-border/80 text-white hover:text-cyber-accent hover:border-cyber-accent transition-all duration-200"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}
