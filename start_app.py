import os
import sys
import time
import subprocess
import webbrowser

def main():
    print("=" * 60)
    print("   Starting Dukaan Diary (दुकान डायरी)")
    print("   Voice-Powered Ledger for Local Shops")
    print("=" * 60)

    # 1. Start FastAPI backend
    print("\n[1/2] Starting Python FastAPI Backend on port 8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    # Wait for backend to be ready
    time.sleep(2)
    print("      ✓ FastAPI Backend is live at http://localhost:8000")

    # 2. Start Next.js frontend
    print("\n[2/2] Starting Next.js Argon Frontend on port 3000...")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    frontend_cmd = "npm run start" if os.path.exists(os.path.join(frontend_dir, ".next")) else "npm run dev"
    
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        shell=True
    )

    print("      ✓ Next.js Frontend is launching at http://localhost:3000")
    print("\n" + "=" * 60)
    print("   Open your browser at: http://localhost:3000")
    print("   Press Ctrl+C in this terminal to stop both servers.")
    print("=" * 60 + "\n")

    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping Dukaan Diary servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()

