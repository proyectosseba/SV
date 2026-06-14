/**
 * Lógica para manejar la calculadora de boletas de honorarios
 */

export function initHonorariosGrid() {
    const inputBruto = document.getElementById('calc-bruto');
    const inputRetencion = document.getElementById('calc-retencion');
    const inputLiquido = document.getElementById('calc-liquido');
    const btnLimpiar = document.getElementById('btn-limpiar-calc');

    const TASA_RETENCION = 0.1525; // 15.25% para 2026

    if (!inputBruto || !inputLiquido) return;

    // Calcular desde Bruto a Líquido
    inputBruto.addEventListener('input', () => {
        // Evitar bucles infinitos por el evento input
        if (document.activeElement !== inputBruto) return;

        const bruto = parseFloat(inputBruto.value);
        if (isNaN(bruto) || bruto <= 0) {
            inputRetencion.value = '';
            inputLiquido.value = '';
            return;
        }

        const retencion = Math.round(bruto * TASA_RETENCION);
        const liquido = bruto - retencion;

        inputRetencion.value = retencion;
        inputLiquido.value = liquido;
    });

    // Calcular desde Líquido a Bruto
    inputLiquido.addEventListener('input', () => {
        // Evitar bucles infinitos
        if (document.activeElement !== inputLiquido) return;

        const liquido = parseFloat(inputLiquido.value);
        if (isNaN(liquido) || liquido <= 0) {
            inputBruto.value = '';
            inputRetencion.value = '';
            return;
        }

        // Bruto = Liquido / (1 - TASA_RETENCION)
        const bruto = Math.round(liquido / (1 - TASA_RETENCION));
        const retencion = bruto - liquido;

        inputBruto.value = bruto;
        inputRetencion.value = retencion;
    });

    // Limpiar calculadora
    btnLimpiar.addEventListener('click', () => {
        inputBruto.value = '';
        inputRetencion.value = '';
        inputLiquido.value = '';
        inputBruto.focus();
    });
}
