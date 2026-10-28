import os
import subprocess
import tempfile
import soundfile as sf

def normalize_to_pcm16_wav(input_path: str) -> str:
    """Converts any browser recording (WebM, Opus, OGG, MP3, AAC, M4A, etc.)
    or non-standard WAV to standard 16000Hz mono 16-bit PCM WAV using ffmpeg.
    Returns the path to the normalized WAV file.
    """
    # 1. First test if already valid 16kHz mono PCM_16 WAV
    try:
        info = sf.info(input_path)
        if info.samplerate == 16000 and info.channels == 1 and info.subtype == "PCM_16":
            return input_path
    except Exception:
        # Not a standard WAV (e.g. browser WebM/Opus with .wav extension)
        pass

    # 2. Convert using ffmpeg
    out_tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    out_path = out_tmp.name
    out_tmp.close()

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        out_path
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        err_msg = res.stderr.decode("utf-8", errors="ignore")
        if os.path.exists(out_path):
            os.remove(out_path)
        raise ValueError(f"FFmpeg failed to convert audio: {err_msg[:200]}")

    return out_path

