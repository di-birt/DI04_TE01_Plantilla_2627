// *****************************************************************************
// SERVIDOR DE INFORMES — Express + Puppeteer (TypeScript)
//
// Esta es la versión TypeScript del servidor.
// npm start ejecuta este archivo mediante tsx.
// *****************************************************************************
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import puppeteer from 'puppeteer';

// Define únicamente los datos que esta ruta acepta en el cuerpo JSON. El HTML
// llega generado desde Angular e incluye los estilos, tablas y gráficas que se
// quieren imprimir; el servidor no tiene que conocer su estructura interna.
interface InformeRequestBody {
  html?: string;
}

// Express recibe las peticiones HTTP y registra las rutas disponibles en esta
// aplicación. Todas las configuraciones que se añaden con `app.use` se aplican
// antes de que la petición llegue a la ruta `/api/informe`.
const app = express();

// Convierte cuerpos JSON en objetos JavaScript accesibles mediante `req.body`.
// Los informes con varias gráficas en base64 pueden pesar varios MB, por lo que
// se aumenta el límite predeterminado para evitar que Express rechace informes
// válidos por ser demasiado grandes.
app.use(express.json({ limit: '25mb' }));

// Permite que la aplicación Ionic, ejecutándose normalmente en otro puerto
// durante el desarrollo, pueda llamar a este servidor. Sin CORS el navegador
// bloquearía esa petición por pertenecer a un origen distinto.
app.use(cors());

// Inicia Chromium una sola vez y conserva la promesa de inicio. Abrir un
// navegador completo para cada informe es costoso; en cambio, cada petición
// crea una pestaña propia dentro de esta misma instancia y la cierra al acabar.
// `headless: true` indica que Chromium se ejecuta sin ventana visible. Los dos
// argumentos permiten usar Puppeteer en entornos donde no existe sandbox, como
// algunos contenedores o servidores de despliegue.
const browserPromise = puppeteer.launch({
  // TODO DONE - Configurar Puppeteer para iniciar Chromium sin interfaz y con los
  // argumentos necesarios para el entorno de ejecución.
  headless: true,
});

// Recibe el documento HTML enviado por la aplicación y responde con un PDF.
// Los genéricos de `Request` indican a TypeScript que el cuerpo tiene la forma
// de `InformeRequestBody`; así `req.body.html` queda tipado como opcional.
// TODO - Añadir ruta de la api
app.post('', async (req: Request<unknown, unknown, InformeRequestBody>, res: Response) => {
  
  //Es equivalante a -> const html = req.body.html
  const { html } = req.body;

  // TODO DONE - Validar el cuerpo recibido y devolver HTTP 400 si no contiene html.
  // No se puede construir un informe sin contenido. Se responde con 400 porque
  // el error está en los datos enviados por el cliente, no en el servidor.
  if (!html) {
    return res.status(400).json({ error: 'Falta el campo "html" en el cuerpo de la petición.' });
  }

  // Se declara fuera del bloque `try` para poder cerrarla también en `finally`.
  // El tipo se obtiene desde Puppeteer, evitando importar y mantener otro tipo
  // separado para una página del navegador.
  // browserPromise: Promesa que finalmente devuelve el navegador Chromium
  // ['newPage']: obtiene el tipo del método newPage
  // ReturnType<...>: Obtiene el tipo que devuelve newPage, que es una promesa de página
  // Awaited<...>: Es un tipo de TypeScript que espera el resultado de una Promise y obtiene el tipo del valor que habrá dentro. Es decir,
  // obtiene finalmente el tipo real de la página.
  let page: Awaited<ReturnType<Awaited<typeof browserPromise>['newPage']>> | undefined;

  try {
    // TODO DONE - Esperar al navegador compartido, crear una página y cargar el HTML.
    // Espera a que Chromium esté disponible y abre una pestaña aislada para
    // este informe. Varios usuarios pueden generar documentos sin compartir el
    // contenido de sus páginas, aunque reutilicen el mismo proceso Chromium.
    const browser = await browserPromise;
    page = await browser.newPage();

    // Inserta el HTML recibido directamente en la pestaña. El documento ya
    // contiene las tablas, filtros y gráficas en base64 enviados por Angular,
    // así que esperar al evento `load` es suficiente: no depende de descargas
    // adicionales de imágenes, hojas de estilo u otros recursos externos.
    await page.setContent(html, { waitUntil: 'load' });

    // Convierte el contenido de la pestaña en PDF. El tamaño A4, los márgenes
    // y la impresión de fondos forman parte de la presentación final, no del
    // HTML que llega desde la aplicación.
    const pdfData = await page.pdf({
      // TODO - Configurar formato A4, fondos, márgenes, cabecera, pie y
      // numeración de páginas para el documento final.
      format: 'A4',
      printBackground: true,
      //TODO - Añadir displayHeaderFooter: true
      
      //TODO - Podéis modificar y probar con diferentes márgenes 
      margin: { top: '28mm', bottom: '22mm', left: '12mm', right: '12mm' },
      // Los márgenes superior e inferior reservan espacio para estas plantillas
      // de impresión, que Chromium repite automáticamente en cada página. No
      // heredan el CSS del HTML principal, por eso los estilos son inline.
      // `displayHeaderFooter` debe ser `true` para que se muestren.
      // TODO - Crear DIV's con style's para añadir un título y un footer
      headerTemplate: `
        
      `,
      footerTemplate: `
        
      `,
    });

    // Puppeteer devuelve los bytes del PDF como Uint8Array. Se convierten a
    // Buffer y se declara el tipo MIME adecuado para que el cliente lo trate
    // como un archivo PDF, no como una respuesta JSON.
    res.type('application/pdf').send(Buffer.from(pdfData));
  } catch (error: unknown) {
    // TODO DONE - Registrar el error sin exponer detalles internos al cliente.
    // Registra el detalle técnico en el servidor, pero devuelve al cliente un
    // mensaje controlado. Así no se exponen trazas ni datos internos de Node.
    console.error('Error generando el PDF:', error);
    res.status(500).json({ error: 'No se pudo generar el informe.' });
  } finally {
    // TODO DONE - Cerrar la pestaña siempre, incluso si falla la generación del PDF.
    // La pestaña se cierra tanto si se genera el PDF como si ocurre un error.
    // Esto libera memoria y recursos sin cerrar el navegador compartido.
    await page?.close();
  }
});

// Permite configurar el puerto mediante la variable de entorno `PORT`; cuando
// no existe, el servidor usa 3000 para que la aplicación sepa dónde conectarse.
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Servidor de informes escuchando en http://localhost:${port}`);
});

// Al detener el proceso con Ctrl+C, cierra Chromium antes de finalizar Node.
// De este modo no queda un proceso de navegador abierto tras parar el servidor.
process.on('SIGINT', async () => {
  // TODO DONE - Cerrar Chromium correctamente antes de terminar el proceso.
  const browser = await browserPromise;
  await browser.close();
  process.exit(0);
});