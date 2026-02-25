#!/usr/bin/env python3
"""
startup_project.py
==================
One-click startup script for the Real-Time Transaction Audit System.

What it does (in order):
  1. Starts PostgreSQL + pgAdmin via Docker Compose
  2. Waits until the DB is healthy
  3. Runs Prisma generate + migrate (if needed)
  4. Starts the backend  (npm run dev)  in a new terminal window
  5. Starts the frontend (npm run dev)  in a new terminal window
  6. Prints a summary of all running service URLs

Requirements:
  - Python 3.8+
  - Docker Desktop must be running
  - Node.js + npm installed
  - Run from the project root  OR  any directory (paths are resolved relative to this file)
"""

import subprocess
import sys
import os
import time
import socket
import platform
import io

# Force UTF-8 output on Windows so Unicode chars don't crash
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ── Resolve absolute paths relative to this script ────────────────────────────
ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "fontend")   # note: folder is named "fontend"
ENV_FILE     = os.path.join(ROOT, ".env.docker")

# ── Configuration (matches .env.docker defaults) ──────────────────────────────
DB_HOST      = "localhost"
DB_PORT      = 5433           # mapped host port for Postgres
PGADMIN_PORT = 5051
BACKEND_PORT = 3000           # default Express port (adjust if different)
FRONTEND_PORT= 5173           # default Vite port

# -- Console output helpers --------------------------------------------------
IS_WINDOWS = platform.system() == "Windows"

def log(msg: str):
    print(f"    {msg}")

def step(msg: str):
    print(f"\n[*] {msg}")

def ok(msg: str):
    print(f"  [OK] {msg}")

def warn(msg: str):
    print(f"  [!!] {msg}")

def err(msg: str):
    print(f"  [XX] {msg}")


def run(cmd: list[str], cwd: str = ROOT, check: bool = True, capture: bool = False):
    """Run a command and optionally capture output."""
    kwargs = dict(cwd=cwd, check=check)
    if capture:
        kwargs["capture_output"] = True
        kwargs["text"] = True
    return subprocess.run(cmd, **kwargs)

def run_npm(args: list[str], cwd: str = ROOT, check: bool = True):
    """
    Run npm / npx reliably on Windows.
    On Windows, npm and npx are .cmd scripts – they require shell=True.
    On Linux/macOS they are real executables, so shell is not needed.
    """
    cmd = " ".join(args)
    return subprocess.run(
        cmd,
        cwd=cwd,
        check=check,
        shell=True,
    )

# ── 1. Docker ─────────────────────────────────────────────────────────────────
def kill_container_on_port(port: int):
    """Stop & remove any Docker container that has host port `port` mapped."""
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "--format", "{{.ID}} {{.Ports}}"],
            capture_output=True, text=True, check=False
        )
        for line in result.stdout.splitlines():
            parts = line.split(None, 1)
            if len(parts) == 2 and f":{port}->" in parts[1]:
                cid = parts[0]
                warn(f"Found container {cid} holding port {port} – stopping it …")
                subprocess.run(["docker", "stop", cid], check=False, capture_output=True)
                subprocess.run(["docker", "rm",   cid], check=False, capture_output=True)
                ok(f"Removed orphan container {cid}.")
    except FileNotFoundError:
        pass  # docker not available; handled later


def start_docker():
    step("Starting Docker services (PostgreSQL + pgAdmin) …")
    try:
        # Kill any orphan container holding our DB port
        kill_container_on_port(DB_PORT)

        # Bring down compose-managed containers (frees volume locks, network, etc.)
        log("Tearing down previous compose stack (if any) …")
        run(
            ["docker", "compose", "--env-file", ENV_FILE, "down"],
            capture=False,
            check=False,
        )
        time.sleep(1)

        run(
            ["docker", "compose", "--env-file", ENV_FILE, "up", "-d"],
            capture=False,
        )
        ok("Docker containers started.")
    except FileNotFoundError:
        err("'docker' command not found. Is Docker Desktop installed and in PATH?")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        err(f"docker compose failed (exit {e.returncode}). Check Docker Desktop is running.")
        sys.exit(1)

# ── 2. Wait for Postgres ───────────────────────────────────────────────────────
def wait_for_postgres(timeout: int = 60):
    step(f"Waiting for PostgreSQL to be ready on port {DB_PORT} …")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((DB_HOST, DB_PORT), timeout=2):
                ok(f"PostgreSQL is accepting connections on :{DB_PORT}")
                return
        except OSError:
            log("  … not ready yet, retrying in 2 s")
            time.sleep(2)
    err(f"PostgreSQL did NOT become ready within {timeout} s. Aborting.")
    sys.exit(1)

