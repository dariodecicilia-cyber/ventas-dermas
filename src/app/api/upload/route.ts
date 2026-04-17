import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const brand = formData.get('brand') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (!process.env.GEMINI_API_KEY) {
       throw new Error("No se ha configurado la API Key de Gemini en el servidor.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    });
    
    const promptInstructions = `Eres un robot estricto de extracción de bases de datos. Analiza el documento adjunto y extrae TODOS LOS PRODUCTOS a formato JSON.\n`
                 + `REGLA DE ORO: ¡EXTRAE TODOS Y CADA UNO DE LOS PRODUCTOS SIN EXCEPCIÓN! NO RESUMAS. NO OMITAS NINGUNA FILA. HAZ UNA LECTURA MILIMÉTRICA.\n\n`
                 + `ADVERTENCIA CONTABLE: Si ves productos similares o de la misma familia juntos (ej. tres tipos de 'IONTO' o varios 'Kits'), EXTRÁELOS COMO OBJETOS SEPARADOS. No agrupes. Si omites un renglón, descuadrarás el inventario.\n\n`
                 + `El JSON debe contener EXACTAMENTE un ARRAY [] de objetos, sin formato markdown extra, donde cada objeto tenga esta estructura estricta:\n`
                 + `{ "id": "abc-123", "name": "Nombre descriptivo del producto (ej. 'Serum Vitamina C', 'Crema Hidratante'). NUNCA pongas solo la medida aquí.", "presentation": "La medida (ej. 30 ml, 500 gr, 1L).", "brand": "${brand || 'Desconocida'}", "description": "", "price": PrecioNumericoEntero, "category": "Categoría lógica (ej. Higiene, Facial, Corporal, Peeling, Capilar)" }\n`
                 + `OJO: Si el documento lista un producto y debajo varios tamaños con distintos precios, el 'name' debe ser el mismo para todos los tamaños, y lo que varía es la 'presentation' y el 'price'.\n`;

    let parts: any[] = [{ text: promptInstructions }];

    if (file.name.toLowerCase().endsWith('.pdf')) {
      // RETORNO A VÍA VISUAL: El archivo original de texto plano rompe las tablas de precios, así que volvimos al modelo visual puro
      parts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      });
    } else if (file.name.endsWith('.xlsx')) {
      const wp = xlsx.read(buffer);
      const wsName = wp.SheetNames[0];
      const wsData = xlsx.utils.sheet_to_json(wp.Sheets[wsName], { header: 1 }) as any[];
      
      const nativeProducts: any[] = [];
      let currentCategory = "General";
      
      for (const row of wsData) {
        if (!row || row.length === 0) continue;
        
        // Limpieza básica de la fila para evitar problemas con celdas "vacías" que vienen con espacios
        const cleanRow = row.map((c: any) => (c === null || c === undefined) ? "" : String(c).trim());
        
        if (cleanRow.length === 0) continue;

        // REGLA DE ENCABEZADO: Solo saltamos si es la fila de títulos exactos
        const firstCell = (cleanRow[0] || "").toUpperCase();
        if (firstCell === 'PRODUCTO' || firstCell === 'PRODUCTOS' || firstCell === 'NOMBRE') continue;
        
        // Detección de Categoría (si la primera celda es texto y las otras están vacías)
        if (cleanRow[0] && !cleanRow[1] && !cleanRow[2]) {
           currentCategory = cleanRow[0];
           continue;
        }

        let name = "";
        let presentation = "";
        let price: any = 0;
        
        if (brand === 'Ale Piña') {
          name = cleanRow[0];
          presentation = cleanRow[1];
          price = row[2]; // Usamos el valor original del row para detectar si es número
          if (!currentCategory || currentCategory === "General") currentCategory = "Cosmética Médica";
        } else if (brand === 'Bioalquimia') {
          name = cleanRow[1];
          price = row[3];
          currentCategory = cleanRow[0] || currentCategory;
        } else if (brand === 'NÜR') {
          if (cleanRow[0] && cleanRow[0].length > 2) currentCategory = cleanRow[0];
          name = cleanRow[1];
          presentation = cleanRow[2];
          price = row[4];
        } else {
          name = cleanRow[1];
          price = row[2];
          if (cleanRow[0] && isNaN(Number(cleanRow[0]))) currentCategory = cleanRow[0];
        }

        // 🕵️ PROCESAMIENTO ULTRA-FLEXIBLE DE PRECIO
        const getNumericPrice = (val: any) => {
           if (typeof val === 'number') return val;
           if (!val) return 0;
           // Si es un string, le quitamos todo lo que no sea número (puntos de miles, simbolos $)
           const num = String(val).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
           return parseFloat(num) || 0;
        };

        const finalPrice = getNumericPrice(price);

        if (name && name.length > 1 && finalPrice > 0) {
           nativeProducts.push({
             id: Math.random().toString(36).substring(7),
             name: name,
             presentation: presentation,
             brand: brand || "Desconocida",
             description: "",
             price: Math.round(finalPrice),
             category: currentCategory,
             order_index: nativeProducts.length // Preservamos el orden secuencial
           });
        }
      }
      
      if (nativeProducts.length === 0) {
        return NextResponse.json({ error: `No se extrajeron productos. Verifica el formato del archivo.` }, { status: 400 });
      }
      
      return NextResponse.json({ success: true, count: nativeProducts.length, products: nativeProducts });
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Usa PDF o XLSX.' }, { status: 400 });
    }

    // SI ES PDF, ENTRA EL MODELO SUPERIOR DE GEMINI
    const result = await model.generateContent(parts);
    const textResponse = result.response.text();
    console.log("Gemini Response Length:", textResponse.length);
    console.log("Gemini Response Preview:", textResponse.substring(0, 150) + "...");
    
    // Limpieza de marcadores
    let cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    let startIndex = cleanJson.indexOf('[');
    let endIndex = cleanJson.lastIndexOf(']');
    
    let parsedData: any[] = [];
    if (startIndex !== -1 && endIndex !== -1) {
       try {
           parsedData = JSON.parse(cleanJson.substring(startIndex, endIndex + 1));
       } catch (e) {
           console.error("Fallo parse principal, intentando rescate.");
       }
    }
    
    // Si el parseo inicial falló por truncamiento
    if (parsedData.length === 0) {
       try {
         const lastValidEnd = cleanJson.lastIndexOf('}');
         if (lastValidEnd !== -1) {
           const rescuedJson = cleanJson.substring(cleanJson.indexOf('['), lastValidEnd + 1) + ']';
           parsedData = JSON.parse(rescuedJson);
         }
       } catch (e3) {
         console.error("Trágico: ni el rescate funcionó.");
       }
    }

    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // SANITIZACIÓN FINAL ANTIALUCINACIONES:
    // Obligamos a que la marca de todos los productos extraídos por la IA sea ESTRICTAMENTE 
    // la que seleccionaste en el menú, ignorando cualquier locura o "rayita" que haya inventado la IA.
    parsedData = parsedData.map(p => ({
       ...p,
       brand: brand || "Desconocida",
       id: Math.random().toString(36).substring(7) // React key única e impenetrable
    }));

    return NextResponse.json({ success: true, count: parsedData.length, products: parsedData });

  } catch (error: any) {
    console.error("Error en extracción:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
