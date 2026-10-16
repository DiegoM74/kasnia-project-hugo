const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "img";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error(
    "\x1b[31m❌ Error: Faltan variables de entorno para R2 (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).\x1b[0m"
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function padTwo(val) {
  return String(val || "").padStart(2, "0");
}

async function uploadToR2(key, buffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  await s3.send(command);
}

async function getRawFromR2(key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await s3.send(command);
  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

async function processSingleVolume(novelId, volNum, isCover) {
  const nid = padTwo(novelId);
  const vnum = padTwo(volNum);
  const rawKey = `raw/${nid}/v${vnum}.jpg`;

  console.log(`\n\x1b[36m🚀 Procesando Novela ID: \x1b[33m${nid}\x1b[36m, Volumen: \x1b[33m${vnum}\x1b[36m (Cover: ${isCover})\x1b[0m`);
  console.log(`  \x1b[34m•\x1b[0m Descargando original desde R2: \x1b[90m${rawKey}\x1b[0m...`);

  let rawBuffer;
  try {
    rawBuffer = await getRawFromR2(rawKey);
  } catch (err) {
    throw new Error(`No se pudo obtener el archivo ${rawKey} desde el bucket ${bucketName}: ${err.message}`);
  }

  const metadata = await sharp(rawBuffer).metadata();
  console.log(`  \x1b[32m✔\x1b[0m Imagen original: ${metadata.width}x${metadata.height}px (${(rawBuffer.length / 1024).toFixed(1)} KB)`);

  // --- 1. Procesar Variantes de Volumen (400w y 700w) ---
  const volSizes = [400, 700];
  console.log(`  \x1b[34m•\x1b[0m Generando variantes de volumen (AVIF q40/e5 + JPG q70/mozjpeg)...`);

  for (const size of volSizes) {
    if (metadata.width && size > metadata.width) continue;

    const resized = sharp(rawBuffer).resize({
      width: size,
      withoutEnlargement: true,
    });

    // AVIF
    const avifBuffer = await resized
      .clone()
      .avif({
        quality: 40,
        effort: 5,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer();

    const avifKey = `vols/${nid}/avif/v${vnum}-${size}.avif`;
    await uploadToR2(avifKey, avifBuffer, "image/avif");
    console.log(`    \x1b[32m✔\x1b[0m Subido: \x1b[90m${avifKey}\x1b[0m (${(avifBuffer.length / 1024).toFixed(1)} KB)`);

    // JPG
    const jpgBuffer = await resized
      .clone()
      .jpeg({
        quality: 70,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: "4:2:0",
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true,
      })
      .toBuffer();

    const jpgKey = `vols/${nid}/jpg/v${vnum}-${size}.jpg`;
    await uploadToR2(jpgKey, jpgBuffer, "image/jpeg");
    console.log(`    \x1b[32m✔\x1b[0m Subido: \x1b[90m${jpgKey}\x1b[0m (${(jpgBuffer.length / 1024).toFixed(1)} KB)`);
  }

  // --- 2. Si es portada principal, procesar Cover (400w, 700w y 900w) ---
  if (isCover) {
    console.log(`  \x1b[34m•\x1b[0m Generando portada principal de la novela (400w, 700w, 900w)...`);
    const coverSizes = [400, 700, 900];

    for (const size of coverSizes) {
      if (metadata.width && size > metadata.width) continue;

      const resized = sharp(rawBuffer).resize({
        width: size,
        withoutEnlargement: true,
      });

      // AVIF
      const avifBuffer = await resized
        .clone()
        .avif({
          quality: 40,
          effort: 5,
          chromaSubsampling: "4:2:0",
        })
        .toBuffer();

      const avifKey = `cover/avif/${nid}-${size}.avif`;
      await uploadToR2(avifKey, avifBuffer, "image/avif");
      console.log(`    \x1b[32m✔\x1b[0m Subido Cover: \x1b[90m${avifKey}\x1b[0m (${(avifBuffer.length / 1024).toFixed(1)} KB)`);

      // JPG
      const jpgBuffer = await resized
        .clone()
        .jpeg({
          quality: 70,
          mozjpeg: true,
          progressive: true,
          chromaSubsampling: "4:2:0",
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: true,
        })
        .toBuffer();

      const jpgKey = `cover/jpg/${nid}-${size}.jpg`;
      await uploadToR2(jpgKey, jpgBuffer, "image/jpeg");
      console.log(`    \x1b[32m✔\x1b[0m Subido Cover: \x1b[90m${jpgKey}\x1b[0m (${(jpgBuffer.length / 1024).toFixed(1)} KB)`);
    }
  }

  console.log(`\x1b[32m✅ Procesamiento de novela ${nid} volumen ${vnum} completado exitosamente.\x1b[0m`);
}

async function listRawObjects(prefix = "raw/") {
  let isTruncated = true;
  let continuationToken = undefined;
  const rawKeys = [];

  while (isTruncated) {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const listRes = await s3.send(listCmd);
    const objects = listRes.Contents || [];

    for (const obj of objects) {
      if (obj.Key && obj.Key.endsWith(".jpg")) {
        rawKeys.push(obj.Key);
      }
    }

    isTruncated = Boolean(listRes.IsTruncated);
    continuationToken = listRes.NextContinuationToken;
  }

  return rawKeys;
}

async function processNovelVolumes(targetNovelId) {
  const nid = padTwo(targetNovelId);
  const prefix = `raw/${nid}/`;
  console.log(`\x1b[36m🚀 Buscando imágenes para la novela ${nid} en R2 ('${prefix}')...\x1b[0m`);

  const keys = await listRawObjects(prefix);
  if (keys.length === 0) {
    console.log(`  \x1b[33mNo se encontraron imágenes en ${prefix}\x1b[0m`);
    return;
  }

  // Extraer volúmenes y ordenar
  const volNums = [];
  for (const key of keys) {
    const match = key.match(/^raw\/\d+\/v(\d+)\.jpg$/i);
    if (match) volNums.push(match[1]);
  }

  volNums.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const minVol = volNums[0];

  console.log(`Se encontraron ${volNums.length} volúmenes (portada detectada: v${minVol}).\n`);

  for (const vnum of volNums) {
    const isCover = vnum === minVol;
    try {
      await processSingleVolume(nid, vnum, isCover);
    } catch (err) {
      console.error(`\x1b[31m❌ Error procesando novela ${nid} volumen ${vnum}:\x1b[0m`, err.message);
    }
  }
}

async function processAllRawImages() {
  console.log(`\x1b[36m🚀 Buscando todas las imágenes en el prefijo 'raw/' de R2...\x1b[0m`);
  const rawKeys = await listRawObjects("raw/");
  console.log(`Se encontraron ${rawKeys.length} imágenes raw en total.\n`);

  // Agrupar por novela
  const novelMap = new Map();
  for (const key of rawKeys) {
    const match = key.match(/^raw\/(\d+)\/v(\d+)\.jpg$/i);
    if (!match) continue;

    const nid = match[1];
    const vnum = match[2];
    if (!novelMap.has(nid)) {
      novelMap.set(nid, []);
    }
    novelMap.get(nid).push(vnum);
  }

  // Ordenar novelas
  const sortedNovelIds = Array.from(novelMap.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  for (const nid of sortedNovelIds) {
    const vols = novelMap.get(nid);
    vols.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const minVol = vols[0];

    console.log(`\n\x1b[1m=== Novela ID: ${nid} (${vols.length} volúmenes, portada: v${minVol}) ===\x1b[0m`);
    for (const vnum of vols) {
      const isCover = vnum === minVol;
      try {
        await processSingleVolume(nid, vnum, isCover);
      } catch (err) {
        console.error(`\x1b[31m❌ Error procesando novela ${nid} volumen ${vnum}:\x1b[0m`, err.message);
      }
    }
  }
}

async function main() {
  const inputNovelId = (process.env.INPUT_NOVEL_ID || "").trim();
  const inputVolNum = (process.env.INPUT_VOL_NUM || "").trim();
  const isCover = (process.env.INPUT_IS_COVER || "").toLowerCase() === "true";
  const forceAll = (process.env.INPUT_FORCE_ALL || "").toLowerCase() === "true" || process.argv.includes("--force-all");

  if (inputNovelId && inputVolNum) {
    // Procesar un único volumen específico
    await processSingleVolume(inputNovelId, inputVolNum, isCover);
  } else if (inputNovelId && !inputVolNum) {
    // Procesar todos los volúmenes de una novela en particular
    await processNovelVolumes(inputNovelId);
  } else if (forceAll) {
    // Procesar el bucket completo
    await processAllRawImages();
  } else {
    console.error(
      "❌ Argumentos insuficientes: debes especificar INPUT_NOVEL_ID (y opcionalmente INPUT_VOL_NUM) o activar INPUT_FORCE_ALL=true"
    );
    process.exit(1);
  }
}


main().catch((err) => {
  console.error("\x1b[31m❌ Error fatal:\x1b[0m", err);
  process.exit(1);
});
