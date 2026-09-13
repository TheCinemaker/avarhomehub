# HomeHub - Otthoni Családi Rendszerező & To-Do Webalkalmazás

**Projekt Helye (IDE Workspace)**: `/Users/thecinemaker/.gemini/antigravity-ide/scratch/home-organizer`  
**GitHub Repository**: `https://github.com/TheCinemaker/avarhomehub`  
**Desktop Index**: `PROJECTS/Home_Organizer/`

---

## 1. Description (Leírás)
A HomeHub egy eladásra és családi használatra tervezett otthoni rendszerező webalkalmazás.
Kiemelt elrendezés és működés:
1. **Teljes Kijelzős Új Tétel Modál (Full Screen Modal)**: Az "Új Tétel + Fotó" gombra kattintva egy letisztult, teljes képernyős űrlap nyílik meg, 100%-os mobil, tablet és desktop reszponzivitással.
2. **Termék csomagolás fotó**: Kényelmes képfeltöltési lehetőség fotóval vagy mobil kamerával.
3. **Sűrű, Tömör Bevásárlólista**: Kisméretű sorközökkel rendelkező, gyorsan átlátható lista.
4. **Folyamatos Családi Gyűjtőlista**: Független a naptári napoktól, bármikor bővíthető és pipálható.
5. **Felső Ragadós Fejléc (Sticky Header 40% Áttetszőség)**: "HomeHub a rendszerező" felirattal és Bejelentkezés gombbal.
6. **Egysoros Felhasználó Választó**: Apa, Anya, Ármin, Mindenki.

---

## 2. Current Status (Jelenlegi Állapot)
- **Verzió**: 3.0.0 (Teljes Supabase integráció, `supabase_schema.sql` táblascript, Bejelentkezési & Regisztrációs felület automatikus munkamenet-megjegyzéssel, Új egyedi családtagok hozzáadása, Termékfotók & Boltok felhő szinkronja)
- **Perzisztencia**: Supabase Auth & Cloud Database + LocalStorage offline-first fallback.
- **Dizájn**: Full screen modal, 40% áttetsző sticky header, sűrű felsorolás nézet, 7-oszlopos Naptár Grid, Auth Modál.

---

## 3. Missing Features & Future Roadmap (TODO)
- [x] **Supabase integráció** (auth + valós idejű DB szinkronizáció a készülékek között a SaaS eladhatósághoz).
- [ ] **Régi elemek automatikus törlése rákérdezéssel** (1-2 hét múlva lejáró/kész elemek tisztítása).
- [ ] Netlify & GitHub automatikus CI/CD telepítés.
- [ ] PWA Push Értesítések a lejáró számlákról.

---

## 4. Environment Variables & Keys
- Nincs hardkódolt secret key. Teljesen offline/local környezetben futtatható.

---

## 5. IDE Navigation Links
- [Main App](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/home-organizer/src/App.jsx)
- [Store Hook](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/home-organizer/src/hooks/useHomeStore.ts)
- [CSS Style Tokens](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/home-organizer/src/index.css)
- [TypeScript Definitions](file:///Users/thecinemaker/.gemini/antigravity-ide/scratch/home-organizer/src/types.ts)
