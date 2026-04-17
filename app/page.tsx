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

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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
            /* STARTSEITE */
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
            /* KATEGORIESEITE */
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col">
              
              {/* Header: Oben Links */}
              <div className="p-8 md:p-12 flex flex-col gap-1">
                <h1 className={`${playfair.className} text-white/20 text-lg md:text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-tight`}>
                  {currentSection}
                </h2>
              </div>

              {/* Back Button: Separiert über dem Galerie-Container */}
              <div className="flex justify-center mb-4">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-2 hover:border-white/40"
                >
                  [ Back to Menu ]
                </button>
              </div>

              {/* Galerie Bereich: Zentriert mit Pfeilen daneben */}
              <div className="flex-1 flex items-center justify-center relative px-12 md:px-24 pb-12">
                
                {/* Linker Pfeil */}
                {images.length > 1 && (
                  <button 
                    onClick={prevImage} 
                    className="text-white/20 hover:text-white text-5xl md:text-7xl p-4 transition-all z-50 select-none mr-4 md:mr-10"
                  >
                    ‹
                  </button>
                )}

                {/* Bildvorschau: Kleiner skaliert */}
                {images.length > 0 && (
                  <div className="relative max-w-[70vw] max-h-[60vh] flex items-center justify-center">
                    <img 
                      src={images[currentIndex].url} 
                      alt="Gallery"
                      onClick={() => setIsLightboxOpen(true)}
                      // cursor-default entfernt die Lupe
                      className="max-w-full max-h-full object-contain shadow-2xl cursor-default transition-all"
                    />
                  </div>
                )}

                {/* Rechter Pfeil */}
                {images.length > 1 && (
                  <button 
                    onClick={nextImage} 
                    className="text-white/20 hover:text-white text-5xl md:text-7xl p-4 transition-all z-50 select-none ml-4 md:ml-10"
                  >
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)} // Schließt beim Klick außerhalb
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 md:p-20 cursor-pointer"
          >
            <div className="relative max-w-[85vw] max-h-[85vh] flex items-center justify-center">
              <img 
                src={images[currentIndex].url} 
                className="max-w-full max-h-full object-contain cursor-default shadow-2xl" 
                onClick={(e) => e.stopPropagation()} // Verhindert Schließen bei Klick AUF das Bild
              />
            </div>
            <p className="absolute bottom-6 text-white/10 tracking-[1em] uppercase text-[9px] pointer-events-none">
              Click outside to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[60] opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}