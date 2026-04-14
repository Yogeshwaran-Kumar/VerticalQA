# 🚀 START HERE — Vertical QA Quick Start

## Choose Your Setup

### Option 1: Single Laptop (Testing)
**Use this if**: You want to test on one computer with multiple browser tabs

👉 **Go to**: [Single Laptop Setup](#single-laptop-setup)

---

### Option 2: Multiple Laptops (Network)
**Use this if**: You want Customer, Agent, and Supervisor on different computers

👉 **Go to**: [Multiple Laptops Setup](#multiple-laptops-setup)

---

## Single Laptop Setup

### ⚡ 3 Steps to Run

#### Step 1: Start Backend

Open **Terminal 1**:

```bash
cd vertical-qa/backend
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Wait for: `✅ Application startup complete.`

#### Step 2: Start Frontend

Open **Terminal 2** (new terminal):

```bash
cd vertical-qa/frontend
npm run dev
```

Wait for: `➜  Local:   http://localhost:5173/`

#### Step 3: Open Browser

Go to: **http://localhost:5173**

### 🎭 Test with 3 Roles

Open **3 browser tabs**:

**Tab 1 - Customer:**
1. Click "Customer"
2. Name: "John"
3. Room: "room-123"
4. Click "Start Call"
5. Allow microphone ✅

**Tab 2 - Agent:**
1. Click "Agent"
2. Name: "Sarah"
3. Room: "room-123" (same!)
4. Click "Join Call"
5. Allow microphone ✅

**Tab 3 - Supervisor:**
1. Click "Supervisor"
2. Name: "Manager"
3. Click on active call to monitor

✅ **Done!** All three roles connected.

---

## Multiple Laptops Setup

### ⚡ 5 Steps to Run

#### Step 1: Find Server IP

On the **server laptop** (the one that will run the app):

**Windows:**
```bash
ipconfig
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

📝 **Write down the IP** (e.g., `192.168.1.100`)

#### Step 2: Update Frontend Config

On the **server laptop**, edit this file:

```
vertical-qa/frontend/.env.development
```

Change this line:
```env
VITE_WS_URL=ws://192.168.1.100:8000
```

Replace `192.168.1.100` with YOUR server IP from Step 1.

#### Step 3: Start Backend

On the **server laptop**, open **Terminal 1**:

```bash
cd vertical-qa/backend
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 4: Start Frontend

On the **server laptop**, open **Terminal 2**:

```bash
cd vertical-qa/frontend
npm run dev -- --host
```

Look for: `➜  Network: http://192.168.1.100:5173/`

#### Step 5: Connect from Other Laptops

On **any other laptop** on the same Wi-Fi:

Open browser: **http://192.168.1.100:5173**

(Replace with your server IP)

### 🎭 Test Across Laptops

**Laptop 1 (Customer):**
- Open: `http://192.168.1.100:5173`
- Select "Customer" → Start Call

**Laptop 2 (Agent):**
- Open: `http://192.168.1.100:5173`
- Select "Agent" → Join Call (same room ID)

**Laptop 3 (Supervisor):**
- Open: `http://192.168.1.100:5173`
- Select "Supervisor" → Monitor Call

✅ **Done!** All laptops connected.

---

## 🔥 Firewall Fix (Windows)

If other laptops can't connect, run this in PowerShell (as Administrator):

```powershell
New-NetFirewallRule -DisplayName "Vertical QA Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "Vertical QA Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## ❓ Common Issues

### "Backend won't start"
- Check if port 8000 is in use
- Verify `.env` file exists in `backend/` folder
- Check Python version: `python --version` (need 3.9+)

### "Frontend won't start"
- Check if port 5173 is in use
- Run: `npm install` in frontend folder
- Check Node version: `node --version` (need 18+)

### "No transcripts appearing"
- Check microphone permissions in browser
- Open browser console (F12) for errors
- Verify API keys in `backend/.env` file

### "Can't connect from other laptops"
- Check all laptops on same Wi-Fi
- Run firewall commands (Windows)
- Test: `curl http://SERVER_IP:8000/health`

---

## 📚 More Help

- **Detailed Guide**: See `RUN_APPLICATION.md`
- **Network Setup**: See `NETWORK_SETUP.md`
- **Full Documentation**: See `README.md`

---

## 🎯 What You Should See

### Customer Screen:
- Call interface (mute, end call, timer)
- Your transcript

### Agent Screen:
- Call interface
- Full transcript (Customer + Agent)
- AI Insights panel:
  - Intent
  - Sentiment
  - Escalation Risk
  - Toxicity
  - AI Suggestions

### Supervisor Screen:
- List of active calls
- Agent status
- Sentiment chart
- Detailed view with transcript + AI insights

---

## ✅ Quick Test

1. Customer says: "I want to cancel my account"
2. Agent should:
   - Hear customer's voice
   - See transcript appear
   - See AI show: Intent = "cancellation_request"
   - See Escalation Risk = "MEDIUM" or "HIGH"
3. Supervisor should:
   - See same transcript
   - See same AI insights
   - Get real-time updates

---

**Ready to start?** Choose your setup above and follow the steps!

**Need help?** Check the troubleshooting section or see `RUN_APPLICATION.md` for detailed instructions.
