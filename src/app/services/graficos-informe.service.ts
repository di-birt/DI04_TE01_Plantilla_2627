// *****************************************************************************
// GraficosInformeService
//
// Este servicio prepara las imágenes que se insertarán en el PDF. Es distinto
// de GraficosComponent porque no depende de una vista visible de Ionic ni de
// un ion-segment concreto: crea gráficos temporales, los convierte a imágenes
// Base64 y libera sus recursos al terminar.
//
// El flujo es el siguiente:
//   1. Recibe los restaurantes que ya ha filtrado HomePage.
//   2. Construye una configuración de Chart.js para cada gráfico.
//   3. Dibuja cada gráfico en un canvas temporal.
//   4. Convierte el canvas en una imagen data:image/png;base64,...
//   5. Devuelve un objeto de imágenes y destruye cada instancia de Chart.
// *****************************************************************************
import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Restaurante } from '../interface/restaurante';

// Chart.js carga los tipos de gráficos y sus elementos de forma modular. Este
// registro debe ejecutarse antes de crear cualquier instancia de Chart; hacerlo
// aquí permite que todas las configuraciones del servicio tengan disponibles
// barras, líneas, leyendas, títulos y gráficos de tipo donut.
Chart.register(...registerables);

@Injectable({ providedIn: 'root' })
export class GraficosInformeService {
  // Paleta compartida por las gráficas de barras y donut. El operador módulo
  // (%) permite reutilizar los colores cuando hay más categorías que colores
  // definidos, evitando que una categoría se quede sin color.
  private readonly colors = ['#3880ff', '#2dd36f', '#eb445a', '#ffc409', '#5260ff', '#0cd1e8', '#f7a34b', '#a855f7', '#10dc60', '#92949c'];

  /**
   * Genera las imágenes solo durante la exportación.
   *
   * El tipo Record<string, string> significa que el resultado es un objeto
   * cuyas claves identifican cada gráfico y cuyos valores son sus imágenes
   * Base64. Por ejemplo: { territorios: 'data:image/png;base64,...' }.
   * Los nombres de las claves deben coincidir con los que espera
   * InformeHtmlService al elegir los títulos del PDF.
   */
  obtenerImagenes(restaurantes: Restaurante[]): Record<string, string> {
    // TODO - Preparar una configuración Chart.js para cada gráfico que se
    // quiera incluir en el PDF y asociarla a una clave identificativa.
    // Cada clave identifica una gráfica y también se utiliza en
    // InformeHtmlService para asignar el título correcto a la imagen dentro
    // del HTML que imprimirá Puppeteer.
    const configuraciones: Record<string, ChartConfiguration> = {
      //Bar chart
      
      //Line chart
      
      //Bar chart
      
      //Doughnut chart
      
    };
    const imagenes: Record<string, string> = {};

    // No añadimos los canvas al DOM porque solo necesitamos su contenido
    // rasterizado (convertir un gráfico en una imagen formada por pixeles). 
    // Les damos un tamaño fijo para que todas las imágenes tengan
    // una resolución previsible en el PDF. Las opciones responsive y animation
    // están desactivadas para que la captura sea inmediata y reproducible.
    for (const [clave, configuracion] of Object.entries(configuraciones)) {
      // TODO DONE - Crear un canvas temporal con un tamaño fijo para que el PDF sea
      // consistente aunque el gráfico no esté visible en la pantalla.
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 500;
      // Chart.js puede trabajar directamente con el elemento canvas creado por
      // el navegador. No es necesario mostrarlo en pantalla al usuario.
      const chart = new Chart(canvas, configuracion);

      try {
        // TODO - Convertir el canvas a una imagen Base64 y guardarla con su clave.
        // toBase64Image() transforma el canvas en una URL de datos PNG. Esa
        // cadena puede viajar dentro del JSON y utilizarse directamente como
        // atributo src de una etiqueta <img> en el HTML del informe.
        
      } finally {
        // TODO DONE - Destruir siempre la instancia Chart para liberar recursos.
        // Es obligatorio liberar la instancia para eliminar listeners y memoria
        // aunque una gráfica concreta falle al exportarse. El bloque finally
        // garantiza la limpieza tanto en caso de éxito como de excepción.
        chart.destroy();
      }
    }

    return imagenes;
  }

