document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const dropZoneText = document.getElementById("dropZoneText");
    const processBtn = document.getElementById("processBtn");
    const statusMessage = document.getElementById("statusMessage");

    let rawCsvData = "";

    // Abrir selector al hacer clic
    dropZone.addEventListener("click", () => fileInput.click());

    // Evitar que el navegador intente descargar o abrir el archivo si fallas un poco la zona
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    // Drag & Drop en la zona
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile(fileInput.files[0]);
        }
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    // Leer archivo con SheetJS
    function handleFile(file) {
        dropZoneText.innerHTML = `<b>Archivo cargado:</b> ${file.name}<br>Leyendo datos...`;
        processBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            try {
                const workbook = XLSX.read(data, {type: 'array'});
                // Tomar la primera hoja
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convertir a CSV para enviarlo fácil a la IA
                rawCsvData = XLSX.utils.sheet_to_csv(worksheet);
                
                dropZoneText.innerHTML = `<b>✅ ${file.name} listo para procesar con IA</b>`;
                processBtn.disabled = false;
                processBtn.innerText = "Analizar con IA y Enviar a Sheets";
            } catch (err) {
                console.error(err);
                dropZoneText.innerHTML = `❌ Error al leer el archivo. Asegúrate de que sea Excel o CSV.`;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    processBtn.addEventListener("click", async () => {
        const tipoRegistro = document.getElementById("tipoRegistro").value;
        const rutEmpresa = document.getElementById("rutEmpresa").value.trim();
        const banco = document.getElementById("banco").value.trim();
        const cuenta = document.getElementById("cuenta").value.trim();

        if (!rutEmpresa || !banco || !cuenta) {
            showStatus("❌ Por favor, llena el RUT, Banco y N° de Cuenta antes de procesar.", "error");
            return;
        }

        processBtn.disabled = true;
        processBtn.innerText = "⏳ El Cerebro Auditor está analizando...";
        statusMessage.style.display = "none";

        try {
            const response = await fetch('/api/format-cartola', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fileData: rawCsvData,
                    metadata: { tipoRegistro, rutEmpresa, banco, cuenta }
                })
            });

            const data = await response.json();

            if (response.ok) {
                showStatus(`✅ ¡Éxito! Se procesaron y enviaron ${data.filasProcesadas} filas a tu Google Sheet en la pestaña ${tipoRegistro}.`, "success");
            } else {
                showStatus(`❌ Error de la IA: ${data.error}`, "error");
            }
        } catch (error) {
            console.error(error);
            showStatus("❌ Error de red al comunicarse con el servidor local.", "error");
        } finally {
            processBtn.disabled = false;
            processBtn.innerText = "Analizar con IA y Enviar a Sheets";
        }
    });

    function showStatus(text, type) {
        statusMessage.innerHTML = text;
        statusMessage.className = `status-box status-${type}`;
    }
});