# ── 3. Prisma ─────────────────────────────────────────────────────────────────
def run_prisma():
    step("Running Prisma generate + migrate deploy …")

    # Check that node_modules exist; if not, install first
    node_modules = os.path.join(BACKEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        warn("node_modules not found in backend – running npm install …")
        run_npm(["npm", "install"], cwd=BACKEND_DIR)
        ok("npm install completed.")

    try:
        run_npm(["npx", "prisma", "generate"], cwd=BACKEND_DIR)
        ok("prisma generate – done.")
    except subprocess.CalledProcessError:
        warn("prisma generate had errors (continuing anyway).")

    try:
        run_npm(["npx", "prisma", "db", "push", "--skip-generate"], cwd=BACKEND_DIR)
        ok("prisma db push – done.")
    except subprocess.CalledProcessError:
        warn("prisma db push had errors. Check DATABASE_URL in backend/.env")

# ── 4 & 5. Open new terminals ─────────────────────────────────────────────────
def open_new_terminal(title: str, cwd: str, npm_cmd: str) -> subprocess.Popen:
    """
    Open a new detached terminal window running 'npm run <npm_cmd>'.
    Works on Windows (cmd/PowerShell) and Linux/macOS (gnome-terminal / osascript).
    """
    if IS_WINDOWS:
        # Use PowerShell Start-Process so it works in any calling context
        # (IDE terminals, non-interactive shells, etc.)
        ps_cmd = (
            f"Start-Process powershell -ArgumentList "
            f"'-NoExit', '-Command', 'cd \"{cwd}\"; npm run {npm_cmd}' "
            f"-WindowStyle Normal"
        )
        proc = subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
    elif sys.platform == "darwin":
        script = (
            f'tell app "Terminal" to do script '
            f'"cd {cwd} && npm run {npm_cmd}"'
        )
        proc = subprocess.Popen(["osascript", "-e", script])
    else:
        # Try gnome-terminal; fall back to xterm
        try:
            proc = subprocess.Popen(
                ["gnome-terminal", "--title", title, "--", "bash", "-c",
                 f"cd '{cwd}' && npm run {npm_cmd}; exec bash"]
            )
        except FileNotFoundError:
            proc = subprocess.Popen(
                ["xterm", "-title", title, "-e",
                 f"bash -c \"cd '{cwd}' && npm run {npm_cmd}; exec bash\""]
            )
    return proc

def start_backend():
    step("Launching Backend (npm run dev) in a new terminal …")

    # Ensure node_modules present
    node_modules = os.path.join(BACKEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        warn("node_modules not found in backend – running npm install first …")
        run_npm(["npm", "install"], cwd=BACKEND_DIR)

    proc = open_new_terminal("Backend – Transaction Audit", BACKEND_DIR, "dev")
    ok(f"Backend terminal opened  (PID {proc.pid})")

def start_frontend():
    step("Launching Frontend (npm run dev) in a new terminal …")

    # Ensure node_modules present
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        warn("node_modules not found in frontend – running npm install first …")
        run_npm(["npm", "install"], cwd=FRONTEND_DIR)

    proc = open_new_terminal("Frontend – Transaction Audit", FRONTEND_DIR, "dev")
    ok(f"Frontend terminal opened  (PID {proc.pid})")

# -- Summary ------------------------------------------------------------------
def print_summary():
    sep = "=" * 58
    print()
    print(sep)
    print("  All services started!")
    print(sep)
    print(f"  Frontend   ->  http://localhost:{FRONTEND_PORT}")
    print(f"  Backend    ->  http://localhost:{BACKEND_PORT}")
    print(f"  pgAdmin    ->  http://localhost:{PGADMIN_PORT}")
    print(f"  PostgreSQL ->  localhost:{DB_PORT}")
    print()
    print("  To stop Docker services run:")
    print("    docker compose --env-file .env.docker down")
    print(sep)
    print()

# -- Entry point --------------------------------------------------------------
if __name__ == "__main__":
    sep = "=" * 58
    print()
    print(sep)
    print("  Real-Time Transaction Audit System -- Startup")
    print(sep)

    start_docker()
    wait_for_postgres()
    run_prisma()
    start_backend()

    # Give the backend a moment to bind its port before the frontend tries to proxy
    time.sleep(2)

    start_frontend()
    print_summary()
