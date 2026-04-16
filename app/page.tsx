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

// --- SWIPE LOGIK & ANIMATIONEN ---
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const sliderVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 0.8,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const lightboxVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 800 : -800,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 800 : -800,
    opacity: 0,
  }),
};

export default function Home() {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, any>[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  
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

    setTimeout(() => { 
      setCurrentSection(section); 
    }, 200); 
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + images.length) % images.length);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    paginate(1);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    paginate(-1);
  };

  return (
    <main className={`${geist.className} relative min-h-screen bg-black overflow-hidden flex items-center justify-center`}>
      <audio ref={audioRef} src="/shutter.mp4" preload="auto" />

      {/* 1. DER SUCHER */}
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

          {/* VORSCHAU: KLEINER & WISCHBAR (Bleibt jetzt immer im Hintergrund) */}
          <AnimatePresence>
            {currentSection && images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] max-w-[350px] aspect-[4/3] rounded-[30px] overflow-hidden z-30 pointer-events-auto group shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center"
              >
                <AnimatePresence initial={false} custom={direction}>
                  <motion.img 
                    key={currentIndex}
                    src={images[currentIndex].url} 
                    alt="Preview"
                    custom={direction}
                    variants={sliderVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -swipeConfidenceThreshold) {
                        paginate(1);
                      } else if (swipe > swipeConfidenceThreshold) {
                        paginate(-1);
                      }
                    }}
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute w-full h-full object-cover scale-110 grayscale mix-blend-multiply cursor-zoom-in active:cursor-grabbing"
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl px-2 z-[40]">
                      &#8249;
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl px-2 z-[40]">
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
            <motion.div key="section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative pt-12 md:pt-24 pl-20 md:pl-40 flex flex-col items-start pointer-events-none">
              <div className="flex flex-col gap-2 pointer-events-none">
                <h1 className={`${playfair.className} text-white/40 text-2xl tracking-[0.5em] font-bold italic uppercase`}>
                  BOSHAFT
                </h1>
                <h2 className={`${playfair.className} text-white/90 text-5xl md:text-8xl uppercase tracking-widest italic leading-none`}>
                  {currentSection}
                </h2>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                <button onClick={() => handleNavigation(null)} className="bg-transparent border-none text-white/20 hover:text-white transition-all text-xs tracking-[1em] uppercase cursor-pointer py-4">
                  [ Back to Menu ]
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)} 
            className="fixed inset-0 z-[999] bg-[rgba(0,0,0,0.95)] flex items-center justify-center cursor-zoom-out"
          >
            {/* NEU: Ein Container mit festen Maßen (90% Breite/Höhe), der das Bild hält. Verhindert das Kollabieren! */}
            <div className="relative w-[90vw] h-[90vh] flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img 
                  key={currentIndex} 
                  custom={direction}
                  variants={lightboxVariants}
                  initial="enter"
                  animate="center" 
                  exit="exit"
                  transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                  src={images[currentIndex].url} 
                  // Nur noch max-w und max-h, statt absolute w-full h-full
                  className="absolute max-w-full max-h-full object-contain shadow-2xl cursor-grab active:cursor-grabbing" 
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginate(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginate(-1);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()} 
                />
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 z-[1000] cursor-pointer"
                >
                  &#8249;
                </button>
                <button 
                  onClick={nextImage} 
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-6xl px-4 py-8 z-[1000] cursor-pointer"
                >
                  &#8250;
                </button>
              </>
            )}

            <p className="absolute bottom-8 text-white/30 tracking-[0.5em] uppercase text-[10px] pointer-events-none">
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