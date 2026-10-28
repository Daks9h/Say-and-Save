"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Send,
  Mail,
  Shield,
  Cloud,
  Cpu,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  ShoppingBag,
  Calendar,
  DollarSign,
  Edit3,
  Check,
  X,
  FileText,
  Phone,
  Layers,
  ChevronRight,
  Eye
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const PACKS = [
  { id: "tailor", label: "Tailor (दर्जी)", icon: "✂️" },
  { id: "medical", label: "Medical Store (दवाखाना)", icon: "💊" },
  { id: "baker", label: "Bakery & Cakes (बेकरी)", icon: "🎂" },
  { id: "repair", label: "Repair Shop (रिपेयर)", icon: "🔧", experimental: true },
  { id: "laundry", label: "Laundry (धोबी)", icon: "🧺", experimental: true },
];

export default function DukaanDiary() {
  // Global & Configuration state
  const [shopType, setShopType] = useState("tailor");
  const [health, setHealth] = useState({});
  const [cloudConsent, setCloudConsent] = useState(true);
  const [routerMode, setRouterMode] = useState("cloud"); // Default to Cloud Gemini for sub-4s fast speed

  // Recording & Input state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Flashcard State (Auto-created directly from audio)
  const [latestFlashcard, setLatestFlashcard] = useState(null);
  const [flashcardMsg, setFlashcardMsg] = useState("");
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Edit Mode state (for modifying the flashcard later)
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Quick Notification on Flashcard
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");

  // Cards Ledger & Filter state
  const [cards, setCards] = useState([]);
  const [filterTab, setFilterTab] = useState("all"); // "all", "attention", "done"
  const [searchQuery, setSearchQuery] = useState("");

  const recordTimerRef = useRef(null);

  // Fetch health & cards on mount and shopType change
  useEffect(() => {
    fetchHealth();
    fetchCards();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [shopType]);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setCloudConsent(data.cloud_consent);
      }
    } catch (err) {
      console.error("Health check error:", err);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch(`${API_BASE}/cards?shop_type=${shopType}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  const updateConsent = async (val) => {
    setCloudConsent(val);
    try {
      await fetch(`${API_BASE}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloud_consent: val }),
      });
      fetchHealth();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRouterMode = async (mode) => {
    setRouterMode(mode);
    try {
      await fetch(`${API_BASE}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_mode: mode }),
      });
      fetchHealth();
    } catch (err) {
      console.error(err);
    }
  };

  // Browser Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const actualType = mimeType || recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(chunks, { type: actualType });
        const ext = actualType.includes("webm") ? "webm" : actualType.includes("mp4") ? "mp4" : "wav";
        await handleAudioUpload(audioBlob, `recording.${ext}`);
        stream.getTracks().forEach((track) => track.stop());
      };

      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start(200);
      setMediaRecorder(recorder);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or not available. Please allow mic or upload a WAV file.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  // Audio Processing with Auto-Save into Flashcard
  const handleAudioUpload = async (fileOrBlob, filename = "audio.wav") => {
    setIsProcessing(true);
    setProcessingStatus("⚡ Transcribing audio & auto-generating English flashcard...");
    setFlashcardMsg("");
    setEditSuccessMsg("");

    const formData = new FormData();
    formData.append("file", fileOrBlob, filename);
    formData.append("shop_type", shopType);
    formData.append("mode", routerMode);
    formData.append("auto_save", "true");

    try {
      const res = await fetch(`${API_BASE}/process-audio`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      const newCard = {
        ...data.card,
        id: data.card_id,
        backend_used: data.backend_used,
        used_cloud: data.used_cloud,
        timings: data.timings,
        warnings: data.warnings,
        notes: data.transcript || data.card?.notes,
      };

      setLatestFlashcard(newCard);
      setFlashcardMsg(`🎉 Flashcard #${data.card_id} Auto-Created & Saved to Ledger!`);
      fetchCards();
      fetchHealth();
    } catch (err) {
      alert("Audio processing error: " + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Start Editing Flashcard
  const startEditing = (cardToEdit) => {
    const cardData = cardToEdit.parsed_card || cardToEdit;
    setEditingCardId(cardToEdit.id);
    setEditForm({
      id: cardToEdit.id,
      shop_type: cardToEdit.shop_type || shopType,
      person: cardData.person || "",
      item: cardData.item || "",
      amount: cardData.amount || 0,
      advance: cardData.advance || 0,
      balance_due: (cardData.amount || 0) - (cardData.advance || 0),
      due_date: cardData.due_date || "",
      notes: cardData.notes || "",
      // Pack specific fields
      chest: cardData.chest || "",
      waist: cardData.waist || "",
      shoulder: cardData.shoulder || "",
      length: cardData.length || "",
      batch: cardData.batch || "",
      expiry: cardData.expiry || "",
      flavour: cardData.flavour || "",
      weight_kg: cardData.weight_kg || "",
      device: cardData.device || "",
      fault: cardData.fault || "",
      item_count: cardData.item_count || "",
      service: cardData.service || "",
      customer_email: cardToEdit.customer_email || cardData.customer_email || "",
      customer_phone: cardToEdit.customer_phone || cardData.customer_phone || "",
      send_email: false,
      send_telegram: false,
    });
  };

  // Save Modified Flashcard
  const handleSaveEdit = async () => {
    if (!editingCardId) return;
    setIsProcessing(true);
    setProcessingStatus("Saving modified flashcard details...");

    try {
      const res = await fetch(`${API_BASE}/cards/${editingCardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: editForm,
          customer_email: editForm.customer_email || null,
          customer_phone: editForm.customer_phone || null,
          send_email: editForm.send_email && !!editForm.customer_email,
          send_telegram: editForm.send_telegram,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setEditSuccessMsg(`✅ Flashcard #${editingCardId} updated successfully!`);
      setEditingCardId(null);

      // Update active flashcard view if it was the one edited
      if (latestFlashcard && latestFlashcard.id === editingCardId) {
        setLatestFlashcard({ ...data.card, id: editingCardId });
      }

      fetchCards();
      setTimeout(() => setEditSuccessMsg(""), 4000);
    } catch (err) {
      alert("Error saving flashcard edits: " + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Mark order done
  const handleMarkDone = async (id) => {
    try {
      await fetch(`${API_BASE}/cards/${id}/done`, { method: "PUT" });
      if (latestFlashcard && latestFlashcard.id === id) {
        setLatestFlashcard({ ...latestFlashcard, status: "done" });
      }
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete order
  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete Flashcard #${id}?`)) return;
    try {
      await fetch(`${API_BASE}/cards/${id}`, { method: "DELETE" });
      if (latestFlashcard && latestFlashcard.id === id) {
        setLatestFlashcard(null);
      }
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  // Autofill previous measurements for tailor
  const handleUsePreviousMeasurements = async (personName) => {
    if (!personName) return;
    try {
      const res = await fetch(`${API_BASE}/customers/${encodeURIComponent(personName)}/latest?shop_type=tailor`);
      if (res.ok) {
        const data = await res.json();
        const prev = data.parsed_card || {};
        setEditForm((prevForm) => ({
          ...prevForm,
          chest: prev.chest || prevForm.chest,
          waist: prev.waist || prevForm.waist,
          shoulder: prev.shoulder || prevForm.shoulder,
          length: prev.length || prevForm.length,
        }));
        alert(`Loaded previous tailor measurements for ${personName}!`);
      }
    } catch (err) {
      alert("No previous measurements found for " + personName);
    }
  };

  // Send Email Notification on Flashcard
  const handleSendFlashcardEmail = async (cardItem) => {
    if (!notifyEmail) {
      alert("Please enter customer email address.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: cardItem,
          email: notifyEmail,
          telegram: false,
        }),
      });
      if (res.ok) {
        setNotifyMsg(`📧 Bill emailed to ${notifyEmail}!`);
        setTimeout(() => setNotifyMsg(""), 4000);
      }
    } catch (err) {
      alert("Email dispatch error: " + err.message);
    }
  };

  // Ledger Metrics
  const openCards = cards.filter((c) => c.status === "open");
  const attentionCards = openCards.filter((c) => c.needs_attention);
  const totalBalanceDue = openCards.reduce((sum, c) => sum + (c.balance_due || 0), 0);

  const displayedCards = cards.filter((c) => {
    if (filterTab === "attention") return c.status === "open" && c.needs_attention;
    if (filterTab === "done") return c.status === "done";
    return c.status === "open";
  }).filter((c) => {
    if (!searchQuery) return true;
    return (
      c.person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.item?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fe]">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-[#5e72e4] to-[#825ee4] text-white shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shadow">
              📖
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dukaan Diary (दुकान डायरी)</h1>
              <p className="text-xs text-white/80">Voice-Powered Order Flashcards & Ledger for Indian Shopkeepers</p>
            </div>
          </div>

          {/* Controls Header */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Shop Type Selector */}
            <select
              value={shopType}
              onChange={(e) => setShopType(e.target.value)}
              className="bg-white text-[#172b4d] font-semibold text-sm rounded-lg px-3 py-2 shadow-sm border-0 focus:ring-2 focus:ring-white"
            >
              {PACKS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>

            {/* Cloud Consent Toggle */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/20 text-xs">
              <Cloud className="w-4 h-4" />
              <span>Google Gemini:</span>
              <button
                onClick={() => updateConsent(!cloudConsent)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  cloudConsent ? "bg-[#2dce89] text-white" : "bg-white/30 text-white"
                }`}
              >
                {cloudConsent ? "ON" : "OFF"}
              </button>
            </div>

            {/* Router Selector */}
            <select
              value={routerMode}
              onChange={(e) => updateRouterMode(e.target.value)}
              className="bg-white/10 text-white text-xs rounded-lg px-2.5 py-2 border border-white/20"
            >
              <option value="cloud" className="text-black">☁️ Cloud Fast (Gemini Flash Lite)</option>
              <option value="auto" className="text-black">⚡ Speed Auto-Route</option>
              <option value="local" className="text-black">🔒 Local Only (Ollama Gemma)</option>
            </select>

            {/* Latency Pill */}
            {health.last_latency_ms > 0 && (
              <span className="text-xs font-mono bg-white/20 px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {health.last_used_backend === "cloud" ? "☁️" : "⚡"} {Math.round(health.last_latency_ms)}ms
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="max-w-7xl mx-auto w-full px-6 -mt-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Active Flashcards</p>
              <h3 className="text-2xl font-bold text-[#172b4d]">{openCards.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Pending Balance</p>
              <h3 className="text-2xl font-bold text-red-600">₹{totalBalanceDue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Needs Attention</p>
              <h3 className="text-2xl font-bold text-amber-600">{attentionCards.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Active AI Engine</p>
              <h3 className="text-sm font-bold text-emerald-600 capitalize">
                {health.preferred_backend === "cloud" ? "Google Gemini 3.5" : "Local Gemma"}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Input & Instant Auto-Flashcard (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Recorder Widget */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-[#172b4d] mb-1 flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#5e72e4]" /> Voice Note Order Recorder
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Speak in Hindi, Hinglish, or English. The AI automatically creates a complete English flashcard in your ledger!
            </p>

            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shadow-lg">
                    <Square className="w-6 h-6" />
                  </div>
                  <span className="text-red-600 font-bold font-mono text-sm">
                    Recording: {recordingSeconds}s
                  </span>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow transition"
                  >
                    Stop & Auto-Create Flashcard
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#5e72e4] to-[#825ee4] text-white flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-50"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="text-xs font-semibold text-slate-600">Click to Speak Order</p>
                </div>
              )}

              {/* Sample Note & File Upload */}
              <div className="mt-4 pt-4 border-t border-slate-200 w-full px-6 flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Audio File
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleAudioUpload(e.target.files[0]);
                    }}
                  />
                </label>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("test.wav");
                      const blob = await res.blob();
                      handleAudioUpload(blob, "test.wav");
                    } catch (e) {
                      alert("Error loading sample test.wav");
                    }
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Test with Sample Note (test.wav)
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>{processingStatus}</span>
              </div>
            )}

            {flashcardMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{flashcardMsg}</span>
              </div>
            )}

            {editSuccessMsg && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="font-semibold">{editSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Flashcard View & Edit Section */}
          {latestFlashcard && (
            <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-100 overflow-hidden transition-all">
              
              {/* Flashcard Header Bar */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {PACKS.find((p) => p.id === latestFlashcard.shop_type)?.icon || "📋"}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#172b4d]">
                      Order Flashcard #{latestFlashcard.id}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      {latestFlashcard.shop_type} Ledger Slip
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Auto-Saved
                  </span>
                  {latestFlashcard.used_cloud && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      ☁️ Gemini
                    </span>
                  )}
                </div>
              </div>

              {/* Check if currently in Edit Mode */}
              {editingCardId === latestFlashcard.id ? (
                /* INLINE EDIT MODE */
                <div className="p-5 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Flashcard Details
                    </h4>
                    <span className="text-[11px] text-slate-500">Modify any field & save</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">Customer Name (English)</label>
                      <input
                        type="text"
                        value={editForm.person || ""}
                        onChange={(e) => setEditForm({ ...editForm, person: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {shopType === "tailor" && editForm.person && (
                        <button
                          type="button"
                          onClick={() => handleUsePreviousMeasurements(editForm.person)}
                          className="text-[10px] text-indigo-600 font-semibold hover:underline mt-1 block"
                        >
                          Load previous sizes
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Item / Work (English)</label>
                      <input
                        type="text"
                        value={editForm.item || ""}
                        onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Total Amount (₹)</label>
                      <input
                        type="number"
                        value={editForm.amount || 0}
                        onChange={(e) => {
                          const amt = parseFloat(e.target.value) || 0;
                          setEditForm({
                            ...editForm,
                            amount: amt,
                            balance_due: amt - (editForm.advance || 0),
                          });
                        }}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-[#172b4d]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Advance Paid (₹)</label>
                      <input
                        type="number"
                        value={editForm.advance || 0}
                        onChange={(e) => {
                          const adv = parseFloat(e.target.value) || 0;
                          setEditForm({
                            ...editForm,
                            advance: adv,
                            balance_due: (editForm.amount || 0) - adv,
                          });
                        }}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-[#172b4d]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Balance Due (₹)</label>
                      <input
                        type="number"
                        readOnly
                        value={editForm.balance_due || 0}
                        className="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-red-600"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Ready / Delivery Date</label>
                      <input
                        type="date"
                        value={editForm.due_date || ""}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Tailor Pack Extra Fields */}
                    {shopType === "tailor" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Chest (in)</label>
                          <input
                            type="number"
                            value={editForm.chest || ""}
                            onChange={(e) => setEditForm({ ...editForm, chest: parseFloat(e.target.value) || null })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Waist (in)</label>
                          <input
                            type="number"
                            value={editForm.waist || ""}
                            onChange={(e) => setEditForm({ ...editForm, waist: parseFloat(e.target.value) || null })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Shoulder (in)</label>
                          <input
                            type="number"
                            value={editForm.shoulder || ""}
                            onChange={(e) => setEditForm({ ...editForm, shoulder: parseFloat(e.target.value) || null })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Length (in)</label>
                          <input
                            type="number"
                            value={editForm.length || ""}
                            onChange={(e) => setEditForm({ ...editForm, length: parseFloat(e.target.value) || null })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {/* Medical Pack Extra Fields */}
                    {shopType === "medical" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Batch No.</label>
                          <input
                            type="text"
                            value={editForm.batch || ""}
                            onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Expiry (MM/YYYY)</label>
                          <input
                            type="text"
                            value={editForm.expiry || ""}
                            onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {/* Baker Pack Extra Fields */}
                    {shopType === "baker" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Flavour</label>
                          <input
                            type="text"
                            value={editForm.flavour || ""}
                            onChange={(e) => setEditForm({ ...editForm, flavour: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editForm.weight_kg || ""}
                            onChange={(e) => setEditForm({ ...editForm, weight_kg: parseFloat(e.target.value) || null })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Customer Email & Phone */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">Customer Email</label>
                      <input
                        type="email"
                        placeholder="customer@example.com"
                        value={editForm.customer_email || ""}
                        onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Customer Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={editForm.customer_phone || ""}
                        onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                        className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Edit Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingCardId(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-[#5e72e4] hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY PHYSICAL FLASHCARD VIEW */
                <div className="p-5">
                  {/* Customer & Item Title */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                        Customer
                      </p>
                      <h2 className="text-xl font-extrabold text-[#172b4d]">
                        {latestFlashcard.person || "Customer"}
                      </h2>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {latestFlashcard.item || "Order Service"}
                      </p>
                    </div>

                    <button
                      onClick={() => startEditing(latestFlashcard)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Flashcard
                    </button>
                  </div>

                  {/* 4-Box Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                      <p className="text-base font-bold text-[#172b4d] mt-0.5">
                        ₹{latestFlashcard.amount || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Advance</span>
                      <p className="text-base font-bold text-emerald-600 mt-0.5">
                        ₹{latestFlashcard.advance || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Balance Due</span>
                      <p className={`text-base font-extrabold mt-0.5 ${
                        (latestFlashcard.balance_due || 0) > 0 ? "text-red-600" : "text-emerald-600"
                      }`}>
                        ₹{latestFlashcard.balance_due || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Due Date</span>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {latestFlashcard.due_date || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Tailor Measurements / Pack Details */}
                  {(latestFlashcard.chest || latestFlashcard.waist || latestFlashcard.shoulder || latestFlashcard.length) && (
                    <div className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-1.5">
                        Tailor Measurements (Inches)
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {latestFlashcard.chest && (
                          <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                            <span className="text-slate-400 block text-[10px]">Chest</span>
                            <span className="font-bold text-[#172b4d]">{latestFlashcard.chest}&quot;</span>
                          </div>
                        )}
                        {latestFlashcard.waist && (
                          <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                            <span className="text-slate-400 block text-[10px]">Waist</span>
                            <span className="font-bold text-[#172b4d]">{latestFlashcard.waist}&quot;</span>
                          </div>
                        )}
                        {latestFlashcard.shoulder && (
                          <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                            <span className="text-slate-400 block text-[10px]">Shoulder</span>
                            <span className="font-bold text-[#172b4d]">{latestFlashcard.shoulder}&quot;</span>
                          </div>
                        )}
                        {latestFlashcard.length && (
                          <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                            <span className="text-slate-400 block text-[10px]">Length</span>
                            <span className="font-bold text-[#172b4d]">{latestFlashcard.length}&quot;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medical / Baker / Repair extra details */}
                  {(latestFlashcard.batch || latestFlashcard.expiry || latestFlashcard.flavour || latestFlashcard.weight_kg) && (
                    <div className="mb-4 p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 text-xs">
                      {latestFlashcard.batch && (
                        <span><strong>Batch:</strong> {latestFlashcard.batch}</span>
                      )}
                      {latestFlashcard.expiry && (
                        <span><strong>Expiry:</strong> {latestFlashcard.expiry}</span>
                      )}
                      {latestFlashcard.flavour && (
                        <span><strong>Flavour:</strong> {latestFlashcard.flavour}</span>
                      )}
                      {latestFlashcard.weight_kg && (
                        <span><strong>Weight:</strong> {latestFlashcard.weight_kg} kg</span>
                      )}
                    </div>
                  )}

                  {/* Voice Transcript Quote */}
                  {latestFlashcard.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                        Original Voice Note
                      </span>
                      &quot;{latestFlashcard.notes}&quot;
                    </div>
                  )}

                  {/* Quick Email Invoice Box */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="customer@email.com for instant bill"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleSendFlashcardEmail(latestFlashcard)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Email Bill
                    </button>
                  </div>

                  {notifyMsg && (
                    <p className="mt-2 text-xs text-emerald-600 font-semibold">{notifyMsg}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Active Ledger & Order History (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex-1 flex flex-col">
            
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterTab === "all" ? "bg-[#5e72e4] text-white shadow" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Open Orders ({openCards.length})
                </button>
                <button
                  onClick={() => setFilterTab("attention")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterTab === "attention" ? "bg-amber-500 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ⚠️ Needs Attention ({attentionCards.length})
                </button>
                <button
                  onClick={() => setFilterTab("done")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterTab === "done" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Cards Ledger List */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[680px] pr-1">
              {displayedCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No orders found in this view.</p>
                  <p className="text-xs text-slate-400 mt-1">Speak into the microphone or load the sample note!</p>
                </div>
              ) : (
                displayedCards.map((c) => {
                  const cardData = c.parsed_card || {};
                  const isCurrentEditing = editingCardId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentEditing
                          ? "border-indigo-400 bg-indigo-50/20 shadow-md ring-2 ring-indigo-200"
                          : c.needs_attention
                          ? "border-amber-300 bg-amber-50/30"
                          : c.status === "done"
                          ? "border-slate-200 bg-slate-50 opacity-70"
                          : "border-slate-200 hover:border-indigo-300 bg-white shadow-sm"
                      }`}
                    >
                      {isCurrentEditing ? (
                        /* INLINE EDIT FOR THIS LEDGER ROW */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5" /> Editing Order #{c.id}
                            </h4>
                            <span className="text-[11px] text-slate-500">Edit fields in English</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Customer</label>
                              <input
                                type="text"
                                value={editForm.person || ""}
                                onChange={(e) => setEditForm({ ...editForm, person: e.target.value })}
                                className="w-full mt-0.5 p-1.5 border rounded bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Item / Work</label>
                              <input
                                type="text"
                                value={editForm.item || ""}
                                onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                                className="w-full mt-0.5 p-1.5 border rounded bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Total (₹)</label>
                              <input
                                type="number"
                                value={editForm.amount || 0}
                                onChange={(e) => {
                                  const amt = parseFloat(e.target.value) || 0;
                                  setEditForm({
                                    ...editForm,
                                    amount: amt,
                                    balance_due: amt - (editForm.advance || 0),
                                  });
                                }}
                                className="w-full mt-0.5 p-1.5 border rounded bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Advance (₹)</label>
                              <input
                                type="number"
                                value={editForm.advance || 0}
                                onChange={(e) => {
                                  const adv = parseFloat(e.target.value) || 0;
                                  setEditForm({
                                    ...editForm,
                                    advance: adv,
                                    balance_due: (editForm.amount || 0) - adv,
                                  });
                                }}
                                className="w-full mt-0.5 p-1.5 border rounded bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Due Date</label>
                              <input
                                type="date"
                                value={editForm.due_date || ""}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                className="w-full mt-0.5 p-1.5 border rounded bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase">Balance Due</label>
                              <div className="mt-0.5 p-1.5 bg-slate-100 rounded text-xs font-extrabold text-red-600">
                                ₹{editForm.balance_due || 0}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <button
                              onClick={() => setEditingCardId(null)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-1 bg-[#5e72e4] hover:bg-indigo-600 text-white text-xs font-bold rounded shadow"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* STANDARD LEDGER ROW */
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-[#172b4d]">
                                  {c.person || "Customer"}
                                </h4>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600 capitalize">
                                  {c.shop_type}
                                </span>
                                {c.needs_attention && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    ⚠️ Urgent
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-700 mt-1">
                                {c.item || "General Order"}
                              </p>
                            </div>

                            {/* Amount & Balance */}
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                Total: <span className="font-bold text-[#172b4d]">₹{c.amount}</span> | Adv: ₹{c.advance}
                              </p>
                              <p className="text-sm font-bold mt-0.5">
                                Balance Due:{" "}
                                <span className={c.balance_due > 0 ? "text-red-600 font-extrabold" : "text-emerald-600 font-bold"}>
                                  ₹{c.balance_due}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Details & Dates */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                Ready by: {c.due_date || "Not set"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                #{c.id} &bull; {c.used_cloud ? "☁️ Cloud" : "⚡ Local"}
                              </span>
                            </div>

                            {/* Action Buttons: Edit, View Flashcard, Mark Done, Delete */}
                            <div className="flex items-center gap-2">
                              {/* View as Flashcard */}
                              <button
                                onClick={() => setLatestFlashcard(c)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1 transition"
                                title="View as Flashcard"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>

                              {/* Edit Flashcard Button */}
                              <button
                                onClick={() => startEditing(c)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs flex items-center gap-1 transition"
                                title="Edit Flashcard"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>

                              {/* Mark Done Button */}
                              {c.status === "open" && (
                                <button
                                  onClick={() => handleMarkDone(c.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs flex items-center gap-1 transition"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Done
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1 text-slate-400 hover:text-red-500 transition"
                                title="Delete Card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        Dukaan Diary &bull; Voice-Powered Flashcard Ledger &bull; Built with Next.js, FastAPI & Gemma 4
      </footer>
    </div>
  );
}
