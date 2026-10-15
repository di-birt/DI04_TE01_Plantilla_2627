// *****************************************************************************
// InformeHtmlService — prepara el documento independiente que imprimirá
// Puppeteer. Se mantiene separado de InformeService para que la comunicación
// HTTP y la plantilla del informe tengan responsabilidades distintas.
//
// Este servicio no muestra el HTML en una pantalla Angular. Devuelve un string
// con un documento completo porque el backend recibirá ese string y lo cargará
// en una página de Chromium antes de convertirlo en PDF.
// *****************************************************************************
import { Injectable } from '@angular/core';
import { Restaurante } from '../interface/restaurante';

// Estos datos describen los filtros que se mostrarán en la cabecera del PDF.
// La interfaz solo existe durante la comprobación de TypeScript: al ejecutar
// la aplicación no se crea ningún objeto adicional por haberla declarado.
export interface FiltrosInforme {
  busqueda: string;
  territorios: string[];
  localidades: string[];
}

@Injectable({ providedIn: 'root' })
export class InformeHtmlService {
  // El HTML incluye sus propios estilos porque Puppeteer no puede reutilizar
  // directamente los estilos SCSS encapsulados de Angular/Ionic. El método es
  // público porque InformeService lo utiliza como paso de su flujo de exportación.
  construirHTML(
    restaurantes: Restaurante[],
    imagenes: Record<string, string>,
    filtros: FiltrosInforme
  ): string {
    // TODO - Construir un documento HTML autónomo que pueda cargar Puppeteer.
    // Cada restaurante se convierte en una fila de la tabla. El operador ?? ''
    // evita escribir "null" o "undefined" si un campo no tiene valor.
    // Aquí dibujaríamos el tr de cada restaurante, luego la mostraremos en el return
    const filas = restaurantes.map(r => `
      
    `).join('');

    // TODO - Definir los títulos y recorrer las imágenes Base64 para crear las
    // figuras que se mostrarán en la sección de gráficos.
    // Las claves coinciden con las imágenes generadas por Chart.js. Mantener
    // este contrato permite añadir gráficos sin pasar títulos por separado.
    // Los nombres coinciden con los nombres que hemos puesto en la variable configuraciones
    // del método obtenerImagenes, de esta manera sabemos qué título poner a cada gráfica
    const titulosGraficos: Record<string, string> = {
      //Título para bar chart vertical
      
      //Título para line chart
      
      //Título para bar chart horizontal
      
      //Título para doughnut chart
      
    };
    // TODO DONE 
    // Object.entries() recorre el mapa de imágenes y genera una figura por
    // cada gráfico, usando la cadena Base64 directamente como src.
    const graficos = Object.entries(imagenes)
      .map(([clave, src]) => `
        <figure class="grafico">
          <img src="${src}" alt="${titulosGraficos[clave] ?? 'Gráfica del informe'}" />
          <figcaption>${titulosGraficos[clave] ?? 'Gráfica del informe'}</figcaption>
        </figure>
      `)
      .join('');

    // TODO -
    // Solo se muestran los filtros que tienen contenido; si no hay ninguno,
    // el PDF indica expresamente que contiene todos los restaurantes. El type
    // predicate del filter permite que TypeScript trate el resultado como
    // string[] y no como una mezcla de string y valores falsy.
    // Primero creamos un array con lo filtros aplicados para después crear resumenFiltros.
    const filtrosAplicados = [];
    const resumenFiltros = null;
    // TODO - Completar los estilos de impresión, portada, filtros, tabla y
    // sección de gráficos del documento PDF.
    // La plantilla es un template literal para poder insertar datos dinámicos
    // sin construir el documento mediante concatenaciones independientes.
    // El CSS se incluye aquí porque este HTML se renderizará fuera de Angular.
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          <!-- TODO - Añadir clases para darle estilo a nuestro pdf --> 
        </style>
      </head>
      <body>
      <!-- TODO - Añadir el contenido del PDF
        -- Añadir texto: Guía Euskadi · Generado el XX/XX/XXXX · XX restaurantes
        -- resumenFiltros
        -- filas
        -- graficos
        -->
        
      </body>
      </html>
    `;
  }
}