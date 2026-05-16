const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const imagesDir = __dirname;
const staticImgDir = path.join(__dirname, "..", "static", "img");

const coverAvifDir = path.join(staticImgDir, "cover", "avif");
const coverJpgDir = path.join(staticImgDir, "cover", "jpg");
fs.mkdirSync(coverAvifDir, { recursive: true });
fs.mkdirSync(coverJpgDir, { recursive: true });

// Límite de concurrencia para no saturar memoria/CPU
const CONCURRENCY = 4;

// Forzar procesamiento incluso si los archivos ya existen
const FORCE = process.argv.includes("--force") || false;

/**
 * Verifica si los archivos de destino ya existen y son más recientes que el origen.
 */
function shouldSkip(sourcePath, targetPaths) {
  if (!fs.existsSync(sourcePath)) return false;
  const sourceStat = fs.statSync(sourcePath);

  for (const targetPath of targetPaths) {
    if (!fs.existsSync(targetPath)) return false;
    const targetStat = fs.statSync(targetPath);
    if (targetStat.mtime < sourceStat.mtime) return false;
  }
  return true;
}

async function processWithConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = task().then((r) => {
      executing.delete(p);
      return r;
    });
    executing.add(p);
    results.push(p);
    if (executing.size >= limit) await Promise.race(executing);
  }
  return Promise.all(results);
}

async function processImages() {
  const folders = fs
    .readdirSync(imagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name !== "node_modules")
    .map((dirent) => dirent.name);

  const totalFolders = folders.length;
  console.log(
    `\x1b[36m🚀 Iniciando procesamiento de ${totalFolders} carpetas...\x1b[0m\n`,
  );

  for (let i = 0; i < totalFolders; i++) {
    const id = folders[i];
    const folderLabel = `\x1b[1m[${i + 1}/${totalFolders}]\x1b[0m Carpeta: \x1b[33m${id}\x1b[0m`;

    try {
      const novelDir = path.join(imagesDir, id);
      const files = fs
        .readdirSync(novelDir)
        .filter((f) => f.startsWith("v") && f.endsWith(".jpg"));

      if (files.length === 0) {
        console.log(
          `${folderLabel} -> \x1b[90mSin imágenes para procesar.\x1b[0m`,
        );
        continue;
      }

      console.log(folderLabel);

      const vols = files.map((f) => {
        const numStr = f.replace("v", "").replace(".jpg", "");
        return { file: f, numStr, num: parseInt(numStr, 10) };
      });
      vols.sort((a, b) => a.num - b.num);

      // --- Procesar Cover ---
      const coverVol = vols[0];
      const coverPath = path.join(novelDir, coverVol.file);
      const coverSizes = [400, 700, 900];

      const targetCoverFiles = coverSizes.flatMap((size) => [
        path.join(coverAvifDir, `${id}-${size}.avif`),
        path.join(coverJpgDir, `${id}-${size}.jpg`),
      ]);

      if (!FORCE && shouldSkip(coverPath, targetCoverFiles)) {
        console.log(`  \x1b[32m✔\x1b[0m Cover: Ya actualizado.`);
      } else {
        process.stdout.write(`  \x1b[34m•\x1b[0m Cover: Procesando... `);
        const coverMeta = await sharp(coverPath).metadata();
        const coverTasks = coverSizes.flatMap((size) => {
          if (coverMeta.width && size > coverMeta.width) return [];
          const resized = sharp(coverPath).resize({
            width: size,
            withoutEnlargement: true,
          });

          return [
            () =>
              resized
                .clone()
                .avif({
                  quality: 40,
                  effort: 9,
                  chromaSubsampling: "4:2:0",
                })
                .toFile(path.join(coverAvifDir, `${id}-${size}.avif`)),
            () =>
              resized
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
                .toFile(path.join(coverJpgDir, `${id}-${size}.jpg`)),
          ];
        });
        await processWithConcurrency(coverTasks, CONCURRENCY);
        console.log(`\x1b[32mListo\x1b[0m`);
      }

      // --- Procesar Volúmenes ---
      const volAvifDir = path.join(staticImgDir, "vols", id, "avif");
      const volJpgDir = path.join(staticImgDir, "vols", id, "jpg");
      fs.mkdirSync(volAvifDir, { recursive: true });
      fs.mkdirSync(volJpgDir, { recursive: true });

      const volSizes = [400, 700];
      const totalVols = vols.length;
      let skippedVols = 0;

      for (let j = 0; j < totalVols; j++) {
        const vol = vols[j];
        const volPath = path.join(novelDir, vol.file);
        const targetVolFiles = volSizes.flatMap((size) => [
          path.join(volAvifDir, `v${vol.numStr}-${size}.avif`),
          path.join(volJpgDir, `v${vol.numStr}-${size}.jpg`),
        ]);

        if (!FORCE && shouldSkip(volPath, targetVolFiles)) {
          skippedVols++;
          continue;
        }

        console.log(
          `  \x1b[34m•\x1b[0m [${j + 1}/${totalVols}] Vol ${vol.numStr}: Procesando...`,
        );
        const volMeta = await sharp(volPath).metadata();
        const currentVolTasks = [];

        for (const size of volSizes) {
          if (volMeta.width && size > volMeta.width) continue;
          const resized = sharp(volPath).resize({
            width: size,
            withoutEnlargement: true,
          });

          currentVolTasks.push(
            () =>
              resized
                .clone()
                .avif({
                  quality: 40,
                  effort: 9,
                  chromaSubsampling: "4:2:0",
                })
                .toFile(path.join(volAvifDir, `v${vol.numStr}-${size}.avif`)),
            () =>
              resized
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
                .toFile(path.join(volJpgDir, `v${vol.numStr}-${size}.jpg`)),
          );
        }
        await processWithConcurrency(currentVolTasks, CONCURRENCY);
      }

      if (skippedVols === totalVols) {
        console.log(`  \x1b[32m✔\x1b[0m Volúmenes: Todos actualizados.`);
      } else if (skippedVols > 0) {
        console.log(
          `  \x1b[32m✔\x1b[0m Resto de volúmenes actualizados (${skippedVols} omitidos).`,
        );
      }
    } catch (error) {
      console.error(`  \x1b[31m❌ Error:\x1b[0m ${error.message}`);
    }
    console.log("");
  }

  console.log("\x1b[32m\x1b[1m✅ ¡Procesamiento completado con éxito!\x1b[0m");
}

processImages().catch(console.error);
