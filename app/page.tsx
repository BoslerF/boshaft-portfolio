/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const playfair = Playfair_Display({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

export default function Home() {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, any>[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hilfsfunktionen für die Navigation
  const nextImage = () => {
    setImages((prevImages) => {
      if (prevImages.length === 0) return prevImages;
      setCurrentIndex((prevIndex) => (prevIndex + 1) % prevImages.length);
      return prevImages;
    });
  };

  const prevImage = () => {
    setImages((prevImages) => {
      if (prevImages.length === 0) return prevImages;
      setCurrentIndex((prevIndex) => (prevIndex - 1 + prevImages.length) % prevImages.length);
      return prevImages;
    });
  };

  // 1. Tastatur-Steuerung (Pfeiltasten)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Nur beim Mounten registrieren

  useEffect(() => {
    async function fetchImages() {
      if (currentSection) {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("category", currentSection)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setImages(data);
          setCurrentIndex(0);
        }
      } else {
        setImages([]);
      }
    }
    fetchImages();
  }, [currentSection]);

  const handleNavigation = (section: string | null) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    setTimeout(() => { 
      setCurrentSection(section); 
    }, 250); 
  };

  return (
    <main className={`${geist.className} relative min-h-screen bg-black overflow-hidden flex items-center justify-center`}>
      <audio ref={audioRef} src="/shutter.mp4" preload="auto" />

      {/* 1. DER SUCHER (Nur Startseite) */}
      <AnimatePresence>
        {!currentSection && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 flex items-center justify-center bg-black p-4"
          >
            <div className="relative w-full h-full max-w-[1600px] max-h-[900px] flex items-center justify-center">
              <video 
                ref={videoRef}
                src="/viewfinder.mp4" 
                autoPlay
                preload="auto"
                className="w-full h-full object-contain pointer-events-none"
                muted
                playsInline
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. INHALT */}
      <div className="relative z-50 w-full h-screen">
        <AnimatePresence mode="wait">
          {!currentSection ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
              <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h1 className={`${playfair.className} text-white text-6xl md:text-8xl tracking-[0.4em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
              </div>

              <nav className="absolute right-[8vw] top-1/2 -translate-y-1/2 flex flex-col gap-6 items-end pointer-events-auto">
                {['Street', 'Portrait', 'Event', 'Landscape'].map((item) => (
                  <button key={item} onClick={() => handleNavigation(item)} className="bg-transparent border-none p-0 group cursor-pointer outline-none">
                    <span className="text-white/30 group-hover:text-white transition-all duration-500 text-3xl font-light tracking-[0.3em] uppercase block transform group-hover:-translate-x-4">
                      {item}
                    </span>
                  </button>
                ))}
              </nav>
            </motion.div>
          ) : (
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col">
              
              <div className="p-12 md:p-16 flex flex-col gap-1">
                <h1 className={`${playfair.className} text-white/20 text-lg md:text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-tight`}>
                  {currentSection}
                </h2>
              </div>

              <div className="flex justify-center mb-6">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-2 hover:border-white/40 bg-transparent cursor-pointer"
                >
                  [ Back to Menu ]
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center relative px-12 md:px-24 pb-20 overflow-hidden">
                {images.length > 1 && (
                  <button onClick={(e) => {e.stopPropagation(); prevImage();}} className="text-white/20 hover:text-white text-6xl md:text-8xl transition-all z-50 select-none bg-transparent border-none mx-6 md:mx-12 cursor-pointer">
                    ‹
                  </button>
                )}

                {images.length > 0 && (
                  <div className="relative w-[50vw] h-[50vh] flex items-center justify-center">
                    <motion.img 
                      key={currentIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      src={images[currentIndex].url} 
                      alt="Gallery"
                      onClick={() => setIsLightboxOpen(true)}
                      // Swipe Funktionalität für Handy
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(e, info) => {
                        if (info.offset.x < -50) nextImage();
                        if (info.offset.x > 50) prevImage();
                      }}
                      className="max-w-full max-h-full object-contain shadow-2xl transition-all cursor-pointer touch-none"
                    />
                  </div>
                )}

                {images.length > 1 && (
                  <button onClick={(e) => {e.stopPropagation(); nextImage();}} className="text-white/20 hover:text-white text-6xl md:text-8xl transition-all z-50 select-none bg-transparent border-none mx-6 md:mx-12 cursor-pointer">
                    ›
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. DETAILANSICHT (Lightbox) */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)} 
            // Hier ist der Blur-Effekt: bg-black/60 macht es leicht durchsichtig, backdrop-blur-2xl macht es unscharf
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-8 md:p-16 cursor-zoom-out"
          >
            {/* Hier wird die Größe begrenzt: max-w-[65vw] und max-h-[65vh] */}
            <div className="relative max-w-[65vw] max-h-[65vh] flex items-center justify-center">
              <motion.img 
                key={currentIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={images[currentIndex].url} 
                // cursor-default verhindert, dass das Bild selbst wie ein Schließen-Button wirkt
                className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] touch-none cursor-default" 
                onClick={(e) => e.stopPropagation()} 
                // Swipe auch in der Detailansicht
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -100) nextImage();
                  if (info.offset.x > 100) prevImage();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[60] opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}