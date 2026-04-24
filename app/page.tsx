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
            /* --- STARTSEITE --- */
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
              <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h1 className={`${playfair.className} text-white text-6xl md:text-8xl tracking-[0.4em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
              </div>

              <nav className="absolute right-[8vw] top-1/2 -translate-y-1/2 flex flex-col gap-6 items-end pointer-events-auto">
                {['Street', 'Portrait', 'Event', 'Landscape', 'B/W', 'Kontakt'].map((item) => (
                  <button 
                    key={item} 
                    onClick={() => handleNavigation(item)} 
                    // Hier bekommt Kontakt einen riesigen extra Abstand nach oben (mt-12 md:mt-16)
                    className={`bg-transparent border-none p-0 group cursor-pointer outline-none ${item === 'Kontakt' ? 'mt-12 md:mt-16' : ''}`}
                  >
                    <span className="text-white/30 group-hover:text-white transition-all duration-500 text-3xl font-light tracking-[0.3em] uppercase block transform group-hover:-translate-x-4">
                      {item}
                    </span>
                  </button>
                ))}
              </nav>
            </motion.div>
            
          ) : currentSection === "Kontakt" ? (
            /* --- KONTAKTSEITE --- */
            <motion.div key="kontakt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center text-center">
              
              {/* Flex-Container, um die Texte in der Mitte zu halten */}
              <div className="flex flex-col items-center justify-center flex-1">
                <h1 className={`${playfair.className} text-white/90 text-4xl md:text-6xl tracking-[0.3em] font-bold italic uppercase mb-8`}>
                  Felix Bosler
                </h1>
                <a href="mailto:boshaft@icloud.com" className="text-white/60 hover:text-white transition-colors text-lg md:text-xl tracking-[0.2em] font-light mb-6">
                  boshaft@icloud.com
                </a>
                <p className="text-white/30 tracking-[0.4em] uppercase text-xs md:text-sm">
                  Melde dich gerne bei mir.
                </p>
              </div>

              {/* Back Button - Fest ans untere Ende des Bildschirms gepinnt */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-2 hover:border-white/40 bg-transparent cursor-pointer"
                >
                  [ Back to Menu ]
                </button>
              </div>
            </motion.div>

          ) : (
            /* --- GALERIESEITE --- */
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black flex flex-col overflow-y-auto">
              
              <div className="p-12 md:p-16 flex flex-col gap-1 shrink-0">
                <h1 className={`${playfair.className} text-white/20 text-lg md:text-xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-tight`}>
                  {currentSection}
                </h2>
              </div>

              <div className="flex justify-center mb-12 shrink-0">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="text-white/20 hover:text-white transition-all text-[10px] tracking-[0.6em] uppercase border border-white/10 px-6 py-2 hover:border-white/40 bg-transparent cursor-pointer"
                >
                  [ Back to Menu ]
                </button>
              </div>

              <div className="px-4 md:px-24 pb-24 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {images.map((img, index) => (
                  <motion.div
                    key={img.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative w-full aspect-square cursor-zoom-in group overflow-hidden bg-white/5"
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsLightboxOpen(true);
                    }}
                  >
                    <Image 
                      src={img.url} 
                      alt={`Gallery Image ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </motion.div>
                ))}
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
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-2xl" 
              onClick={() => setIsLightboxOpen(false)} 
            />

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
              <Image 
                src={images[currentIndex].url} 
                alt="Fullscreen Gallery"
                fill
                priority={true}
                sizes="90vw"
                className="object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] pointer-events-none" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[60] opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}