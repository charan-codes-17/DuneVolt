# Deploying DuneVolt to Render

This guide outlines how to deploy the DuneVolt Digital Twin (Node/Express + WebSocket server) to Render's free tier.

---

## 1. Connect GitHub Repository to Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** in the top navigation bar.
3. You can deploy using either **Blueprints** (automatic with `render.yaml`) or **Web Service**:

### Option A: Blueprints (Recommended — One-Click Setup)
1. Select **Blueprint**.
2. Connect your GitHub account and select the **DuneVolt** repository.
3. Render detects `render.yaml` automatically and populates all service configurations.
4. Click **Apply**.

### Option B: Manual Web Service
1. Select **Web Service**.
2. Connect your GitHub account and choose the **DuneVolt** repository.
3. Configure the following fields:
   - **Name**: `dunevolt` (or your preferred name)
   - **Environment**: `Node`
   - **Plan**: `Free`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path** (under Advanced): `/health`
4. Click **Create Web Service**.

---

## 2. Environment & Port Binding

Render automatically provisions a dynamic port via the `PORT` environment variable and exposes your service under HTTPS/WSS on a single public port.

- The server binds to `0.0.0.0` and `process.env.PORT || 3000`.
- The WebSocket server attaches directly to the HTTP server instance (`server`), enabling full HTTP and WebSocket co-hosting over the single exposed port.
- The front-end automatically connects via `wss://` when loaded over HTTPS.

---

## 3. Confirming the Deployment (*.onrender.com)

Once the deployment completes and the status shows **Live**:

1. **Verify Health Check Endpoint**:
   - Navigate to `https://<your-service-name>.onrender.com/health`
   - Confirm it returns HTTP 200 with the text `ok`.

2. **Open the 3D Judge Dashboard**:
   - Navigate to `https://<your-service-name>.onrender.com/` on your PC or presentation screen.
   - Confirm 3D scene renders and telemetry stream loads.

3. **Open the Mobile Controller & Confirm Sync**:
   - Open `https://<your-service-name>.onrender.com/controller` on your smartphone (or a separate browser window).
   - Observe the connection indicator turn to green (`CONNECTED`).
   - Move any slider (e.g., Sun Elevation, Dust) or tap an autonomous action (e.g., *Simulate Sandstorm*).
   - Confirm the 3D Dashboard updates instantly in real time via secure WebSocket (`wss://`).
