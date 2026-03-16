# 🛠️ Startup & First-Time Configuration

After running `docker compose up`, some services require a one-time setup to ensure secure communication and connectivity.

---

## 1. Matrix & Element (Communication)
The Matrix (Synapse) server handles internal clinical messages.

1. **Create Initial Admin**:
   Run the following inside the `intake-synapse` container:
   ```bash
   docker exec -it intake-synapse register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008
   ```
2. **Access via Element**:
   - Open `http://[NAS-IP]:8091`.
   - Change the homeserver URL to `http://[NAS-IP]:8008`.
   - Log in with the credentials created above.

---

## 2. WireGuard (Remote Access)
WireGuard provides high-performance tunnels for staff on mobile tablets.

1. **Access Web UI**: Open `http://[NAS-IP]:51821`.
2. **Default Password**: `vanguard_wg_pass` (Change this in `docker-compose.nas.yml`).
3. **Add Client**: Click "Add Client" and download the QR code/Config file for the WireGuard app on the staff tablet.

---

## 3. Tailscale (Mesh Networking)
Tailscale connects the NAS to your admin laptop/development environment.

1. **View Login Link**:
   ```bash
   docker logs intake-tailscale
   ```
2. **Authenticate**: Click the URL in the logs to authenticate the node to your Tailscale tailnet.
3. **MagicDNS**: Once connected, you can access the NAS using the hostname `blaqdiamonds-intake`.

---

## 4. Prisma & Database Troubleshooting
If the app shows a "Database Connection Error":

- **Check Service**: `docker ps` (Ensure `intake-db` is healthy).
- **Check Migrations**:
  ```bash
  docker exec -it intake-system npx prisma migrate status
  ```
- **Reset (DANGER)**:
  ```bash
  npx prisma migrate reset
  ```

---

## 5. Ollama (AI Intelligence)
On first run, Ollama may need to pull the specific clinical model.

```bash
docker exec -it intake-ollama ollama pull gemma2:2b
```
Check status: `docker logs intake-ollama`.
