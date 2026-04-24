"use client";

import { useState, useEffect } from "react";
import { Playfair_Display, Geist } from "next/font/google";
import { createClient } from "@supabase/supabase-js";

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const playfair = Playfair_Display({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  
  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Street");
  const [size, setSize] = useState("normal"); // 'normal' oder 'large'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Prüfen, ob wir schon eingeloggt sind
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LOGIN LOGIK ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Falsche E-Mail oder Passwort.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- UPLOAD LOGIK ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadMessage("Bitte wähle ein Bild aus.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Lade hoch...");

    try {
      // 1. Eindeutigen Dateinamen generieren (verhindert Überschreiben)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${category}/${fileName}`; // Sortiert sie im Storage nach Kategorie

      // 2. Bild in den Supabase Storage hochladen (Bucket-Name: 'images')
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Die öffentliche URL des Bildes abrufen
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // 4. Den Eintrag in die Datenbank-Tabelle schreiben
      const { error: dbError } = await supabase
        .from('images')
        .insert([
          { 
            url: publicUrlData.publicUrl, 
            category: category,
            size: size // 'normal' oder 'large' für dein Kachelsystem
          }
        ]);

      if (dbError) throw dbError;

      setUploadMessage("✅ Erfolgreich hochgeladen!");
      setFile(null); // Formular zurücksetzen
      
    } catch (error: any) {
      setUploadMessage(`❌ Fehler: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Nachricht nach 4 Sekunden ausblenden
      setTimeout(() => setUploadMessage(""), 4000);
    }
  };

  // ============================================================================
  // UI: LOGIN SCREEN
  // ============================================================================
  if (!session) {
    return (
      <main className={`${geist.className} min-h-screen bg-black flex items-center justify-center p-4`}>
        <div className="max-w-md w-full border border-white/10 p-8 md:p-12 bg-black/50 backdrop-blur-md">
          <h1 className={`${playfair.className} text-white text-3xl tracking-[0.3em] font-bold italic uppercase mb-8 text-center`}>
            BOSHAFT <span className="text-white/30 block text-lg mt-2">Admin</span>
          </h1>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input 
              type="email" 
              placeholder="E-Mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-b border-white/20 text-white placeholder-white/30 p-2 outline-none focus:border-white transition-colors"
              required
            />
            <input 
              type="password" 
              placeholder="Passwort" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-b border-white/20 text-white placeholder-white/30 p-2 outline-none focus:border-white transition-colors"
              required
            />
            {loginError && <p className="text-red-400 text-xs tracking-wider">{loginError}</p>}
            
            <button type="submit" className="mt-4 border border-white/20 text-white/70 hover:text-white hover:border-white/60 uppercase tracking-[0.4em] text-xs py-4 transition-all">
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ============================================================================
  // UI: DASHBOARD (UPLOAD SCREEN)
  // ============================================================================
  return (
    <main className={`${geist.className} min-h-screen bg-black p-8 md:p-16`}>
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
          <div>
            <h1 className={`${playfair.className} text-white text-3xl tracking-[0.3em] font-bold italic uppercase`}>
              BOSHAFT
            </h1>
            <p className="text-white/30 tracking-[0.4em] text-xs uppercase mt-2">Dashboard</p>
          </div>
          <button onClick={handleLogout} className="text-white/30 hover:text-white tracking-[0.2em] text-xs uppercase transition-colors">
            Logout
          </button>
        </div>

        {/* Upload Formular */}
        <div className="border border-white/10 p-8 md:p-12">
          <h2 className="text-white/60 tracking-[0.3em] uppercase text-sm mb-8">Neues Bild hochladen</h2>
          
          <form onSubmit={handleUpload} className="flex flex-col gap-8">
            
            {/* 1. Datei Auswahl */}
            <div className="flex flex-col gap-2">
              <label className="text-white/40 tracking-widest text-[10px] uppercase">Datei</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="text-white/70 file:mr-4 file:py-2 file:px-4 file:border file:border-white/20 file:bg-transparent file:text-white/70 file:hover:text-white file:hover:border-white/60 file:transition-all file:uppercase file:tracking-[0.2em] file:text-[10px] file:cursor-pointer cursor-pointer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 2. Kategorie Auswahl */}
              <div className="flex flex-col gap-2">
                <label className="text-white/40 tracking-widest text-[10px] uppercase">Kategorie</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-black border border-white/20 text-white p-3 outline-none focus:border-white transition-colors uppercase tracking-widest text-xs cursor-pointer"
                >
                  <option value="Street">Street</option>
                  <option value="Portrait">Portrait</option>
                  <option value="Event">Event</option>
                  <option value="Landscape">Landscape</option>
                  <option value="BW">B/W (Black & White)</option>
                </select>
              </div>

              {/* 3. Kachel-Größe Auswahl */}
              <div className="flex flex-col gap-2">
                <label className="text-white/40 tracking-widest text-[10px] uppercase">Darstellung (Kachelgröße)</label>
                <select 
                  value={size} 
                  onChange={(e) => setSize(e.target.value)}
                  className="bg-black border border-white/20 text-white p-3 outline-none focus:border-white transition-colors uppercase tracking-widest text-xs cursor-pointer"
                >
                  <option value="normal">Normal (Standard)</option>
                  <option value="large">Groß (Highlight)</option>
                </select>
              </div>
            </div>

            {/* Submit Button & Status */}
            <div className="mt-4 flex flex-col items-center gap-4">
              <button 
                type="submit" 
                disabled={isUploading || !file}
                className="w-full border border-white/20 text-white hover:text-black hover:bg-white uppercase tracking-[0.4em] text-xs py-4 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                {isUploading ? "Wird hochgeladen..." : "Bild veröffentlichen"}
              </button>
              
              {uploadMessage && (
                <p className={`text-sm tracking-wider ${uploadMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                  {uploadMessage}
                </p>
              )}
            </div>

          </form>
        </div>

      </div>
    </main>
  );
}