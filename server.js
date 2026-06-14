require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permite peticiones desde el Live Server (Frontend)
app.use(express.json()); // Permite recibir JSON en el body
app.use(express.static(__dirname)); // Sirve los archivos HTML, CSS y JS

// Verifica que exista la API Key
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'ACA_VA_TU_API_KEY_DE_GEMINI') {
    console.error("CRÍTICO: No se ha configurado GEMINI_API_KEY en el archivo .env");
    console.error("Por favor agrega tu llave en el archivo .env y reinicia el servidor.");
    // No salimos del proceso para no botar el servidor, pero el endpoint fallará amigablemente
}

// Inicializar SDK de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configurar el modelo con instrucciones de sistema (Personalidad del Asistente)
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: `Eres SV Assistant, el asistente inteligente y amigable de la firma 'SV Contabilidades' (una firma contable moderna en Chile dirigida por Sebastián).
El año actual es 2026.
Tu objetivo es ayudar a los usuarios que visitan la página web.
Debes responder de manera profesional, cercana, concisa y usando español de Chile.

Directrices:
1. Si te preguntan por servicios, explica brevemente que ofrecen Gestión Contable, Operación Renta y Asesorías.
2. Si un cliente quiere contratar o cotizar, pídele amablemente su correo y su RUT.
3. INSTRUCCIÓN CRÍTICA (SEGUNDO AL MANDO): Si te piden "anotar", "registrar", "comprar" o "guardar" algo para el inventario o gastos (ej: "compré 5 teclados a 20000"), extrae los datos y OBLIGATORIAMENTE incluye AL FINAL de tu respuesta un bloque de código JSON con esta estructura exacta:
\`\`\`json
{
  "producto": "nombre",
  "cantidad": 5,
  "precio_unitario": 20000,
  "total": 100000
}
\`\`\`
En tu respuesta de texto (fuera del JSON), dile al usuario que el registro fue un éxito y que Sebastián ya lo tiene en su sistema.`
});

// Mantener un historial básico en memoria para la demostración
// (En producción real, esto debería ir a una base de datos atada a un SessionID)
let chatHistory = [];

// Endpoint de Chat
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "No se proporcionó ningún mensaje." });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'ACA_VA_TU_API_KEY_DE_GEMINI') {
            return res.status(500).json({ 
                error: "El servidor no tiene configurada la API Key de Gemini. Dile al administrador que actualice el archivo .env." 
            });
        }

        // Iniciar un chat enviando el historial previo para contexto
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: 0.7,
            },
        });

        // Enviar el nuevo mensaje a Gemini
        const result = await chat.sendMessage(userMessage);
        let responseText = result.response.text();

        // Buscar si hay un bloque JSON oculto en la respuesta
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        
        if (jsonMatch && process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
            try {
                const extractedData = JSON.parse(jsonMatch[1]);
                
                // Enviar el JSON al Google Sheet via Webhook
                await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(extractedData)
                });
                
                console.log("✅ Datos enviados exitosamente a Google Sheets:", extractedData);
                
                // Borrar el bloque JSON del texto para que el usuario no vea código raro
                responseText = responseText.replace(/```json\n[\s\S]*?\n```/, "").trim();
            } catch (sheetError) {
                console.error("❌ Falló el envío a Google Sheets:", sheetError);
            }
        }

        // Actualizar el historial en memoria
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        // Enviar respuesta al frontend
        res.json({ reply: responseText });

    } catch (error) {
        console.error("❌ Error en Gemini:", error);
        res.status(500).json({ error: "Error procesando el mensaje." });
    }
});

