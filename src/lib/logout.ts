"use client";

export async function logout() {
  try {
    // 1. Panggil API logout
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore error, tetap lanjut logout
  }

  // 2. Hapus cookie di client (backup)
  document.cookie = "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // 3. Clear history state dan redirect
  window.history.replaceState(null, "", "/admin/login");
  
  // 4. Redirect ke login
  window.location.replace("/admin/login");
}