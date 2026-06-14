export function handleFileUpload(fileInputId, tableId, callback) {
    const input = document.getElementById(fileInputId);
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            
            // Usamos SheetJS (cargado globalmente vía CDN en index.html)
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Tomamos la primera hoja del Excel/CSV
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertimos a formato JSON (arreglo de arreglos)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
                renderTable(jsonData, tableId);
                
                // Extraer encabezados y filas
                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter(row => row.length > 0);
                
                // Enviar los datos al script principal
                callback(headers, rows);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function renderTable(data, tableId) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Limpiar tabla antes de renderizar
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) return;

    // Encontrar el número máximo de columnas en todo el archivo
    // Esto es crucial porque a veces la fila 1 es solo un "Título" que ocupa 1 celda
    const maxCols = Math.max(...data.map(row => row.length));

    // Crear fila de encabezados
    const headerRow = document.createElement('tr');
    for (let j = 0; j < maxCols; j++) {
        const th = document.createElement('th');
        th.textContent = data[0][j] || '';
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    // Crear filas de datos
    for (let i = 1; i < data.length; i++) {
        // Ignorar filas completamente vacías (todas sus celdas son undefined o string vacío)
        const isEmpty = data[i].every(cell => cell === undefined || cell === null || cell === '');
        if (isEmpty) continue; 
        
        const tr = document.createElement('tr');
        
        // Iterar asegurando que llenamos todas las celdas hasta maxCols
        for (let j = 0; j < maxCols; j++) {
            const td = document.createElement('td');
            // Formatear si es un valor para que no se vea como [object Object] u otros errores
            let val = data[i][j];
            if (val === undefined || val === null) val = '';
            td.textContent = val;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}
