# Codex + RTK Workflow (Windows)

Use this workflow for every coding task so RTK statistics are complete and comparable.

## Window Setup

### Window A (dev server)
```powershell
cd D:\project\simple_saas
rtk pnpm dev
```

### Window B (Codex chat)
- Only discuss requirements and feedback.
- Do not run shell commands in this window.

### Window C (execution)
- Run all development, debug, and release commands with `rtk` prefix.

## Development Commands (Window C)
```powershell
rtk git status
rtk rg --files app components lib
rtk rg "keyword" app lib components
rtk pnpm exec tsc --noEmit
rtk pnpm build
```

## Debug Commands (Window C)
```powershell
rtk git diff
rtk git diff --name-only
rtk git log --oneline -20
rtk powershell -Command "Get-Process | Where-Object { $_.ProcessName -match 'node|next' }"
```

## Release Commands (Window C)
```powershell
rtk git status
rtk pnpm build
rtk git add <files>
rtk git commit -m "message"
rtk git push
```

## End-of-Task (Required)
```powershell
rtk gain --daily
rtk gain
```

Record these values after each task:
- `Cmds`
- `Saved`
- `Save%`

## Notes
- RTK only tracks shell commands run through `rtk` (or hook interception when available).
- Codex chat tokens are not included in `rtk gain`.
- If `rtk` is not found in current shell, use:
```powershell
& "C:\Users\Admin\.local\bin\rtk.exe" <command>
```
