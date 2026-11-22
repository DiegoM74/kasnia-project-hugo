/**
 * Cloudflare Pages Functions — API de Comentarios para Kasnia Project
 * Endpoint: /api/comments
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-cache"
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const novelId = searchParams.get("novelId");

  if (!novelId) {
    return jsonResponse({ error: "Falta el parámetro novelId" }, 400);
  }

  const db = context.env.DB;
  if (!db) {
    return jsonResponse(
      {
        error: "Base de datos D1 no vinculada. Comprueba que en Cloudflare Pages > Settings > Bindings esté añadido el binding 'DB'."
      },
      500
    );
  }

  const scopedNovelId = getScopedNovelId(context.request, novelId);

  try {
    let rawComments = [];
    try {
      const { results } = await db
        .prepare(
          `SELECT id, novel_id, parent_id, author_name, content, created_at, is_staff
           FROM comments
           WHERE novel_id = ? AND is_approved = 1
           ORDER BY created_at ASC`
        )
        .bind(scopedNovelId)
        .all();
      rawComments = results || [];
    } catch {
      // Fallback si la columna is_staff aún no existe en la tabla
      const { results } = await db
        .prepare(
          `SELECT id, novel_id, parent_id, author_name, content, created_at
           FROM comments
           WHERE novel_id = ? AND is_approved = 1
           ORDER BY created_at ASC`
        )
        .bind(scopedNovelId)
        .all();
      rawComments = results || [];
    }

    // Estructuración en árbol
    const commentMap = new Map();
    const rootComments = [];

    for (const c of rawComments) {
      c.replies = [];
      c.is_staff = Boolean(c.is_staff);
      commentMap.set(c.id, c);
    }

    for (const c of rawComments) {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(c);
      } else {
        rootComments.push(c);
      }
    }

    rootComments.reverse();

    return jsonResponse({
      success: true,
      count: rawComments.length,
      comments: rootComments
    });
  } catch (err) {
    return jsonResponse({ error: `Error en D1: ${err.message}` }, 500);
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) {
    return jsonResponse(
      {
        error: "Base de datos D1 no vinculada. Comprueba que en Cloudflare Pages > Settings > Bindings esté añadido el binding 'DB'."
      },
      500
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: "Cuerpo JSON inválido" }, 400);
  }

  const { novelId, novelTitle, novelPath, parentId, author, email, content, website, staffToken } = body;

  // 1. Filtro Honeypot Anti-bot
  if (website) {
    return jsonResponse({ success: true, message: "Comentario recibido" });
  }

  // 2. Validaciones básicas
  if (!novelId || typeof novelId !== "string") {
    return jsonResponse({ error: "novelId es requerido" }, 400);
  }

  const cleanAuthor = (author || "").trim();
  const cleanContent = (content || "").trim();
  const cleanEmail = (email || "").trim() || null;

  if (cleanAuthor.length < 1 || cleanAuthor.length > 50) {
    return jsonResponse({ error: "El nombre debe tener entre 1 y 50 caracteres" }, 400);
  }

  if (cleanContent.length < 1 || cleanContent.length > 1000) {
    return jsonResponse({ error: "El comentario debe tener entre 1 y 1000 caracteres" }, 400);
  }

  // 3. Filtro antispam (enlaces excesivos)
  const linkMatches = cleanContent.match(/https?:\/\//gi);
  if (linkMatches && linkMatches.length > 2) {
    return jsonResponse({ error: "No se permiten comentarios con múltiples enlaces." }, 400);
  }

  const validParentId = parentId && Number.isInteger(Number(parentId)) ? Number(parentId) : null;
  const scopedNovelId = getScopedNovelId(context.request, novelId);
  const url = new URL(context.request.url);
  const isProduction = url.hostname === "kasniaproject.com";

  // Verificación de Staff mediante clave secreta MOD_SECRET
  const modSecret = context.env.MOD_SECRET;
  const isStaff = staffToken && modSecret && staffToken.trim() === modSecret.trim() ? 1 : 0;

  try {
    let newId;
    try {
      const insertResult = await db
        .prepare(
          `INSERT INTO comments (novel_id, parent_id, author_name, author_email, content, is_approved, is_staff)
           VALUES (?, ?, ?, ?, ?, 1, ?)`
        )
        .bind(scopedNovelId, validParentId, cleanAuthor, cleanEmail, cleanContent, isStaff)
        .run();
      newId = insertResult.meta?.last_row_id;
    } catch {
      // Fallback si la columna is_staff aún no existe en D1
      const insertResult = await db
        .prepare(
          `INSERT INTO comments (novel_id, parent_id, author_name, author_email, content, is_approved)
           VALUES (?, ?, ?, ?, ?, 1)`
        )
        .bind(scopedNovelId, validParentId, cleanAuthor, cleanEmail, cleanContent)
        .run();
      newId = insertResult.meta?.last_row_id;
    }

    const newComment = {
      id: newId,
      novel_id: novelId,
      parent_id: validParentId,
      author_name: cleanAuthor,
      content: cleanContent,
      created_at: new Date().toISOString(),
      is_staff: Boolean(isStaff),
      replies: []
    };

    // Resolución precisa del enlace hacia el comentario
    const baseUrl = isProduction ? "https://kasniaproject.com" : url.origin;
    const cleanNovelPath = novelPath ? novelPath.replace(/\/+$/, "") : "/novelas";
    const commentUrl = `${baseUrl}${cleanNovelPath}/#comment-${newId}`;

    // 4. Notificación opcional por Telegram
    const tgToken = context.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = context.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      const host = url.origin;
      const envTag = isProduction ? "" : "🧪 <b>[PREVIEW / DESARROLLO]</b>\n";
      const staffBadgeTag = isStaff ? " 🎖️ <b>[STAFF]</b>" : "";
      const escapedNovel = escapeTelegramHTML(novelTitle || `Novela #${novelId}`);
      const escapedAuthor = escapeTelegramHTML(cleanAuthor);
      const escapedEmail = cleanEmail ? ` (<code>${escapeTelegramHTML(cleanEmail)}</code>)` : " <i>(Sin correo)</i>";
      const replyNotice = validParentId ? `\n↪️ <i>En respuesta al comentario #${validParentId}</i>` : "";
      const escapedContent = escapeTelegramHTML(cleanContent);

      const messageText =
        `${envTag}💬 <b>Nuevo comentario en ${escapedNovel}</b>\n\n` +
        `👤 <b>Autor:</b> ${escapedAuthor}${staffBadgeTag}${escapedEmail}${replyNotice}\n\n` +
        `📝 <b>Comentario:</b>\n${escapedContent}`;

      const inlineKeyboard = [
        [
          { text: "🔗 Ver en la web", url: commentUrl }
        ]
      ];

      if (modSecret) {
        const deleteUrl = `${host}/api/comments/delete?id=${newId}&token=${encodeURIComponent(modSecret)}`;
        inlineKeyboard[0].push({ text: "🗑️ Eliminar", url: deleteUrl });
      }

      const tgPayload = {
        chat_id: tgChatId,
        text: messageText,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: inlineKeyboard }
      };

      const sendTelegram = fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tgPayload)
      }).catch((e) => console.warn("Error enviando alerta a Telegram:", e));

      context.waitUntil(sendTelegram);
    }

    // 5. Notificación por correo vía Resend al autor del comentario padre
    const resendApiKey = context.env.RESEND_API_KEY;
    if (validParentId && resendApiKey) {
      const sendEmailPromise = (async () => {
        try {
          const parentRow = await db
            .prepare("SELECT author_name, author_email FROM comments WHERE id = ?")
            .bind(validParentId)
            .first();

          if (parentRow && parentRow.author_email) {
            const fromEmail = context.env.RESEND_FROM_EMAIL || "Kasnia Project <onboarding@resend.dev>";
            const novelName = novelTitle || "la novela";

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [parentRow.author_email],
                subject: `💬 ${cleanAuthor} respondió a tu comentario en ${novelName}`,
                html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva respuesta en Kasnia Project</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #0d0e12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background-color: #181a22; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Encabezado de Marca Kasnia -->
          <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="color: #ff9ac5; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 4px 0;">Kasnia Project</div>
            <div style="color: #8e95a5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Novelas Ligeras en Español</div>
          </div>

          <!-- Mensaje Principal -->
          <p style="font-size: 16px; line-height: 1.6; color: #f1f5f9; margin: 0 0 12px 0;">
            Hola <strong style="color: #ffffff;">${escapeTelegramHTML(parentRow.author_name)}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
            <strong style="color: #ffffff;">${escapeTelegramHTML(cleanAuthor)}</strong> ha respondido a tu comentario en <strong style="color: #ff9ac5;">${escapeTelegramHTML(novelName)}</strong>:
          </p>

          <!-- Bloque de Cita del Comentario (Superficie Secundaria Kasnia + Borde Rosa Kasnia) -->
          <div style="background-color: #13151b; border-left: 4px solid #ff9ac5; border-radius: 8px; padding: 16px 20px; margin: 0 0 28px 0; font-size: 14.5px; color: #f1f5f9; line-height: 1.65; word-break: break-word;">
            ${formatEmailCommentText(cleanContent)}
          </div>

          <!-- Botón de Acción CTA (Rosa Kasnia #ff9ac5 con texto oscuro #12070c) -->
          <div style="text-align: left; margin: 0 0 32px 0;">
            <a href="${commentUrl}" style="display: inline-block; background-color: #ff9ac5; color: #12070c; text-decoration: none; padding: 13px 28px; border-radius: 9999px; font-weight: 700; font-size: 14px; letter-spacing: -0.01em;">
              Ver respuesta en la novela &rarr;
            </a>
          </div>

          <!-- Pie del Correo -->
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; font-size: 12px; color: #717888; line-height: 1.6;">
            Recibes esta notificación porque participaste en la conversación de esta novela en <a href="https://kasniaproject.com" style="color: #ff9ac5; text-decoration: none; font-weight: 500;">Kasnia Project</a>.
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
                `
              })
            });
          }
        } catch (err) {
          console.warn("Error enviando email vía Resend:", err);
        }
      })();

      context.waitUntil(sendEmailPromise);
    }

    return jsonResponse({ success: true, comment: newComment }, 201);
  } catch (err) {
    return jsonResponse({ error: `Error en D1: ${err.message}` }, 500);
  }
}

function getScopedNovelId(request, rawNovelId) {
  const url = new URL(request.url);
  const isProduction = url.hostname === "kasniaproject.com";
  return isProduction ? rawNovelId : `dev_${rawNovelId}`;
}

function escapeTelegramHTML(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatEmailCommentText(rawText) {
  if (!rawText) return "";
  let safe = escapeTelegramHTML(rawText);
  // Ocultar spoilers en el correo para no arruinar la lectura
  safe = safe.replace(/\|\|([\s\S]+?)\|\|/g, '<span style="background-color: #232736; color: #ff9ac5; border-radius: 4px; padding: 2px 6px; font-size: 13px; font-style: italic;">[Spoiler oculto]</span>');
  // Negrita
  safe = safe.replace(/\*\*([^*\n]+?)\*\*/g, '<strong style="color: #ffffff;">$1</strong>');
  // Cursiva
  safe = safe.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  // Saltos de línea para clientes de correo
  safe = safe.replace(/\r?\n/g, '<br>');
  return safe;
}
