/**
 * Cloudflare Pages Functions — Eliminación de Comentarios (Moderación rápida)
 * Endpoint: /api/comments/delete?id=XX&token=YY
 */

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const commentId = searchParams.get("id");
  const token = searchParams.get("token");

  const modSecret = context.env.MOD_SECRET;
  const db = context.env.DB;

  // Verificación de seguridad
  if (!modSecret || !token || token !== modSecret) {
    return new Response(renderHtml("Acceso no autorizado", "El token de moderación es inválido o no está configurado.", false), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (!commentId) {
    return new Response(renderHtml("Solicitud incompleta", "Falta el ID del comentario a eliminar.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (!db) {
    return new Response(renderHtml("Error de configuración", "La base de datos D1 no está vinculada.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  try {
    const result = await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();

    if (result.meta?.changes === 0) {
      return new Response(
        renderHtml("Comentario no encontrado", `El comentario #${commentId} ya había sido eliminado previamente o no existe.`, true),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        }
      );
    }

    return new Response(
      renderHtml("Comentario eliminado", `El comentario #${commentId} ha sido eliminado exitosamente de la base de datos.`, true),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  } catch (err) {
    return new Response(renderHtml("Error al eliminar", err.message || "Ocurrió un error inesperado al acceder a D1.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

function renderHtml(title, message, isSuccess) {
  const accentColor = isSuccess ? "#22c55e" : "#ef4444";
  const iconSvg = isSuccess
    ? `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#22c55e" stroke-opacity="0.25" fill="#22c55e" fill-opacity="0.1"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>`
    : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-opacity="0.25" fill="#ef4444" fill-opacity="0.1"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Kasnia Project</title>
  <style>
    :root {
      color-scheme: dark;
    }
    body {
      margin: 0;
      padding: 2rem 1rem;
      background: #0d0e12;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #181a22;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 2.75rem 2rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7);
    }
    .iconWrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    h1 {
      margin: 0 0 0.75rem 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      font-size: 0.95rem;
      color: #94a3b8;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      margin-top: 1.75rem;
      padding: 0.35rem 0.9rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="iconWrapper">${iconSvg}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">Moderación Kasnia Project</div>
  </div>
</body>
</html>`;
}

