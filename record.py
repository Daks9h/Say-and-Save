import sounddevice as sd
import soundfile as sf

sr = 16000
seconds = 8
print("Recording... speak now")
data = sd.rec(int(seconds * sr), samplerate=sr, channels=1, dtype="float32")
sd.wait()
sf.write("test.wav", data, sr, subtype="PCM_16")
print("Saved test.wav")