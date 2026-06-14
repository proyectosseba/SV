/**
 * Lógica para manejar el grid editable de movimientos del sistema
 * y su envío a Google Sheets con contexto.
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9kPd1pOfCfBFA9a_aqLrNgRoWhiM5xlQFCJnooeUcl3TraFkvXcm6bsoYvFunmYiN/exec";
const ID_SESION_FICTICIO = "SESION_" + Math.floor(Math.random() * 1000000);

export function initEditableGrid() {
    const btnAddRow = document.getElementById('btn-add-row');
    const btnSend = document.getElementById('btn-send-data');
    const tableBody = document.querySelector('#table-movimientos tbody');

    // Elementos de contexto
    const selectEmpresa = document.getElementById('select-empresa');
    const selectBanco = document.getElementById('select-banco');
    const selectCuenta = document.getElementById('select-cuenta');
    
    const gridToolbar = document.getElementById('grid-toolbar');
    const gridContainer = document.getElementById('grid-container');

    // Función para validar si los 3 selectores tienen valor
    const checkContext = () => {
        if (selectEmpresa.value && selectBanco.value && selectCuenta.value) {
            gridToolbar.style.opacity = "1";
            gridToolbar.style.pointerEvents = "auto";
            gridContainer.style.opacity = "1";
            gridContainer.style.pointerEvents = "auto";
        } else {
            gridToolbar.style.opacity = "0.5";
            gridToolbar.style.pointerEvents = "none";
            gridContainer.style.opacity = "0.5";
            gridContainer.style.pointerEvents = "none";
        }
    };

    // Escuchar cambios en los selectores
    selectEmpresa.addEventListener('change', checkContext);
    selectBanco.addEventListener('change', checkContext);
    selectCuenta.addEventListener('change', checkContext);

    // Agregar primera fila por defecto
    addRow(tableBody);

    btnAddRow.addEventListener('click', () => {
        addRow(tableBody);
    });

    btnSend.addEventListener('click', async () => {
        // Validar contexto antes de enviar
        if (!selectEmpresa.value || !selectBanco.value || !selectCuenta.value) {
            alert("Por favor, seleccione Empresa, Banco y Cuenta Bancaria antes de enviar.");
            return;
        }
        await sendToGoogleSheets(selectEmpresa.value, selectBanco.value, selectCuenta.value);
    });
}

function addRow(tbody) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td><input type="date" class="input-fecha"></td>
        <td><input type="text" class="input-desc" placeholder="Descripción"></td>
        <td><input type="number" class="input-monto" placeholder="Monto" step="0.01"></td>
        <td>
            <select class="input-tipo">
                <option value="INGRESO">INGRESO</option>
                <option value="EGRESO">EGRESO</option>
            </select>
        </td>
        <td><input type="text" class="input-doc" placeholder="N° Documento"></td>
        <td><input type="text" class="input-cliente" placeholder="ID Cliente/Proveedor"></td>
        <td><button class="btn-danger btn-delete">Eliminar</button></td>
    `;

    const btnDelete = tr.querySelector('.btn-delete');
    btnDelete.addEventListener('click', () => {
        tr.remove();
    });

    tbody.appendChild(tr);
}

async function sendToGoogleSheets(empresa, banco, cuenta) {
    const rows = Array.from(document.querySelectorAll('#table-movimientos tbody tr'));
    const statusMsg = document.getElementById('status-message');
    const btnSend = document.getElementById('btn-send-data');
    
    if (rows.length === 0) {
        alert("No hay datos en la grilla para enviar.");
        return;
    }

    const data = [];
    
    rows.forEach(tr => {
        let fechaVal = tr.querySelector('.input-fecha').value;
        if (fechaVal) {
            const [year, month, day] = fechaVal.split('-');
            fechaVal = `${day}-${month}-${year}`;
        }

        const descripcion = tr.querySelector('.input-desc').value;
        let monto = Number(tr.querySelector('.input-monto').value) || 0;
        const tipo = tr.querySelector('.input-tipo').value;
        const documento = tr.querySelector('.input-doc').value;
        const clienteProveedor = tr.querySelector('.input-cliente').value;
        
        // Validación matemática del Monto según el Tipo
        monto = Math.abs(monto); // Asegurarse de trabajar con el valor absoluto inicial
        if (tipo === "EGRESO") {
            monto = -monto; // Convertir a negativo
        }

        // Validar que la fila no esté completamente en blanco
        if (fechaVal || descripcion || monto !== 0 || documento || clienteProveedor) {
            // Construir array de 10 columnas
            const rowData = [
                ID_SESION_FICTICIO,   // 1. ID Sesión
                empresa,              // 2. RUT Empresa
                banco,                // 3. Banco
                cuenta,               // 4. Cuenta Bancaria
                fechaVal,             // 5. Fecha
                descripcion,          // 6. Descripción
                monto,                // 7. Monto Calculado (+/-)
                tipo,                 // 8. Tipo
                documento,            // 9. N° Documento
                clienteProveedor      // 10. ID Cliente/Proveedor
            ];
            
            data.push(rowData);
        }
    });

    if (data.length === 0) {
        alert("Todas las filas están vacías.");
        return;
    }

    try {
        btnSend.disabled = true;
        btnSend.innerText = "Enviando...";
        statusMsg.innerText = "Enviando datos...";
        statusMsg.style.color = "#104c9e";

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(data)
        });

        statusMsg.innerText = "¡Datos guardados con éxito!";
        statusMsg.style.color = "green";
        
        // Opcional: Limpiar grilla tras envío exitoso
        // document.querySelector('#table-movimientos tbody').innerHTML = '';
        // addRow(document.querySelector('#table-movimientos tbody'));

    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Error al enviar los datos. Revisa tu conexión.";
        statusMsg.style.color = "red";
    } finally {
        btnSend.disabled = false;
        btnSend.innerText = "Enviar al Sistema";
        
        setTimeout(() => {
            if(statusMsg.innerText === "¡Datos guardados con éxito!") {
                statusMsg.innerText = "";
            }
        }, 5000);
    }
}
