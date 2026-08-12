const fs = require('fs');
const path = require('path');
const https = require('https');

const CONTENT_DIR = path.join(__dirname, '../content/novelas');
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'ranking.json');

const CLOUDFLARE_API = 'api.cloudflare.com';
const API_TOKEN = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN || !ACCOUNT_ID) {
  console.error('Faltan credenciales de Cloudflare (CLOUDFLARE_ANALYTICS_TOKEN, CLOUDFLARE_ACCOUNT_ID)');
  process.exit(1);
}

// 1. Obtener la lista de novelas reales
function getValidNovels() {
  const novels = {};
  const files = fs.readdirSync(CONTENT_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.md') || file === '_index.md') continue;
    
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    
    const linkMatch = content.match(/^link:\s*"?([^"\r\n]+)"?/m);
    const idMatch = content.match(/^novelId:\s*"?([^"\r\n]+)"?/m);
    const titleMatch = content.match(/^novelTitle:\s*"?([^"\r\n]+)"?/m);
    
    if (linkMatch && idMatch) {
      const link = linkMatch[1];
      const novelId = idMatch[1];
      const novelTitle = titleMatch ? titleMatch[1] : link;
      
      // Mapear por path esperado en Cloudflare. 
      // Hugo genera rutas con y sin trailing slash, usualmente detectadas con trailing slash
      novels[`/novelas/${link}/`] = { novelId, novelTitle };
      novels[`/novelas/${link}`] = { novelId, novelTitle };
    }
  }
  return novels;
}

// 2. Ejecutar consulta GraphQL
function fetchCloudflareData(query, variables) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    
    const options = {
      hostname: CLOUDFLARE_API,
      path: '/client/v4/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 3. Procesar datos de un periodo
function processPeriod(periodData, validNovels) {
  let totalVisits = 0;
  const novelVisits = {};
  
  // Agrupar visitas por novelId (sumando si hay con y sin trailing slash)
  if (periodData && periodData.length > 0) {
    for (const item of periodData) {
      const p = item.dimensions.requestPath || item.dimensions.metric;
      if (validNovels[p]) {
        const novelId = validNovels[p].novelId;
        const visits = item.sum.visits;
        novelVisits[novelId] = (novelVisits[novelId] || 0) + visits;
        totalVisits += visits;
      }
    }
  }
  
  const result = [];
  
  // Extraer todos los IDs únicos de validNovels para incluirlos incluso si tienen 0 visitas
  const uniqueNovelIds = new Set(Object.values(validNovels).map(n => n.novelId));
  
  for (const novelId of uniqueNovelIds) {
    const visits = novelVisits[novelId] || 0;
    const percentage = totalVisits > 0 ? (visits / totalVisits) * 100 : 0;
    
    // Obtener título para desempate
    const novelTitle = Object.values(validNovels).find(n => n.novelId === novelId).novelTitle;
    
    result.push({
      novelId,
      percentage: Number(percentage.toFixed(1)),
      _title: novelTitle
    });
  }
  
  // Ordenar: Mayor porcentaje primero, luego por título alfabético
  result.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return a._title.localeCompare(b._title);
  });
  
  // Quitar _title de la salida final
  return result.map(({ _title, ...rest }) => rest);
}

async function main() {
  console.log('Iniciando actualización de ranking...');
  const validNovels = getValidNovels();
  console.log(`Encontradas ${new Set(Object.values(validNovels).map(n => n.novelId)).size} novelas válidas.`);
  
  const end = new Date();
  const start7 = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start21 = new Date(end.getTime() - 21 * 24 * 60 * 60 * 1000);
  const start30 = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const query = `
    query GetRanking($accountTag: string!, $start7: string!, $start21: string!, $start30: string!, $end: string!) {
      viewer {
        accounts(filter: {accountTag: $accountTag}) {
          days7: rumPageloadEventsAdaptiveGroups(
            filter: { datetime_geq: $start7, datetime_leq: $end },
            limit: 1000,
            orderBy: [sum_visits_DESC]
          ) {
            dimensions { requestPath }
            sum { visits }
          }
          days21: rumPageloadEventsAdaptiveGroups(
            filter: { datetime_geq: $start21, datetime_leq: $end },
            limit: 1000,
            orderBy: [sum_visits_DESC]
          ) {
            dimensions { requestPath }
            sum { visits }
          }
          days30: rumPageloadEventsAdaptiveGroups(
            filter: { datetime_geq: $start30, datetime_leq: $end },
            limit: 1000,
            orderBy: [sum_visits_DESC]
          ) {
            dimensions { requestPath }
            sum { visits }
          }
        }
      }
    }
  `;
  
  const variables = {
    accountTag: ACCOUNT_ID,
    start7: start7.toISOString(),
    start21: start21.toISOString(),
    start30: start30.toISOString(),
    end: end.toISOString()
  };
  
  try {
    const data = await fetchCloudflareData(query, variables);
    
    if (data.errors) {
      console.error('Errores en la respuesta de GraphQL:', JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }
    
    const accountData = data.data.viewer.accounts[0];
    
    if (!accountData) {
      console.error('No se devolvió información para la cuenta. Revisa el Account ID.');
      process.exit(1);
    }
    
    const periods = {
      days7: processPeriod(accountData.days7, validNovels),
      days21: processPeriod(accountData.days21, validNovels),
      days30: processPeriod(accountData.days30, validNovels)
    };
    
    const rankingData = {
      updatedAt: new Date().toISOString(), // UTC timezone
      periods
    };
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(rankingData, null, 2));
    console.log(`Ranking generado exitosamente en ${DATA_FILE}`);
    
  } catch (error) {
    console.error('Error obteniendo datos de Cloudflare:', error);
    process.exit(1);
  }
}

main();
