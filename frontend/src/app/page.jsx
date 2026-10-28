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
  DollarSign
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
  const [routerMode, setRouterMode] = useState("auto"); // auto, local, cloud

  // Recording & Input state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Current Card Editing (Safety: Model Proposes, Human Confirms)
  const [transcript, setTranscript] = useState("");
  const [card, setCard] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [backendUsed, setBackendUsed] = useState("local");
  const [lastTimings, setLastTimings] = useState(null);

  // Notifications toggle for current card
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);

  // Cards List & Filter state
  const [cards, setCards] = useState([]);
  const [filterTab, setFilterTab] = useState("all"); // "all", "attention", "done"
  const [searchQuery, setSearchQuery] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const recordTimerRef = useRef(null);

  // Fetch health & config on mount
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

      setAudioChunks([]);
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

  // Process Audio
  const handleAudioUpload = async (fileOrBlob, filename = "audio.wav") => {
    setIsProcessing(true);
    setProcessingStatus("Transcribing & extracting with speed-first router...");
    setSaveSuccessMsg("");

    const formData = new FormData();
    formData.append("file", fileOrBlob, filename);
    formData.append("shop_type", shopType);
    formData.append("mode", routerMode);

    try {
      const res = await fetch(`${API_BASE}/process-audio`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setTranscript(data.transcript);
      setCard(data.card);
      setWarnings(data.warnings || []);
      setBackendUsed(data.backend_used);
      setLastTimings(data.timings);
      fetchHealth();
    } catch (err) {
      alert("Audio processing error: " + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Re-read card from edited transcript
  const handleReRead = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    setProcessingStatus("Re-extracting card from updated transcript...");

    try {
      const res = await fetch(`${API_BASE}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          shop_type: shopType,
          backend: routerMode === "auto" ? null : routerMode,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCard(data.card);
      setWarnings(data.warnings || []);
      setBackendUsed(data.backend_used);
      setLastTimings(data.timings);
    } catch (err) {
      alert("Extraction error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and Save Card
  const handleSaveCard = async () => {
    if (!card) return;
    setIsProcessing(true);
    setProcessingStatus("Saving card to Dukaan Diary database...");

    try {
      const res = await fetch(`${API_BASE}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: { ...card, notes: transcript },
          backend_used: backendUsed,
          used_cloud: backendUsed === "cloud",
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          send_email: sendEmail && !!customerEmail,
          send_telegram: sendTelegram,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setSaveSuccessMsg(`Order #${data.card_id} saved successfully!`);
      setCard(null);
      setTranscript("");
      setWarnings([]);
      setCustomerEmail("");
      setCustomerPhone("");
      fetchCards();
      fetchHealth();
    } catch (err) {
      alert("Error saving card: " + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Mark order done
  const handleMarkDone = async (id) => {
    try {
      await fetch(`${API_BASE}/cards/${id}/done`, { method: "PUT" });
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete order
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    try {
      await fetch(`${API_BASE}/cards/${id}`, { method: "DELETE" });
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
        setCard((prevCard) => ({
          ...prevCard,
          chest: prev.chest || prevCard?.chest,
          waist: prev.waist || prevCard?.waist,
          shoulder: prev.shoulder || prevCard?.shoulder,
          length: prev.length || prevCard?.length,
        }));
        alert(`Loaded previous measurements for ${personName}!`);
      }
    } catch (err) {
      alert("No previous measurements found for " + personName);
    }
  };

  // Metrics
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
              <p className="text-xs text-white/80">Voice-Powered Local Notebook for Small Business Owners</p>
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
              <span>Google Cloud:</span>
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
              <option value="auto" className="text-black">⚡ Speed Auto-Route</option>
              <option value="local" className="text-black">🔒 Local Only (Ollama)</option>
              <option value="cloud" className="text-black">☁️ Cloud Only (Gemini)</option>
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
              <p className="text-xs text-slate-500 font-bold uppercase">Active Orders</p>
              <h3 className="text-2xl font-bold text-[#172b4d]">{openCards.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Pending Due</p>
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
              <p className="text-xs text-slate-500 font-bold uppercase">Active Engine</p>
              <h3 className="text-sm font-bold text-emerald-600 capitalize">
                {health.preferred_backend || "local"} ({health.local_model})
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
        
        {/* Left Column: Voice Recording & Card Confirmation (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* Recorder Widget */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-[#172b4d] mb-1 flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#5e72e4]" /> Record Shopkeeper Voice Note
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Speak naturally in English or Hinglish (e.g., &quot;Sharma ji suit 5 din mein total 1200 advance 500&quot;).
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
                    Stop & Extract Card
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
                  <p className="text-xs font-semibold text-slate-600">Click to Speak</p>
                </div>
              )}

              {/* Or Quick Sample Upload */}
              <div className="mt-4 pt-4 border-t border-slate-200 w-full px-6 flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Upload .WAV
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
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Load sample note
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{processingStatus}</span>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Transcript & Proposed Card Form (Human Confirm Step) */}
          {card && (
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#172b4d] flex items-center gap-1.5 text-base">
                  <Sparkles className="w-4 h-4 text-[#5e72e4]" /> Proposed Card Review
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  backendUsed === "cloud" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {backendUsed === "cloud" ? "☁️ Google Gemini" : "⚡ Local Gemma"}
                </span>
              </div>

              {/* Editable Transcript */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">Spoken Transcript</label>
                  <button
                    onClick={handleReRead}
                    disabled={isProcessing}
                    className="text-[11px] text-[#5e72e4] hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-read
                  </button>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#5e72e4] focus:outline-none"
                />
              </div>

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Please check highlighted fields:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    {warnings.map((w, idx) => (
                      <li key={idx}>
                        <span className="font-semibold capitalize">{w.field}</span>: {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Customer / Supplier</label>
                  <input
                    type="text"
                    value={card.person || ""}
                    onChange={(e) => setCard({ ...card, person: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                  {shopType === "tailor" && card.person && (
                    <button
                      type="button"
                      onClick={() => handleUsePreviousMeasurements(card.person)}
                      className="text-[10px] text-indigo-600 hover:underline mt-0.5"
                    >
                      Use previous sizes
                    </button>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Item / Work</label>
                  <input
                    type="text"
                    value={card.item || ""}
                    onChange={(e) => setCard({ ...card, item: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={card.amount || 0}
                    onChange={(e) => {
                      const amt = parseFloat(e.target.value) || 0;
                      setCard({ ...card, amount: amt, balance_due: amt - (card.advance || 0) });
                    }}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={card.advance || 0}
                    onChange={(e) => {
                      const adv = parseFloat(e.target.value) || 0;
                      setCard({ ...card, advance: adv, balance_due: (card.amount || 0) - adv });
                    }}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Balance Due (Computed)</label>
                  <input
                    type="number"
                    readOnly
                    value={card.balance_due || 0}
                    className="w-full mt-1 p-2 bg-slate-100 font-bold text-red-600 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Due / Ready Date</label>
                  <input
                    type="date"
                    value={card.due_date || ""}
                    onChange={(e) => setCard({ ...card, due_date: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Tailor Extra Fields */}
                {shopType === "tailor" && (
                  <>
                    <div>
                      <label className="font-semibold text-slate-600">Chest (in)</label>
                      <input
                        type="number"
                        value={card.chest || ""}
                        onChange={(e) => setCard({ ...card, chest: parseFloat(e.target.value) || null })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600">Waist (in)</label>
                      <input
                        type="number"
                        value={card.waist || ""}
                        onChange={(e) => setCard({ ...card, waist: parseFloat(e.target.value) || null })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {/* Medical Extra Fields */}
                {shopType === "medical" && (
                  <>
                    <div>
                      <label className="font-semibold text-slate-600">Batch No.</label>
                      <input
                        type="text"
                        value={card.batch || ""}
                        onChange={(e) => setCard({ ...card, batch: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600">Expiry (MM/YYYY)</label>
                      <input
                        type="text"
                        value={card.expiry || ""}
                        onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {/* Baker Extra Fields */}
                {shopType === "baker" && (
                  <>
                    <div>
                      <label className="font-semibold text-slate-600">Flavour</label>
                      <input
                        type="text"
                        value={card.flavour || ""}
                        onChange={(e) => setCard({ ...card, flavour: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={card.weight_kg || ""}
                        onChange={(e) => setCard({ ...card, weight_kg: parseFloat(e.target.value) || null })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Notification Integrations */}
              <div className="pt-3 border-t border-slate-100 mb-4 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Customer Notifications</p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmailChk"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="sendEmailChk" className="text-xs text-slate-700 flex items-center gap-1 font-semibold">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Send Email Bill:
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="text-xs p-1 border rounded flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendTgChk"
                    checked={sendTelegram}
                    onChange={(e) => setSendTelegram(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="sendTgChk" className="text-xs text-slate-700 flex items-center gap-1 font-semibold">
                    <Send className="w-3.5 h-3.5 text-sky-500" /> Send Telegram Notification to Shop Owner
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCard}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-[#2dce89] hover:bg-emerald-600 text-white font-bold text-sm rounded-lg shadow transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Save Order
                </button>
                <button
                  onClick={() => setCard(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Active Ledger & Due Reminders (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex-1 flex flex-col">
            
            {/* Header & Search */}
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

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[600px] pr-1">
              {displayedCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-sm font-medium">No orders found in this view.</p>
                  <p className="text-xs">Record your first note using the microphone on the left!</p>
                </div>
              ) : (
                displayedCards.map((c) => {
                  const cardData = c.parsed_card || {};
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all ${
                        c.needs_attention
                          ? "border-amber-300 bg-amber-50/30"
                          : c.status === "done"
                          ? "border-slate-200 bg-slate-50 opacity-75"
                          : "border-slate-200 hover:border-indigo-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#172b4d]">
                              {c.person || "Unknown Customer"}
                            </h4>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600 capitalize">
                              {c.shop_type}
                            </span>
                            {c.needs_attention && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                ⚠️ Urgent Due
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
                            <span className={c.balance_due > 0 ? "text-red-600" : "text-emerald-600"}>
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
                            Ready by: {c.due_date || "Not specified"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Mode: {c.used_cloud ? "☁️ Cloud" : "⚡ Local"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {c.status === "open" && (
                            <button
                              onClick={() => handleMarkDone(c.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs flex items-center gap-1 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Mark Done
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                            title="Delete Card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
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
        Dukaan Diary &bull; Local-first Voice Ledger &bull; Built with Next.js, FastAPI & Gemma 4
      </footer>
    </div>
  );
}

