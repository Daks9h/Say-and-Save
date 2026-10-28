"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  Scissors,
  Pill,
  Cake,
  Wrench,
  Shirt,
  Mic,
  Square,
  Upload,
  CheckCircle2,
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
  ShoppingBag,
  Calendar,
  DollarSign,
  Edit3,
  Check,
  X,
  Eye,
  LogOut,
  Zap,
  Layers,
  ChevronDown,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const API_BASE = "http://localhost:8000";

const OCCUPATION_MAP = {
  tailor: { id: "tailor", label: "Tailor & Boutique", icon: Scissors, badge: "indigo" },
  medical: { id: "medical", label: "Pharmacy & Medical", icon: Pill, badge: "success" },
  baker: { id: "baker", label: "Bakery & Cakes", icon: Cake, badge: "warning" },
  repair: { id: "repair", label: "Electronics & Repair", icon: Wrench, badge: "secondary" },
  laundry: { id: "laundry", label: "Laundry & Dry Clean", icon: Shirt, badge: "outline" },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Profile & Occupation
  const [shopType, setShopType] = useState("tailor");
  const [shopName, setShopName] = useState("My Shop");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Router & Health State
  const [health, setHealth] = useState({});
  const [cloudConsent, setCloudConsent] = useState(true);
  const [routerMode, setRouterMode] = useState("cloud"); // speed-first default

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Flashcard State (Auto-created directly)
  const [activeFlashcard, setActiveFlashcard] = useState(null);
  const [flashcardMsg, setFlashcardMsg] = useState("");
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Edit Mode state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Quick Notification on Flashcard
  const [notifyMsg, setNotifyMsg] = useState("");

  // Ledger state
  const [cards, setCards] = useState([]);
  const [filterTab, setFilterTab] = useState("pending"); // "pending", "all", "attention", "done"
  const [searchQuery, setSearchQuery] = useState("");

  const recordTimerRef = useRef(null);

  // Initialize occupation & profile
  useEffect(() => {
    const saved = localStorage.getItem("dukaan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.occupation && OCCUPATION_MAP[parsed.occupation]) {
          setShopType(parsed.occupation);
        }
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.ownerEmail) setOwnerEmail(parsed.ownerEmail);
        if (parsed.ownerPhone) setOwnerPhone(parsed.ownerPhone);
      } catch (e) {}
    } else {
      const qOcc = searchParams.get("occupation");
      if (qOcc && OCCUPATION_MAP[qOcc]) {
        setShopType(qOcc);
      }
    }
  }, [searchParams]);

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
        // If no active flashcard yet, select latest
        if (data.length > 0 && !activeFlashcard) {
          setActiveFlashcard(data[0]);
        }
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
    setProcessingStatus("Transcribing audio & auto-generating English flashcard...");
    setFlashcardMsg("");
    setEditSuccessMsg("");

    const formData = new FormData();
    formData.append("file", fileOrBlob, filename);
    formData.append("shop_type", shopType);
    formData.append("mode", routerMode);
    formData.append("auto_save", "true");
    if (ownerEmail) formData.append("owner_email", ownerEmail);
    if (ownerPhone) formData.append("owner_phone", ownerPhone);

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

      setActiveFlashcard(newCard);
      setFlashcardMsg(`Order #${data.card_id} Flashcard Auto-Created!`);
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

      setEditSuccessMsg(`Flashcard #${editingCardId} updated successfully.`);
      setEditingCardId(null);

      if (activeFlashcard && activeFlashcard.id === editingCardId) {
        setActiveFlashcard({ ...data.card, id: editingCardId });
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
      if (activeFlashcard && activeFlashcard.id === id) {
        setActiveFlashcard({ ...activeFlashcard, status: "done" });
      }
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete order
  const handleDelete = async (id) => {
    if (!confirm(`Delete Flashcard #${id}?`)) return;
    try {
      await fetch(`${API_BASE}/cards/${id}`, { method: "DELETE" });
      if (activeFlashcard && activeFlashcard.id === id) {
        setActiveFlashcard(null);
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
        alert(`Loaded previous tailor measurements for ${personName}`);
      }
    } catch (err) {
      alert("No previous measurements found for " + personName);
    }
  };

  // Send Email & SMS Notification directly to the Shopkeeper (Owner)
  const handleSendOwnerAlert = async (cardItem, channel = "both") => {
    const targetEmail = ownerEmail || "owner@dukaandiary.com";
    const targetPhone = ownerPhone || "+91 9876543210";

    try {
      const res = await fetch(`${API_BASE}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: cardItem,
          owner_email: channel !== "sms" ? targetEmail : null,
          owner_phone: channel !== "email" ? targetPhone : null,
          telegram: false,
        }),
      });
      if (res.ok) {
        setNotifyMsg(`Alert card sent to your email (${targetEmail}) & SMS (${targetPhone})!`);
        setTimeout(() => setNotifyMsg(""), 5000);
      }
    } catch (err) {
      alert("Alert dispatch error: " + err.message);
    }
  };

  // Calculations for Pending Bills & Metrics
  const openCards = useMemo(() => cards.filter((c) => c.status === "open"), [cards]);
  const pendingDueCards = useMemo(() => openCards.filter((c) => (c.balance_due || 0) > 0), [openCards]);
  const attentionCards = useMemo(() => openCards.filter((c) => c.needs_attention), [openCards]);
  const totalBalanceDue = useMemo(
    () => openCards.reduce((sum, c) => sum + (c.balance_due || 0), 0),
    [openCards]
  );

  const displayedCards = useMemo(() => {
    return cards
      .filter((c) => {
        if (filterTab === "pending") return c.status === "open" && (c.balance_due || 0) > 0;
        if (filterTab === "attention") return c.status === "open" && c.needs_attention;
        if (filterTab === "done") return c.status === "done";
        return c.status === "open";
      })
      .filter((c) => {
        if (!searchQuery) return true;
        return (
          c.person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.item?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [cards, filterTab, searchQuery]);

  const CurrentIcon = OCCUPATION_MAP[shopType]?.icon || Store;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Occupation Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">Dukaan Diary</h1>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {shopName} {ownerEmail ? `• ${ownerEmail}` : ""}
                </p>
              </div>
            </div>

            {/* Profession Locked Badge (Non-editable, fixed from signup) */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <CurrentIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">{OCCUPATION_MAP[shopType]?.label}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono ml-1">
                LOCKED
              </span>
            </div>
          </div>

          {/* Engine Controls & Latency Monitor */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cloud Consent Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Cloud className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-semibold text-slate-600">Cloud Engine:</span>
              <button
                onClick={() => updateConsent(!cloudConsent)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  cloudConsent ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {cloudConsent ? "ON" : "OFF"}
              </button>
            </div>

            {/* Router Mode Selector */}
            <select
              value={routerMode}
              onChange={(e) => updateRouterMode(e.target.value)}
              className="bg-slate-100 text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-200"
            >
              <option value="cloud">Cloud Fast (Gemini Flash Lite)</option>
              <option value="auto">Speed Auto-Route</option>
              <option value="local">Local Only (Gemma 4 via Ollama)</option>
            </select>

            {/* Realtime Latency Counter */}
            {health.last_latency_ms > 0 && (
              <span className="text-xs font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3 text-indigo-600" />
                {Math.round(health.last_latency_ms)}ms
              </span>
            )}

            {/* Exit to Landing Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs font-semibold h-8 border-slate-300 text-slate-700 hover:text-slate-900"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Financial & Order Metrics (Focus on Pending Bills) */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-5 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pending Bills Amount */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pending Dues</p>
              <h3 className="text-2xl font-extrabold text-red-600 mt-0.5">₹{totalBalanceDue}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{pendingDueCards.length} unpaid orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{openCards.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">In current ledger</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Attention / Urgent */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Urgent Attention</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${attentionCards.length > 0 ? "text-amber-600" : "text-slate-800"}`}>
                {attentionCards.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Due within 48h</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Active Model Status */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inference Engine</p>
              <h3 className="text-sm font-bold text-emerald-700 mt-1 capitalize">
                {health.preferred_backend === "cloud" ? "Gemini 3.5 Flash Lite" : "Gemma 4 Local"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Sub-4s fast mode</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigable Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 py-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Recording Station & Physical Flashcard Slip */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Recording Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Voice Order Recorder
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Speak in Hindi, Hinglish, or English. Converts to clean English card.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                {OCCUPATION_MAP[shopType]?.label}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center py-4 w-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/60">
                {isRecording ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse-ring shadow-md">
                      <Square className="w-6 h-6" />
                    </div>
                    <span className="text-red-600 font-bold font-mono text-xs mt-1">
                      Recording: {recordingSeconds}s
                    </span>
                    <Button
                      onClick={stopRecording}
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 h-8 shadow-sm"
                    >
                      Stop & Auto-Generate Flashcard
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <button
                      onClick={startRecording}
                      disabled={isProcessing}
                      className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-md transition disabled:opacity-50"
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                    <p className="text-xs font-semibold text-slate-700">Click to Speak Customer Note</p>
                  </div>
                )}

                {/* Test Note / Upload Audio actions */}
                <div className="mt-4 pt-3 border-t border-slate-200 w-full px-5 flex items-center justify-between text-xs">
                  <label className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Audio
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
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Test Sample Note
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-3.5 w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{processingStatus}</span>
                </div>
              )}

              {flashcardMsg && (
                <div className="mt-3.5 w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{flashcardMsg}</span>
                </div>
              )}

              {editSuccessMsg && (
                <div className="mt-3.5 w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="font-semibold">{editSuccessMsg}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Flashcard Slip View & Editor */}
          {activeFlashcard && (
            <Card className="border-indigo-200 shadow-md overflow-hidden bg-white">
              {/* Slip Header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrentIcon className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-none">
                      Order Flashcard #{activeFlashcard.id}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                      {activeFlashcard.shop_type || shopType} Order Slip
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant="success" className="text-[10px] px-2 py-0.5 font-bold">
                    Saved in Ledger
                  </Badge>
                  {activeFlashcard.used_cloud && (
                    <Badge variant="indigo" className="text-[10px] px-2 py-0.5 font-bold">
                      Cloud
                    </Badge>
                  )}
                </div>
              </div>

              {/* Check if in Edit Mode */}
              {editingCardId === activeFlashcard.id ? (
                /* INLINE EDIT MODE */
                <div className="p-5 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Modify Flashcard Details
                    </span>
                    <span className="text-[11px] text-slate-400">Realtime Math Recalculation</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">Customer Name</label>
                      <Input
                        type="text"
                        value={editForm.person || ""}
                        onChange={(e) => setEditForm({ ...editForm, person: e.target.value })}
                        className="mt-1"
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
                      <label className="font-semibold text-slate-700">Item / Work</label>
                      <Input
                        type="text"
                        value={editForm.item || ""}
                        onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Total Bill (₹)</label>
                      <Input
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
                        className="mt-1 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Advance Paid (₹)</label>
                      <Input
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
                        className="mt-1 font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Balance Due (₹)</label>
                      <div className="mt-1 h-9 flex items-center px-3 bg-slate-100 border border-slate-200 rounded-lg text-sm font-extrabold text-red-600">
                        ₹{editForm.balance_due || 0}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Ready / Delivery Date</label>
                      <Input
                        type="date"
                        value={editForm.due_date || ""}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* Occupation Specific Fields for Tailor */}
                    {shopType === "tailor" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Chest (in)</label>
                          <Input
                            type="number"
                            value={editForm.chest || ""}
                            onChange={(e) => setEditForm({ ...editForm, chest: parseFloat(e.target.value) || null })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Waist (in)</label>
                          <Input
                            type="number"
                            value={editForm.waist || ""}
                            onChange={(e) => setEditForm({ ...editForm, waist: parseFloat(e.target.value) || null })}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}

                    {/* Occupation Specific Fields for Medical */}
                    {shopType === "medical" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Batch No.</label>
                          <Input
                            type="text"
                            value={editForm.batch || ""}
                            onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Expiry (MM/YYYY)</label>
                          <Input
                            type="text"
                            value={editForm.expiry || ""}
                            onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}

                    {/* Occupation Specific Fields for Baker */}
                    {shopType === "baker" && (
                      <>
                        <div>
                          <label className="font-semibold text-slate-700">Flavour</label>
                          <Input
                            type="text"
                            value={editForm.flavour || ""}
                            onChange={(e) => setEditForm({ ...editForm, flavour: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Weight (kg)</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={editForm.weight_kg || ""}
                            onChange={(e) => setEditForm({ ...editForm, weight_kg: parseFloat(e.target.value) || null })}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCardId(null)}
                      className="text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isProcessing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY FLASHCARD SLIP */
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        Customer
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {activeFlashcard.person || "Customer"}
                      </h2>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {activeFlashcard.item || "General Service"}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(activeFlashcard)}
                      className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Flashcard
                    </Button>
                  </div>

                  {/* 4-Box Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{activeFlashcard.amount || 0}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Advance</span>
                      <span className="text-base font-bold text-emerald-600">
                        ₹{activeFlashcard.advance || 0}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance Due</span>
                      <span className={`text-base font-extrabold ${
                        (activeFlashcard.balance_due || 0) > 0 ? "text-red-600" : "text-emerald-600"
                      }`}>
                        ₹{activeFlashcard.balance_due || 0}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Date</span>
                      <span className="text-xs font-bold text-slate-700 mt-1 block">
                        {activeFlashcard.due_date || "Not set"}
                      </span>
                    </div>
                  </div>

                  {/* Occupation Specific Attributes */}
                  {(activeFlashcard.chest || activeFlashcard.waist || activeFlashcard.shoulder || activeFlashcard.length) && (
                    <div className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">
                        Tailor Measurements (Inches)
                      </span>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {activeFlashcard.chest && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block">Chest</span>
                            <span className="font-bold text-slate-800">{activeFlashcard.chest}&quot;</span>
                          </div>
                        )}
                        {activeFlashcard.waist && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block">Waist</span>
                            <span className="font-bold text-slate-800">{activeFlashcard.waist}&quot;</span>
                          </div>
                        )}
                        {activeFlashcard.shoulder && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block">Shoulder</span>
                            <span className="font-bold text-slate-800">{activeFlashcard.shoulder}&quot;</span>
                          </div>
                        )}
                        {activeFlashcard.length && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block">Length</span>
                            <span className="font-bold text-slate-800">{activeFlashcard.length}&quot;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Medical / Baker / Repair extra details */}
                  {(activeFlashcard.batch || activeFlashcard.expiry || activeFlashcard.flavour || activeFlashcard.weight_kg) && (
                    <div className="mb-4 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-4 text-xs">
                      {activeFlashcard.batch && (
                        <span><strong>Batch:</strong> {activeFlashcard.batch}</span>
                      )}
                      {activeFlashcard.expiry && (
                        <span><strong>Expiry:</strong> {activeFlashcard.expiry}</span>
                      )}
                      {activeFlashcard.flavour && (
                        <span><strong>Flavour:</strong> {activeFlashcard.flavour}</span>
                      )}
                      {activeFlashcard.weight_kg && (
                        <span><strong>Weight:</strong> {activeFlashcard.weight_kg} kg</span>
                      )}
                    </div>
                  )}

                  {/* Voice Note Quote */}
                  {activeFlashcard.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                        Spoken Voice Note
                      </span>
                      &quot;{activeFlashcard.notes}&quot;
                    </div>
                  )}

                  {/* Shopkeeper Owner Alert & SMS Section (Sent to defined credentials) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Your Alert Credentials
                      </span>
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3 text-indigo-500" /> {ownerEmail || "owner@dukaandiary.com"}
                        <span className="text-slate-300">&bull;</span>
                        <Phone className="w-3 h-3 text-indigo-500" /> {ownerPhone || "+91 9876543210"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleSendOwnerAlert(activeFlashcard, "email")}
                        className="flex-1 sm:flex-initial h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <Mail className="w-3 h-3 mr-1" /> Email Me Card
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendOwnerAlert(activeFlashcard, "sms")}
                        className="flex-1 sm:flex-initial h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700"
                      >
                        <Phone className="w-3 h-3 mr-1" /> SMS Alert
                      </Button>
                    </div>
                  </div>

                  {notifyMsg && (
                    <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{notifyMsg}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </section>

        {/* Right Column (7 Cols): Pending Bills & Smart Ledger */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <Card className="border-slate-200 shadow-xs flex-1 flex flex-col">
            
            {/* Header & Filter Tabs */}
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={filterTab === "pending" ? "default" : "ghost"}
                  onClick={() => setFilterTab("pending")}
                  className={`text-xs h-7 px-3 ${filterTab === "pending" ? "bg-red-600 hover:bg-red-700 text-white" : "text-slate-600"}`}
                >
                  Pending Bills ({pendingDueCards.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "all" ? "default" : "ghost"}
                  onClick={() => setFilterTab("all")}
                  className={`text-xs h-7 px-3 ${filterTab === "all" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-600"}`}
                >
                  All Orders ({openCards.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "attention" ? "default" : "ghost"}
                  onClick={() => setFilterTab("attention")}
                  className={`text-xs h-7 px-3 ${filterTab === "attention" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-slate-600"}`}
                >
                  Urgent Attention ({attentionCards.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "done" ? "default" : "ghost"}
                  onClick={() => setFilterTab("done")}
                  className={`text-xs h-7 px-3 ${filterTab === "done" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-slate-600"}`}
                >
                  Completed
                </Button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search customer / item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </CardHeader>

            {/* Ledger List */}
            <CardContent className="p-4 flex-1 overflow-y-auto max-h-[640px] space-y-2.5">
              {displayedCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No orders in this view.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the microphone to record new orders.</p>
                </div>
              ) : (
                displayedCards.map((c) => {
                  const isCurrentActive = activeFlashcard?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrentActive
                          ? "border-indigo-400 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-300"
                          : c.needs_attention
                          ? "border-amber-300 bg-amber-50/30"
                          : c.status === "done"
                          ? "border-slate-200 bg-slate-50 opacity-70"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">
                              {c.person || "Customer"}
                            </h4>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 capitalize">
                              {c.shop_type}
                            </Badge>
                            {c.needs_attention && (
                              <Badge variant="warning" className="text-[10px] px-2 py-0 font-bold">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            {c.item || "General Service"}
                          </p>
                        </div>

                        {/* Financial Amounts */}
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Total: <span className="font-bold text-slate-900">₹{c.amount}</span> | Adv: ₹{c.advance}
                          </p>
                          <p className="text-xs font-bold mt-0.5">
                            Balance Due:{" "}
                            <span className={c.balance_due > 0 ? "text-red-600 font-extrabold" : "text-emerald-600 font-bold"}>
                              ₹{c.balance_due}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            Ready: {c.due_date || "Not set"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            #{c.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* View as Flashcard */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFlashcard(c)}
                            className="h-7 px-2 text-xs text-slate-700 hover:text-indigo-600"
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>

                          {/* Edit Flashcard */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveFlashcard(c);
                              startEditing(c);
                            }}
                            className="h-7 px-2.5 text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Edit3 className="w-3 h-3 mr-1" /> Edit
                          </Button>

                          {/* Mark Done */}
                          {c.status === "open" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkDone(c.id)}
                              className="h-7 px-2.5 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                            </Button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
          Loading Dukaan Diary Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
