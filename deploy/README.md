# Claude Manager deployment

Run from this checkout when ready to ship an update:

```bash
bun run deploy
```

The deploy script installs dependencies from the lockfile, builds all workspaces, renders the tracked user-service template, reloads systemd, and restarts only `claude-manager.service`.

The generated unit resolves Bun from `BUN_INSTALL` or `~/.bun/bin/bun` and records its canonical path. Deployment refuses temporary `/tmp` executables because they do not survive reboot.

To restart the installed service without deploying:

```bash
systemctl --user restart claude-manager.service
```

Terminal sessions use `dtach`, which creates a separate process group and session for each managed terminal. The service combines `ExecStop` process-group signaling with `KillMode=process`: Claude Manager's backend, frontend, and Caddy processes stop, while detached terminal process groups remain alive. Browsers reconnect to those sessions after startup.

Always use the deploy script for the first rollout of this unit definition. It installs and reloads the safe stop behavior before issuing the restart. Do not replace it with broad commands such as `pkill bun` or stopping `user@.service`; those commands can terminate agents and unrelated services.