// Endpoint exclusivo para el Modo Gestor: Motor Central de Archivos
app.post('/api/format-cartola', async (req, res) => {
    const { fileData, metadata } = req.body;
    
    if (!fileData || !metadata) {
        return res.status(400).json({ error: "No se proporcionaron los datos del archivo o los metadatos." });
    }

    try {
        const isCartola = metadata.tipoRegistro === "CARTOLA";
        
        let promptReglas = "";
        if (isCartola) {
            promptReglas = `Extrae los datos en este formato exacto para CARTOLAS. Debes buscar si existe un Saldo Inicial y Saldo Final explícito en el documento y agregarlo. Devuelve un OBJETO JSON con esta estructura:
{
  "saldo_inicial": 1000000,
  "saldo_final": 1500000,
  "rows": [
    { "id_sesion": "auto", "rut_empresa": "${metadata.rutEmpresa}", "banco": "${metadata.banco}", "cuenta": "${metadata.cuenta}", "fecha": "DD/MM/YYYY", "descripcion": "texto original", "monto": 150000, "tipo_registro": "CARTOLA" }
  ]
}`;
        } else {
            promptReglas = `Extrae los datos en este formato exacto para SISTEMA. Devuelve un OBJETO JSON con esta estructura (Extrae el RUT del Cliente/Proveedor de la descripción si existe):
{
  "saldo_inicial": null,
  "saldo_final": null,
  "rows": [
    { "id_sesion": "auto", "rut_empresa": "${metadata.rutEmpresa}", "banco": "${metadata.banco}", "cuenta": "${metadata.cuenta}", "fecha": "DD/MM/YYYY", "descripcion": "texto", "monto": 150000, "tipo": "Cargo o Abono", "n_documento": "N° Fact/Boleta o vacio", "id_cliente_proveedor": "RUT extraido sin puntos o vacio", "tipo_registro": "SISTEMA" }
  ]
}`;
        }

        const auditorModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro",
            systemInstruction: `Eres el "Cerebro Auditor" de SV Contabilidades.
Tu tarea es recibir el texto CSV crudo de un archivo de Excel y extraer la información financiera en un formato JSON estricto de array de objetos.
Reglas:
1. Analiza cada transacción. Ignora encabezados basura del banco.
2. Devuelve EXCLUSIVAMENTE un bloque de código JSON con un array. No digas "Hola" ni agregues texto.
${promptReglas}`
        });

        const prompt = `Procesa este CSV bancario/contable:\n\n${fileData}`;
        const result = await auditorModel.generateContent(prompt);
        let responseText = result.response.text();
        
        // Extraer el JSON array
        const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
        let extractedData;
        try {
            extractedData = JSON.parse(jsonMatch ? jsonMatch[1].trim() : responseText.trim());
        } catch (e) {
            throw new Error("La IA no devolvió un JSON válido.");
        }

        // Generar un ID de Sesión único para este lote de archivos
        const sessionId = "SES_" + Math.random().toString(36).substring(2, 9).toUpperCase();
        
        let rowsToSend = [];
        let saldos = { saldo_inicial: null, saldo_final: null };

        if (Array.isArray(extractedData)) {
            rowsToSend = extractedData;
        } else if (extractedData.rows && Array.isArray(extractedData.rows)) {
            rowsToSend = extractedData.rows;
            saldos.saldo_inicial = extractedData.saldo_inicial !== undefined ? extractedData.saldo_inicial : null;
            saldos.saldo_final = extractedData.saldo_final !== undefined ? extractedData.saldo_final : null;
        }

        rowsToSend = rowsToSend.map(row => ({ ...row, id_sesion: sessionId }));

        // Enviar a Google Sheets
        if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
            const sheetResp = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: "bulk_insert", 
                    rows: rowsToSend, 
                    tipo_registro: metadata.tipoRegistro,
                    id_sesion: sessionId,
                    saldo_inicial: saldos.saldo_inicial,
                    saldo_final: saldos.saldo_final
                })
            });
            const sheetResult = await sheetResp.text();
            console.log(`✅ Lote de ${rowsToSend.length} filas enviado a Google Sheets (${metadata.tipoRegistro}).`);
            console.log(`📥 Respuesta de Sheets:`, sheetResult);
        }

        res.json({ success: true, filasProcesadas: rowsToSend.length });

    } catch (error) {
        console.error("❌ Error en el Motor Central:", error);
        res.status(500).json({ error: `Error del servidor: ${error.message || error.toString()}` });
    }
});

// Endpoint básico para chequear que el servidor está vivo
app.get('/', (req, res) => {
    res.send('Servidor Backend de SV Contabilidades corriendo correctamente.');
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`=========================================`);
    console.log(`🚀 Servidor Backend corriendo en el puerto ${port}`);
    console.log(`➡️  Asegúrate de haber puesto tu API Key en el archivo .env`);
    console.log(`=========================================`);
});