  private configuracionTerritorios(data: Restaurante[]): ChartConfiguration<'bar'> {
    // TODO - Agrupar los restaurantes por territorio y crear el gráfico de barras.
    // contar() agrupa y ordena de mayor a menor. Después, cada tupla se separa
    // en etiquetas (territorios) y valores (número de restaurantes), que es la
    // estructura que Chart.js necesita para un gráfico de barras.

    // Hacemos uso del método contar() para agrupar y ordenar de mayor a menor según el parámetro que
    // valores será del tipo [string, number][]. Por ejemplo: [['Araba', 5],['Bizkaia', 10],['Gipuzkoa', 20]]
    const valores = this.contar(data, restaurante => restaurante.territory?.trim() || 'Desconocido');
    return {
      type: 'bar',
      data: {
        // TODO - Para labels, recogeremos solo el primer valor string y haremos uso de un map para crear un objeto como ['Araba', 'Bizkaia', 'Gipuzkoa']
        labels: [],
        datasets: [{
          label: 'Restaurantes',
          // TODO - Para data, recogeremos solo el segundo valor number y haremos uso de un map para crear un objeto como [5, 10, 20]
          data: [],
          backgroundColor: valores.map((_, index) => `${this.colors[index % this.colors.length]}bb`),
          borderColor: valores.map((_, index) => this.colors[index % this.colors.length]),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      },

      // TODO - Para options haremos uso del método opcionesConEjes, para mostrar las barras en eje x o y
      options: {},
    };
  }

  private configuracionDistinciones(data: Restaurante[]): ChartConfiguration<'line'> {
    // TODO - Acumular estrellas Michelin y soles Repsol por territorio para
    // construir el gráfico de líneas.
    // En esta gráfica hay dos valores por territorio. Por eso usamos un Map
    // cuyo valor es un objeto acumulador, en lugar del contador simple de las
    // gráficas anteriores.

    // porTerritorio será algo así ---->  Map {"Bizkaia" => {michelin: 10, respsol 20} }
    const porTerritorio = new Map<string, { michelin: number; repsol: number }>();
    data.forEach(restaurante => {
      const territorio = restaurante.territory?.trim() || 'Desconocido';

      //DONE - Si el territorio existe coge los valores michelin y repsol de ese territorio
      // valores será del tipo ---> valores: { michelin: number; repsol: number; }
      const valores = porTerritorio.get(territorio) ?? { michelin: 0, repsol: 0 };
      // Los datos pueden llegar como texto desde el JSON. Number() los convierte para poder sumarlos y || 0 evita introducir NaN.
      // TODO - Actualizar las estrellas michelin y respol con los valores del restaurante actual
      
      // TODO - Realizar el set en porTerritorio. Mediante set, si existe un elemento con la misma key, se actualiza su valor.

    });

    // Se omiten territorios sin estrellas ni soles para evitar series vacías y
    // conseguir que el gráfico solo muestre categorías con información útil.
    const valores = [...porTerritorio.entries()]
      .filter(([, cantidad]) => cantidad.michelin > 0 || cantidad.repsol > 0)
      .sort(([territorioA], [territorioB]) => territorioA.localeCompare(territorioB));

    // TODO - Crear gráfica de tipo line
    return {
      type: 'line',
      data: {
        // TODO - Para labels, recogeremos solo el primer valor string y haremos uso de un map para crear un objeto como ['Araba', 'Bizkaia', 'Gipuzkoa']
        labels: [],
        // TODO - Necesitamos dos datasets, uno para michelin y otro para repsol
        // Añadir a cada uno un borderColor, backgroundColor, fill, tension y pointRadius
        datasets: [
          //{ },
          //{ },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        /* TODO - En el apartado plugins:
         * ---> añadir una leyenda en la parte de arriba
         * ---> añadir un title con text 'Distinciones gastronómicas por territorio', con font darle un size y weight bold y con color un color
         */
        plugins: { },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#555' } }, x: { ticks: { color: '#555' }, grid: { display: false } } },
      },
    };
  }

  private configuracionTipos(data: Restaurante[]): ChartConfiguration<'bar'> {
    // TODO - Agrupar por tipo de establecimiento y configurar las barras.
    // Se reutiliza la misma función de conteo, cambiando únicamente la
    // propiedad del restaurante que se utiliza como categoría.

    // DONE - Hacemos uso de contar para que nos devuelva la lista de tipos de restaurantes ordenados
    const valores = this.contar(data, restaurante => restaurante.restorationType?.trim() || 'Desconocido');
    return {
      type: 'bar',
      data: {
        // TODO - Para labels, recogeremos solo el primer valor string y haremos uso de un map para crear un objeto como ['Araba', 'Bizkaia', 'Gipuzkoa']
        labels: [],
        datasets: [{ 
          label: 'Restaurantes', 
          // TODO - Para data, recogeremos solo el segundo valor number y haremos uso de un map para crear un objeto como [5, 10, 20]
          data: [], 
          backgroundColor: valores.map((_, index) => `${this.colors[index % this.colors.length]}bb`), 
          borderColor: valores.map((_, index) => this.colors[index % this.colors.length]), 
          borderWidth: 2, 
          borderRadius: 6 }],
      },
      options: this.opcionesConEjes('Restaurantes por tipo de establecimiento', 'x', 'y'),
    };
  }

  private configuracionLocalidades(data: Restaurante[]): ChartConfiguration<'doughnut'> {
    // TODO - Obtener las localidades con más restaurantes y crear el gráfico donut.
    // contar() ya devuelve las localidades ordenadas de mayor a menor; por eso
    // slice(0, 10) conserva las diez primeras y evita un donut ilegible.
    const valores = this.contar(data, restaurante => restaurante.locality?.trim() || 'Desconocida').slice(0, 10);
    return {
      type: 'doughnut',
      data: {
        // TODO - Para labels, recogeremos solo el primer valor string y haremos uso de un map para crear un objeto como ['Araba', 'Bizkaia', 'Gipuzkoa']
        labels: [],
        datasets: [{ 
          // TODO - Para data, recogeremos solo el segundo valor number y haremos uso de un map para crear un objeto como [5, 10, 20]
          data: [], 
          backgroundColor: valores.map((_, index) => `${this.colors[index % this.colors.length]}bb`), 
          borderColor: valores.map((_, index) => this.colors[index % this.colors.length]), 
          borderWidth: 2, 
          hoverOffset: 10 }],
      },
      options: { 
        responsive: false, 
        animation: false,
        /* TODO - En el apartado plugins:
         * ---> añadir una leyenda en la parte de la derecha y mediante labels configurar el padding, usePointStyle, font y color
         * ---> añadir un title con text 'Distinciones gastronómicas por territorio', con font darle un size y weight bold y con color un color
         */ 
        plugins: { 
          
        } 
      },
    };
  }

  private contar(data: Restaurante[], obtenerClave: (restaurante: Restaurante) => string): [string, number][] {
    // DONE - Reutilizar este contador para agrupar datos y ordenar las categorías.
    // obtenerClave permite reutilizar el algoritmo: cambia la propiedad a
    // agrupar (territorio, tipo o localidad), pero no el código de conteo.
    // El resultado es una lista de pares [nombre, cantidad], ordenada de mayor
    // a menor para que Chart.js muestre primero los valores más importantes.
    const conteos = new Map<string, number>();
    data.forEach(restaurante => {
      const clave = obtenerClave(restaurante);
      conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
    });
    return [...conteos.entries()].sort(([, cantidadA], [, cantidadB]) => cantidadB - cantidadA);
  }

  private opcionesConEjes(titulo: string, ejeValores: 'x' | 'y', ejeCategorias: 'x' | 'y' = 'x') {
    // TODO - Configurar ejes, orientación, título y opciones comunes de Chart.js.
    // Las barras verticales usan y como eje de valores. Las horizontales usan
    // x; al cambiar indexAxis a y, Chart.js intercambia la orientación.
    return {
      responsive: false as const,
      animation: false as const,
      indexAxis: ejeValores === 'x' ? 'y' as const : 'x' as const,
      plugins: { legend: { display: false }, title: { display: true, text: titulo, font: { size: 18, weight: 'bold' as const }, color: '#333' } },
      scales: {
        [ejeValores]: { beginAtZero: true, ticks: { stepSize: 1, color: '#555' }, grid: { color: 'rgba(0,0,0,0.06)' } },
        [ejeCategorias]: { ticks: { color: '#555' }, grid: { display: false } },
      },
    };
  }
}