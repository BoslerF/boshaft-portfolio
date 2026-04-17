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
    // Shutter-Effekt auslösen
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    // Verzögerung: Wir warten 250ms, bis die Blende im Video zu ist, dann wechseln wir
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

      {/* 1. DER SUCHER (Video als Rahmen, nur sichtbar wenn KEINE Sektion gewählt ist) */}
      <AnimatePresence>
        {!currentSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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

      {/* 2. INHALT (Menü oder Galerie) */}
      <div className="relative z-50 w-full h-screen">
        <AnimatePresence mode="wait">
          {!currentSection ? (
            /* STARTSEITE MENÜ */
            <motion.div 
              key="home" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="w-full h-full relative"
            >
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
            /* KATEGORIESEITE - Puristisch auf Schwarz */
            <motion.div 
              key="section" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center"
            >
              {/* Titel oben */}
              <div className="absolute top-12 left-12 flex flex-col gap-1 z-50">
                <h1 className={`${playfair.className} text-white/20 text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-4xl md:text-6xl uppercase tracking-widest italic`}>
                  {currentSection}
                </h2>
              </div>

              {/* Bild-Präsentation */}
              <div className="relative w-full h-full flex items-center justify-center p-6 md:p-20">
                {images.length > 0 && (
                  <img 
                    src={images[currentIndex].url} 
                    alt="Gallery"
                    onClick={() => setIsLightboxOpen(true)}
                    className="max-w-full max-h-[75vh] object-contain shadow-2xl cursor-zoom-in transition-all duration-500"
                  />
                )}

                {/* Navigation am unteren Rand der Galerie-Sektion */}
                <div className="absolute bottom-24 flex items-center gap-12">
                  <button onClick={prevImage} className="text-white/20 hover:text-white text-5xl px-4 py-2 transition-all select-none">‹</button>
                  <button onClick={nextImage} className="text-white/20 hover:text-white text-5xl px-4 py-2 transition-all select-none">›</button>
                </div>
              </div>

              {/* Back to Menu */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[1em] uppercase py-4"
                >
                  [ Back ]
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. LIGHTBOX */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)} 
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img 
              src={images[currentIndex].url} 
              className="max-w-full max-h-full object-contain" 
              onClick={(e) => e.stopPropagation()} 
            />
            <p className="absolute bottom-8 text-white/20 tracking-[0.5em] uppercase text-[10px]">Close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}