# Feature: Global Theme "iOS"

## Deskripsi
Pengguna ingin menambahkan *Global Theme* baru bernama **iOS**. Tema ini akan diaplikasikan pada seluruh komponen antarmuka (Overlay, Chatbox, Dialogue Box) dengan gaya yang bersih, elegan, dan estetik ala Apple/iOS (Glassmorphism, font sans-serif seperti San Francisco / Inter, warna netral cerah/putih dengan aksen biru/hitam).

## Rencana Implementasi

1. **Update CSS Variables (`fe/src/styles.css`)**
   - Menambahkan *class* `.theme-ios`.
   - Mengatur `--background`, `--surface`, `--primary`, `--font-display`, `--font-body`, dan lain-lain dengan palet warna iOS.
   - Mengatur desain *Chatbox* (`.theme-ios .pop-message-bubble`) menjadi seperti *bubble* iMessage (melengkung, *clean*, tanpa *border* tebal).
   - Mengatur desain *Dialogue Box* menjadi seperti *notification banner* iOS.

2. **Update Context (`fe/src/context/StreamContext.tsx`)**
   - Menambahkan tipe `"ios"` ke dalam `ThemeName`.

3. **Update Theme Switcher (`fe/src/components/ThemeSwitcher.tsx`)**
   - Menambahkan opsi `{ id: "ios", label: "iOS" }` ke dalam *array* `THEMES` agar bisa dipilih dari *Dashboard*.

4. **Update Backend Validasi (`be/src/routes/theme.ts`)**
   - Menambahkan `"ios"` ke dalam `VALID_THEMES` agar API menerima perubahan *state* tema ini.

## Proses
Jika rencana ini disetujui, saya akan:
1. Mempublikasikan *issue* ini ke GitHub (`gh issue create`).
2. Membuat *branch* baru (`feature/issue-[ID]-ios-theme`).
3. Menulis dan men-*commit* kodenya.
4. Membuat *Pull Request* baru.
