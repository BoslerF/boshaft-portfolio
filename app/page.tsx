/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";

// Supabase Client Initialisierung
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

  // Bilder laden und Index zurücksetzen, wenn Kategorie wechselt
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
    // Wenn in eine Sektion gewechselt wird: Auslöser spielen!
    if (section !== null) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }

    // Kurze Verzögerung, damit das Video schließen kann, bevor der Text wechselt
    setTimeout(() => { 
      setCurrentSection(section); 
    }, 200); 
  };

  // Navigation durch die Bilder
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Verhindert, dass die Vorschau beim Klick auf Pfeil öffnet
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Verhindert, dass die Vorschau beim Klick auf Pfeil öffnet
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <main className={`${geist.className} relative min-h-screen bg-black overflow-hidden flex items-center justify-center`}>
      <audio ref={audioRef} src="/shutter.mp4" preload="auto" />

      {/* 1. DER SUCHER (Basis-Hintergrund mit Video) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-black p-4">
        <div className="relative w-full h-full max-w-[1600px] max-h-[900px] flex items-center justify-center">
          
          <video 
            ref={videoRef}
            src="/viewfinder.mp4" 
            autoPlay
            preload="auto"
            className="w-full h-full object-contain z-20 pointer-events-none opacity-100"
            muted
            playsInline
          />

          {/* VORSCHAU: RECHTECKIG MIT ABGERUNDETEN ECKEN */}
          <AnimatePresence>
            {currentSection && images.length > 0 && !isLightboxOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                // w-[50vw] sorgt für die "kleinere" Vorschau, die in den Sucher passt
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] max-w-[500px] aspect-[4/3] rounded-[40px] overflow-hidden z-30 pointer-events-auto group shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
              >
                <img 
                  src={images[currentIndex].url} 
                  alt="Preview"
                  onClick={() => setIsLightboxOpen(true)}
                  className="w-full h-full object-cover scale-110 opacity-80 grayscale mix-blend-multiply cursor-zoom-in transition-transform duration-700 hover:scale-[1.2]"
                />

                {/* Pfeile in der Vorschau */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl px-2">
                      &#8249;
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl px-2">
                      &#8250;
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. DYNAMISCHES LAYOUT (Texte & Menü) */}
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
            /* --- SEKTIONS-ANSICHT --- */
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative pt-12 md:pt-24 pl-20 md:pl-40 flex flex-col items-start pointer-events-none">
              <div className="flex flex-col gap-2 pointer-events-none">
                <h1 className={`${playfair.className} text-white/40 text-2xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-5xl md:text-8xl uppercase tracking-widest italic leading-none`}>
                  {currentSection}
                </h2>
              </div>

              {/* Back button */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                <button onClick={() => handleNavigation(null)} className="bg-transparent border-none text-white/20 hover:text-white transition-all text-xs tracking-[1em] uppercase cursor-pointer py-4">
                  [ Back to Menu ]
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. LIGHTBOX (Hochauflösende Ansicht) */}
      <AnimatePresence>
        {isLightboxOpen && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // WICHTIG: Das Schließen-Event liegt auf diesem Container
            onClick={() => setIsLightboxOpen(false)}
            // bg-black/95 sorgt für das tiefe Schwarz und verdeckt den Sucher
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* Bild-Container mit fester Maximalgröße (Vermeidet 'riesig') */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.1 }}
              //max-w-[1200px] und max-h-[80vh] garantieren einen großen Rand drumherum
              className="relative max-w-[1200px] max-h-[80vh] flex items-center justify-center"
              // Verhindert, dass der Klick auf das BILD selbst die Lightbox schließt
              onClick={(e) => e.stopPropagation()} 
            >
              <img 
                key={currentIndex} 
                src={images[currentIndex].url} 
                className="w-full h-full object-contain shadow-2xl" 
              />
            </motion.div>

            {/* Pfeile in der Lightbox */}
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8">
                  &#8249;
                </button>
                <button onClick={nextImage} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8">
                  &#8250;
                </button>
              </>
            )}

            {/* Hinweis-Text */}
            <p className="absolute bottom-8 text-white/30 tracking-[0.5em] uppercase text-[10px] pointer-events-none">Close</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copyright */}
      <div className="absolute bottom-8 right-8 z-10 opacity-10 pointer-events-none">
        <p className="text-[10px] tracking-[1em] uppercase text-white">© 2026</p>
      </div>
    </main>
  );
}