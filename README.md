# FAROFX — motor del sitio (v0.1)

Reseñas verificadas y ranking de brokers de forex/CFD. Mismo motor y filosofía que Pulso Mercados: **plantillas + contenido** con un **generador estático ligero** en Node (sin dependencias), listo para **Cloudflare Pages**.

## Para Jose (en 3 frases)
1. Los **datos** de los brokers viven en `knowledge-base/brokers.json` (la "fuente de verdad").
2. El programa `build.mjs` **lee esos datos, calcula el ranking y genera toda la web** en la carpeta `dist/`.
3. Nadie escribe páginas a mano: cambias un dato → vuelves a construir → la web se actualiza sola.

## Cómo verlo en tu ordenador
```bash
node build.mjs        # construye la web en dist/
npx serve dist        # la abre en http://localhost:3000
```
(Si no tienes Node instalado, no te preocupes: yo me encargo del despliegue en la nube.)

## Qué genera (21 páginas de ejemplo)
- **Home / ranking** (`/`) — tabla de ranking con medallas al top-3, filtros, buscador y modales.
- **Fichas de reseña** (`/brokers/[slug]/`) — la página estrella, con respuesta directa, caja de dato clave, "¿es scam?", regulación, costes, veredicto con desglose auditable, opiniones y FAQ.
- **Roundup** (`/mejores-brokers-forex/`), **hubs de regulador** (`/regulados/cysec/`…), **autores** (`/autores/`), **metodología**, **cómo verificamos**, **legales**.
- **`sitemap.xml`, `robots.txt`, `llms.txt`** en la raíz, y **schema (JSON-LD)** por tipo de página.

## Estructura
```
farofx/
├─ build.mjs                 ← el generador (motor)
├─ knowledge-base/           ← FUENTE DE VERDAD (lo que se edita)
│  ├─ brokers.json           ← datos objetivos de cada broker
│  ├─ authors.json           ← firmas E-E-A-T (pendientes de datos reales)
│  └─ metodologia-ranking.md ← pesos y reglas del score
├─ src/
│  ├─ theme.css              ← sistema visual extraído de tu HTML
│  ├─ home.js                ← interactividad del ranking (cliente)
│  └─ templates/             ← plantillas por tipo de página
└─ dist/                     ← salida generada (lo que se publica)
```

## Score / ranking
`score = 0,35·regulación + 0,25·retirada + 0,25·quejas + 0,15·costes` (ver `knowledge-base/metodologia-ranking.md`). La posición sale **solo de la evidencia**; la afiliación no altera la nota.

## Despliegue (Cloudflare Pages)
- Build command: `node build.mjs`
- Output directory: `dist`
- Variable de entorno: `SITE_URL = https://tudominio.com`

## ⚠️ Importante
Los brokers y las cifras actuales son **datos de demostración** (marcados como DEMO) para validar motor y diseño. **No se publica contenido real** hasta cerrar reglas (Fase 5) y aprobar la prueba de 3 reseñas (Fase 6).
