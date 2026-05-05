import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
NODE = "node.exe" if sys.platform.startswith("win") else "node"

GUI_URL = "http://localhost:3000"

SERVICES = [
    ("Registry Service", ROOT / "registry-service", [NODE, "app.js"], 50054, 2),
    ("Temperature Service", ROOT / "services" / "temperature-service", [NODE, "app.js"], 50051, 1),
    ("Occupancy Service", ROOT / "services" / "occupancy-service", [NODE, "app.js"], 50052, 1),
    ("Control Service", ROOT / "services" / "control-service", [NODE, "app.js"], 50053, 1),
    ("GUI Server", ROOT / "client", [NODE, "guiServer.js"], 3000, 2),
]


def port_is_busy(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("localhost", port)) == 0


def find_windows_pids_on_port(port):
    command = [
        "powershell.exe",
        "-NoProfile",
        "-Command",
        (
            f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue "
            "| Select-Object -ExpandProperty OwningProcess -Unique"
        )
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    return {
        int(line.strip())
        for line in result.stdout.splitlines()
        if line.strip().isdigit()
    }


def find_linux_pids_on_port(port):
    if shutil.which("lsof"):
        result = subprocess.run(
            ["lsof", "-ti", f"tcp:{port}"],
            capture_output=True,
            text=True
        )
        return {
            int(line.strip())
            for line in result.stdout.splitlines()
            if line.strip().isdigit()
        }

    if shutil.which("fuser"):
        result = subprocess.run(
            ["fuser", f"{port}/tcp"],
            capture_output=True,
            text=True
        )
        return {
            int(value)
            for value in result.stdout.split()
            if value.isdigit()
        }

    return set()


def find_pids_on_port(port):
    if sys.platform.startswith("win"):
        return find_windows_pids_on_port(port)

    return find_linux_pids_on_port(port)


def stop_windows_pid(pid):
    subprocess.run(
        ["powershell.exe", "-NoProfile", "-Command", f"Stop-Process -Id {pid} -Force"],
        capture_output=True,
        text=True
    )


def stop_linux_pid(pid):
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return

    for _ in range(10):
        try:
            os.kill(pid, 0)
            time.sleep(0.2)
        except ProcessLookupError:
            return

    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        return


def clear_project_ports():
    print("Checking EcoGrid ports before startup...")

    for name, _cwd, _command, port, _delay in SERVICES:
        pids = find_pids_on_port(port)
        pids.discard(os.getpid())

        if not pids:
            continue

        print(f"Port {port} for {name} is already in use. Stopping process(es): {sorted(pids)}")

        for pid in pids:
            if sys.platform.startswith("win"):
                stop_windows_pid(pid)
            else:
                stop_linux_pid(pid)

        time.sleep(0.5)

        if port_is_busy(port):
            raise RuntimeError(
                f"Port {port} is still in use after cleanup. "
                "Close the process manually and try again."
            )


def start_process(name, cwd, command):
    print(f"Starting {name}...")
    return subprocess.Popen(command, cwd=cwd)


def stop_process(name, process):
    if process.poll() is not None:
        return

    print(f"Stopping {name}...")
    process.terminate()

    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def stop_processes(processes):
    print("\nStopping EcoGrid services...")

    for name, process in reversed(processes):
        stop_process(name, process)

    print("All EcoGrid services stopped.")


def main():
    processes = []

    try:
        clear_project_ports()

        for name, cwd, command, _port, delay in SERVICES:
            processes.append((name, start_process(name, cwd, command)))
            if delay:
                time.sleep(delay)

            if processes[-1][1].poll() is not None:
                raise RuntimeError(f"{name} stopped unexpectedly during startup.")

        print("\nEcoGrid is running.")
        print(f"Opening the GUI at: {GUI_URL}")
        print("Press Ctrl+C here to stop all services.\n")
        webbrowser.open(GUI_URL)

        while True:
            for name, process in processes:
                if process.poll() is not None:
                    raise RuntimeError(f"{name} stopped unexpectedly.")
            time.sleep(1)

    except KeyboardInterrupt:
        pass
    except RuntimeError as error:
        print(f"\n{error}")
    finally:
        stop_processes(processes)
        choice = input("Press Enter to return to the terminal prompt, or type e then Enter to exit: ")
        if choice.strip().lower() == "e":
            sys.exit(0)
        if sys.platform.startswith("win"):
            subprocess.call([
                "powershell.exe",
                "-NoExit",
                "-Command",
                f"Set-Location -LiteralPath '{ROOT}'"
            ])


if __name__ == "__main__":
    main()
