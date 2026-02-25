import time
import socket
import json
import os
import http.server
import socketserver
import threading
from zeroconf import IPVersion, ServiceInfo, Zeroconf, ServiceBrowser

# Path for the shared state file
STATE_FILE = "/app/data/fleet/fleet_state.json"
MESH_FILE = "/app/data/fleet/mesh_topology.json"

class MeshHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/mesh/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            health = {"status": "VANGUARD_READY", "uptime": time.time() - start_time}
            self.wfile.write(json.dumps(health).encode())
        else:
            self.send_error(404)

def start_mesh_api(port=8000):
    with socketserver.TCPServer(("", port), MeshHandler) as httpd:
        print(f"📡 Vanguard Mesh API active on port {port}")
        httpd.serve_forever()

class FleetListener:
    def __init__(self):
        self.peers = {}

    def remove_service(self, zeroconf, type, name):
        if name in self.peers:
            print(f"➖ Mesh Node Exit: {name}")
            del self.peers[name]
            self.update_state()

    def add_service(self, zeroconf, type, name):
        info = zeroconf.get_service_info(type, name)
        if info:
            ip = socket.inet_ntoa(info.addresses[0])
            self.peers[name] = {
                "name": name,
                "ip": ip,
                "port": info.port,
                "properties": {k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v 
                               for k, v in info.properties.items()},
                "last_seen": time.time(),
                "mesh_role": "vanguard_node"
            }
            print(f"➕ Mesh Node Discovered: {name} at {ip}")
            self.update_state()

    def update_service(self, zeroconf, type, name):
        self.add_service(zeroconf, type, name)

    def update_state(self):
        try:
            os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
            # Fleet state for dashboard
            with open(STATE_FILE, 'w') as f:
                json.dump(list(self.peers.values()), f)
            # Mesh topology for Vanguard analytics
            with open(MESH_FILE, 'w') as f:
                topology = {
                    "node_count": len(self.peers),
                    "nodes": list(self.peers.keys()),
                    "tier": "Vanguard-P2P"
                }
                json.dump(topology, f)
        except Exception as e:
            print(f"❌ Error updating mesh state: {e}")

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

start_time = time.time()

def start_discovery():
    local_ip = get_ip()
    hostname = socket.gethostname()
    
    print(f"🦅 Project Vanguard Discovery starting on {local_ip}...")
    
    desc = {
        'version': '4.0', 
        'deterministic': 'true', 
        'tier': 'vanguard', 
        'mesh_port': '8000'
    }

    info = ServiceInfo(
        "_intake-sync._tcp.local.",
        f"{hostname}.{local_ip}._intake-sync._tcp.local.",
        addresses=[socket.inet_aton(local_ip)],
        port=80,
        properties=desc,
        server=f"{hostname}.local.",
    )

    zeroconf = Zeroconf(ip_version=IPVersion.V4Only)
    print(f"📢 Broadcasting Vanguard identity: {hostname}.local")
    
    # Start Mesh API in background
    api_thread = threading.Thread(target=start_mesh_api, daemon=True)
    api_thread.start()
    
    zeroconf.register_service(info)
    
    listener = FleetListener()
    browser = ServiceBrowser(zeroconf, "_intake-sync._tcp.local.", listener)
    
    try:
        while True:
            # Cleanup
            stale = [name for name, data in listener.peers.items() 
                     if time.time() - data['last_seen'] > 30]
            for name in stale:
                print(f"⏰ Mesh Node Timeout: {name}")
                del listener.peers[name]
                listener.update_state()
            time.sleep(5)
    except KeyboardInterrupt:
        pass
    finally:
        zeroconf.unregister_service(info)
        zeroconf.close()

if __name__ == "__main__":
    start_discovery()
