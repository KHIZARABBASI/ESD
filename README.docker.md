# Docker build & run (Notes)

This document explains how to build and run the frontend and backend using Docker and docker-compose on Windows PowerShell.

Prerequisites
- Docker Desktop installed and running
- (Optional) Sufficient disk space and internet to download packages (ultralytics / pytorch can be large)

Build and run (PowerShell)

1) From repository root (where `docker-compose.yml` lives):

```powershell
docker compose build
docker compose up -d
```

2) Verify logs:

```powershell
docker compose logs -f
```

Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (e.g. http://localhost:8000/upload)

Important notes & known issues
- Ultralytics and PyTorch: The backend depends on `ultralytics` which typically requires `torch`. The provided `requirements.txt` does not pin a torch wheel. The backend Dockerfile attempts to install a CPU wheel of torch as a best-effort step. If you need GPU support, you'll need a GPU-enabled base image and proper CUDA toolkit and matching torch wheel.
- Large model file (`backend/model/best.pt`): It's mounted as a volume in the compose file. If the model file is large, avoid copying it into the image — keep it in the host `backend/model/` directory and let docker-compose mount it.
- If the backend fails to load the model at startup, call the `/load_model` endpoint after the container is running to see logs and try to load it.
- If you run into binary or wheel issues (compilation failures), install system packages (build-essential, libglib2.0, libgl1) are included in the Dockerfile; add others if a package asks for them.

Troubleshooting
- Container build fails when installing torch/ultralytics: try building without cache and watch the error message. You may need to manually install a specific torch wheel matching your Python version.
- If the frontend cannot reach the backend, ensure docker-compose is up and backend is healthy. The nginx config proxies `/api/` to `http://backend:8000/`; if the frontend code uses absolute URLs (http://localhost:8000), that will also work from the browser.

ConvertAPI (DWF -> PDF)
- The DWF->PDF conversion requires a ConvertAPI account and an API key. Do NOT commit your key to source control.
- Create a file `backend/.env` (or set CONVERT_API_KEY in your environment) with:

```dotenv
CONVERT_API_KEY=sk_live_...your_key_here...
```

The compose file loads `backend/.env` into the backend container (see `docker-compose.yml`). If the key is missing, the backend will return a clear error when you call `/preprocess` with a `.dwf` file.

Frontend static assets (logos) not showing?
- Build-time asset issues usually come from missing files under `frontend/public` or incorrect import paths in the React code. Verify the logo files are present in `frontend/public` or imported in `src` and that the built `dist/` contains them.
- Check the browser devtools Network tab for 404s to see which asset paths are failing. If your app references `/assets/...` ensure those files exist in `public/assets` or are output by the build.
- Check the browser devtools Network tab for 404s to see which asset paths are failing. If your app references `/assets/...` ensure those files exist in `public/assets` or are output by the build.

Using the proxy (/api) vs direct backend URL
- The frontend prefers to call the backend via a relative `/api` path so the nginx server bundled with the frontend can proxy requests to the backend service in docker-compose. This works out-of-the-box when you run the built frontend image and docker-compose.
- During development (vite dev server) you can set `VITE_API_URL` in your environment (for example, `VITE_API_URL=http://localhost:8000`) to talk directly to your running backend. For production builds the `VITE_API_URL` is baked into the build if set at build time.

Quick test script
- I added `scripts/test_upload.ps1` which uploads a file to `/upload` and then runs `/preprocess`, `/load_model`, `/inference`, and `/results`. Use it like:

```powershell
.\scripts\test_upload.ps1 -FilePath C:\path\to\example.pdf
```

