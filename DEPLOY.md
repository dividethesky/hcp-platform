# ============================================
# Railway Deployment Configuration
# ============================================
# This project deploys as TWO services on Railway:
#
# 1. Web Service (Next.js) — handles the dashboard, API routes
# 2. Worker Service — processes export jobs from the queue
#
# Both share the same codebase but run different commands.

# ── railway.toml (for the Web service) ──
# Place this at the project root. Railway auto-detects Next.js.
#
# [build]
# builder = "nixpacks"
# buildCommand = "npm install && npm run build"
#
# [deploy]
# startCommand = "npm start"
# healthcheckPath = "/api/health"
# restartPolicyType = "on_failure"
# restartPolicyMaxRetries = 5

# ── Worker service ──
# Create a second service in the same Railway project.
# Set the start command to: npm run worker
# This runs the BullMQ worker that processes export jobs.
#
# For autoscaling, configure in Railway dashboard:
#   - Min instances: 0 (scales to zero when idle)
#   - Max instances: 5
#   - Scale trigger: CPU > 50% OR queue depth > 0
#
# Alternatively, use Railway's cron or process scaling.

# ── Redis ──
# Add a Redis service in Railway (one-click).
# Copy the REDIS_URL to both Web and Worker environment variables.

# ── Environment Variables (set in Railway dashboard) ──
# Both services need:
#   DATABASE_URL
#   SUPABASE_URL
#   SUPABASE_SERVICE_KEY
#   REDIS_URL
#   AWS_ACCESS_KEY_ID
#   AWS_SECRET_ACCESS_KEY
#   AWS_REGION
#   S3_BUCKET
#   JWT_SECRET
#   NEXTAUTH_SECRET
#   NEXT_PUBLIC_APP_URL (web service only)
#
# Worker-specific:
#   WORKER_CONCURRENCY=3
#   MAX_PARALLEL_DOWNLOADS=20
#   SESSION_KEEPALIVE_MS=120000
