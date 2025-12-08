# Quick Fix: useAppRole Import Error

## ✅ Fixed

**Problem:** `ReferenceError: useAppRole is not defined` in `PagesContentAuthenticated`

**Solution:** Added missing import in `src/pages/index.jsx`:

```typescript
import { useAppRole } from "@/hooks/useAppRole";
import { useDevRole } from "@/contexts/DevRoleContext";
```

## 🔄 Next Steps

1. **Hard refresh the browser:**
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

2. **Or restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Verify Dev Mode is enabled:**
   - Check `.env` file has: `VITE_SEF_PARTNER_HUB_DEV_MODE=true`
   - Restart dev server after changing `.env`

## ✅ Verification

- ✅ Import added to `src/pages/index.jsx`
- ✅ Build succeeds (no syntax errors)
- ✅ Hook is properly exported from `src/hooks/useAppRole.ts`
- ✅ All providers are correctly wrapped in `src/App.jsx`

The error should be resolved after refreshing/restarting!

