/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE VERBINDUNG ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- SCHRIFTARTEN ---
const playfair = Playfair_Display({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

export default function Home() {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, any>[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Wir trennen die Kategorien vom "Contact"-Button
  const categories = ['Street', 'Portrait', 'Event', 'Nature', 'B/W'];

  // --- DATEN LADEN ---
  useEffect(() => {
    async function fetchImages() {
      if (currentSection && currentSection !== "Contact") {
        const dbCategory = currentSection === "B/W" ? "BW" : currentSection;
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("category", dbCategory)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setImages(data);
        }
      } else {
        setImages([]);
      }
    }
    fetchImages();
  }, [currentSection]);

  // --- NAVIGATION ---
  const handleNavigation = (section: string | null) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setTimeout(() => setCurrentSection(section), 250); 
  };

  // =======================================================================
  // DIE LOGIK FÜR DAS 3-SPALTEN-GRID
  // =======================================================================
  const columns: Record<string, any>[][] = [[], [], []];
  
  images.forEach((img, index) => {
    columns[index % 3].push(img);
  });

  return (
    <main className={`${geist.className} relative min-h-screen bg-black text-white overflow-hidden`}>
      <audio ref={audioRef} src="/shutter.mp4" preload="auto" />

      <AnimatePresence mode="wait">
        
        {/* ================= 1. STARTSEITE / MENÜ ================= */}
        {!currentSection ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8">
            {/* Video-Hintergrund */}
            <div className="absolute inset-0 z-0 flex items-center justify-center p-4 pointer-events-none">
              <video ref={videoRef} src="/viewfinder.mp4" autoPlay muted playsInline className="w-full h-full max-w-[1600px] max-h-[900px] object-contain opacity-70" />
            </div>

            {/* Hauptüberschrift */}
            <div className="absolute top-[8vh] md:top-[10vh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-center w-full px-4 pointer-events-none">
              <h1 className={`${playfair.className} text-4xl md:text-6xl lg:text-7xl font-bold italic tracking-[0.1em] md:tracking-[0.15em] uppercase mb-1 md:mb-2`}>
                Felix Bosler
              </h1>
              <h2 className={`${playfair.className} text-base md:text-xl font-bold italic tracking-[0.3em] text-white/80`}>
                aka. BOSHAFT
              </h2>
            </div>

            {/* Zentrierte Kategorie-Navigation */}
            <nav className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4 md:gap-5">
              {categories.map((item) => (
                <button 
                  key={item}
                  onClick={() => handleNavigation(item)}
                  className="bg-transparent border-none p-0 cursor-pointer outline-none"
                >
                  <span className="text-white/60 hover:text-white transition-all duration-500 text-xl md:text-2xl font-light tracking-[0.2em] uppercase">
                    {item}
                  </span>
                </button>
              ))}
            </nav>

            {/* Kontakt-Button */}
            <div className="absolute bottom-[5vh] md:bottom-[8vh] left-1/2 -translate-x-1/2 z-10">
              <button 
                onClick={() => handleNavigation('Contact')}
                className="bg-transparent border-none p-0 cursor-pointer outline-none"
              >
                <span className="text-white/40 hover:text-white transition-all duration-500 text-lg md:text-xl font-light tracking-[0.2em] uppercase">
                  Contact
                </span>
              </button>
            </div>

          </motion.div>
          
        ) : currentSection === "Contact" ? (
          
          /* ================= 2. KONTAKT ================= */
          <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center">
            
            <button 
              onClick={() => handleNavigation(null)} 
              className="bg-transparent border-none p-0 cursor-pointer group outline-none mb-8"
            >
              <h2 className={`${playfair.className} text-white/90 group-hover:text-white transition-colors duration-500 text-4xl md:text-6xl tracking-[0.3em] font-bold italic uppercase`}>
                Felix Bosler
              </h2>
            </button>

            <a href="mailto:boshaft@icloud.com" className="text-white/60 hover:text-white transition-colors text-lg md:text-xl tracking-[0.2em] font-light mb-6">
              boshaft@icloud.com
            </a>
            <p className="text-white/30 tracking-[0.4em] uppercase text-xs md:text-sm">
              Melde dich gerne bei mir.
            </p>
          </motion.div>
          
        ) : (

          /* ================= 3. GALERIE ================= */
          <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full">
            
            {/* DER GESAMTE BEREICH IST JETZT EIN EINZIGER SCROLL-CONTAINER */}
            <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Header: Liegt jetzt IM Scrollbereich und wandert mit nach oben */}
              <div className="pt-12 pb-12 px-4 flex flex-col items-center text-center">
                <button 
                  onClick={() => handleNavigation(null)} 
                  className="bg-transparent border-none p-0 cursor-pointer group outline-none"
                >
                  <h1 className={`${playfair.className} text-white/40 group-hover:text-white transition-colors duration-500 text-sm md:text-base tracking-[0.6em] font-bold italic uppercase`}>
                    BOSHAFT
                  </h1>
                </button>
                
                <h2 className={`${playfair.className} text-white/90 text-3xl md:text-5xl uppercase tracking-widest italic leading-tight mt-4`}>
                  {currentSection}
                </h2>
              </div>

              {/* GRID CONTAINER: px-4 (Handy) oder px-8 (Laptop) erzeugt den perfekten äußeren Rand */}
              <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8">
                
                {/* gap-4 / gap-8 regelt den perfekten Abstand ZWISCHEN den Spalten (ca 32px auf Laptop) */}
                <div className="flex items-start gap-4 md:gap-8 w-full">
                  
                  {columns.map((lane, laneIndex) => (
                    // flex-1 sorgt dafür, dass alle 3 Spalten absolut identisch breit sind
                    // gap-4 / gap-8 regelt hier den Abstand NACH UNTEN zwischen den Bildern
                    <div key={laneIndex} className="flex flex-col flex-1 gap-4 md:gap-8 w-full">
                      
                      {lane.map((image, imageIndex) => (
                        <div key={imageIndex} className="w-full">
                          <img 
                            src={image.url} 
                            alt="Gallery" 
                            loading="lazy"
                            className="w-full h-auto display-block rounded-sm opacity-90 hover:opacity-100 transition-opacity duration-300"
                          />
                        </div>
                      ))}

                    </div>
                  ))}

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}