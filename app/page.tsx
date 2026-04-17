/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";

// Supabase Client
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
    // Sound und Video-Shutter abspielen
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    // Kurze Verzögerung, damit die Blende schließt, bevor das Menü wechselt
    setTimeout(() => { 
      setCurrentSection(section); 
    }, 200); 
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

      {/* 1. DER SUCHER (Läuft immer im Hintergrund auf der Startseite) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-black p-4">
        <video 
          ref={videoRef}
          src="/viewfinder.mp4" 
          autoPlay
          preload="auto"
          className="w-full h-full object-contain pointer-events-none opacity-100"
          muted
          playsInline
        />
      </div>

      {/* 2. DYNAMISCHES LAYOUT */}
      <div className="relative z-50 w-full h-screen pointer-events-none">
        <AnimatePresence mode="wait">
          {!currentSection ? (
            /* --- STARTSEITE --- */
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative pointer-events-auto">
              <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 pointer-events-none text-center">
                <h1 className={`${playfair.className} text-white text-6xl md:text-8xl tracking-[0.4em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
              </div>

              <nav className="absolute right-[8vw] top-1/2 -translate-y-1/2 flex flex-col gap-6 items-end">
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
            /* --- KATEGORIESEITE (Verdeckt das Video komplett mit bg-black) --- */
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col pointer-events-auto z-40">
              
              {/* Überschriften oben links */}
              <div className="absolute top-8 left-8 md:top-12 md:left-12 flex flex-col gap-1 pointer-events-none z-50">
                <h1 className={`${playfair.className} text-white/40 text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-none`}>
                  {currentSection}
                </h2>
              </div>

              {/* Einfache Bildergalerie */}
              {images.length > 0 && (
                <div className="relative w-full h-full flex items-center justify-center p-8 md:p-24">
                  <img 
                    src={images[currentIndex].url} 
                    alt="Gallery"
                    onClick={() => setIsLightboxOpen(true)}
                    className="max-w-full max-h-[70vh] object-contain cursor-zoom-in shadow-2xl"
                  />

                  {/* Pfeile direkt in der Galerie */}
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 md:left-12 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 cursor-pointer">
                        ‹
                      </button>
                      <button onClick={nextImage} className="absolute right-4 md:right-12 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 cursor-pointer">
                        ›
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ZURÜCK BUTTON GANZ UNTEN */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button onClick={() => handleNavigation(null)} className="bg-transparent border-none text-white/30 hover:text-white transition-all text-[11px] tracking-[0.5em] uppercase cursor-pointer py-4">
                  [ Back to Menu ]
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. LIGHTBOX (Vollbild-Ansicht) */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)} 
            className="fixed inset-0 z-[999] bg-[rgba(0,0,0,0.98)] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img 
              src={images[currentIndex].url} 
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain cursor-default" 
              onClick={(e) => e.stopPropagation()} 
            />

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 md:left-12 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 cursor-pointer">
                  ‹
                </button>
                <button onClick={nextImage} className="absolute right-4 md:right-12 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 cursor-pointer">
                  ›
                </button>
              </>
            )}

            <p className="absolute bottom-8 text-white/20 tracking-[0.5em] uppercase text-[10px] pointer-events-none">
              Click background to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 right-8 z-10 opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}