/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

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

  // Hilfsfunktionen für die Lightbox-Navigation
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

  // Tastatur-Steuerung (Pfeiltasten)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function fetchImages() {
      if (currentSection && currentSection !== "Kontakt") {
        const dbCategory = currentSection === "B/W" ? "BW" : currentSection;

        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("category", dbCategory)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setImages(data);
          setCurrentIndex(0); // Setzt das angeklickte Bild auf 0, wenn die Kategorie gewechselt wird
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
            /* --- STARTSEITE --- */
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
              <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h1 className={`${playfair.className} text-white text-6xl md:text-8xl tracking-[0.4em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
              </div>

              <nav className="absolute right-[8vw] top-1/2 -translate-y-1/2 flex flex-col gap-6 items-end pointer-events-auto">
                {/* Spacer erzeugt die saubere Lücke vor Kontakt */}
                {['Street', 'Portrait', 'Event', 'Landscape', 'B/W', 'spacer', 'Kontakt'].map((item) => {
                  if (item === 'spacer') {
                    return <div key="spacer" className="h-4 md:h-6" aria-hidden="true" />;
                  }

                  return (
                    <button 
                      key={item} 
                      onClick={() => handleNavigation(item)} 
                      className="bg-transparent border-none p-0 group cursor-pointer outline-none"
                    >
                      <span className="text-white/30 group-hover:text-white transition-all duration-500 text-3xl font-light tracking-[0.3em] uppercase block transform group-hover:-translate-x-4">
                        {item}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
            
          ) : currentSection === "Kontakt" ? (
            /* --- KONTAKTSEITE --- */
            <motion.div key="kontakt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center text-center">
              <h1 className={`${playfair.className} text-white/90 text-4xl md:text-6xl tracking-[0.3em] font-bold italic uppercase mb-8`}>
                Felix Bosler
              </h1>
              <a href="mailto:boshaft@icloud.com" className="text-white/60 hover:text-white transition-colors text-lg md:text-xl tracking-[0.2em] font-light mb-6">
                boshaft@icloud.com
              </a>
              <p className="text-white/30 tracking-[0.4em] uppercase text-xs md:text-sm">
                Melde dich gerne bei mir.
              </p>
              
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-2 hover:border-white/40 bg-transparent cursor-pointer"
                >
                  [ Back to Menu ]
                </button>
              </div>
            </motion.div>

          ) : (
            /* --- GALERIESEITE (KACHEL-SYSTEM / MASONRY) --- */
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col">
              
              {/* Header (Oben fixiert) */}
              <div className="p-8 md:p-12 flex flex-col gap-1 shrink-0 z-20 bg-gradient-to-b from-black via-black/80 to-transparent pb-12 pointer-events-none">
                <h1 className={`${playfair.className} text-white/20 text-lg md:text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-tight`}>
                  {currentSection}
                </h2>
              </div>

              {/* Grid Container (Scrollbar) */}
              <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-32 pt-2 hide-scrollbar">
                {/* 1 Spalte auf Handy, 2 auf Tablets, 3 auf PCs */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
                  {images.map((image, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      // break-inside-avoid verhindert, dass ein Bild über zwei Spalten bricht
                      className="relative break-inside-avoid cursor-zoom-in group rounded-md overflow-hidden"
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsLightboxOpen(true);
                      }}
                    >
                      {/* Hier nutzen wir absichtlich <img/> für die perfekte Höhen-Berechnung im Kachelsystem */}
                      <img 
                        src={image.url} 
                        alt="Gallery Tile"
                        loading="lazy"
                        className="w-full h-auto object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Back Button (Immer fest unten im Bild) */}
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="bg-black/70 text-white/40 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-3 hover:border-white/40 cursor-pointer backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                >
                  [ Back to Menu ]
                </button>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-16 cursor-zoom-out"
          >
            {/* Hintergrund Layer für Blur und Schließen */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-2xl" 
              onClick={() => setIsLightboxOpen(false)} 
            />

            {images.length > 1 && (
              <button onClick={(e) => {e.stopPropagation(); prevImage();}} className="absolute left-4 md:left-12 z-50 text-white/20 hover:text-white text-5xl md:text-7xl transition-all select-none bg-transparent border-none cursor-pointer">
                ‹
              </button>
            )}

            <motion.div 
              key={currentIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 w-[90vw] h-[85vh] touch-none cursor-default" 
              onClick={(e) => e.stopPropagation()} 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -100) nextImage();
                if (info.offset.x > 100) prevImage();
              }}
            >
              {/* Hier nutzen wir Next Image für beste Performance in der Großansicht */}
              <Image 
                src={images[currentIndex].url} 
                alt="Fullscreen Gallery"
                fill
                priority={true}
                sizes="90vw"
                className="object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] pointer-events-none" 
              />
            </motion.div>

            {images.length > 1 && (
              <button onClick={(e) => {e.stopPropagation(); nextImage();}} className="absolute right-4 md:right-12 z-50 text-white/20 hover:text-white text-5xl md:text-7xl transition-all select-none bg-transparent border-none cursor-pointer">
                ›
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[60] opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}