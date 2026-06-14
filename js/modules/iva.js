export function initIVACalculator() {
    const inputNeto = document.getElementById('calc-iva-neto');
    const inputImpuesto = document.getElementById('calc-iva-impuesto');
    const inputBruto = document.getElementById('calc-iva-bruto');
    const btnLimpiar = document.getElementById('btn-limpiar-iva');

    if (!inputNeto || !inputImpuesto || !inputBruto || !btnLimpiar) return;

    const TASA_IVA = 0.19;

    const calculateFromNeto = () => {
        const neto = parseFloat(inputNeto.value);
        if (isNaN(neto)) {
            inputImpuesto.value = '';
            inputBruto.value = '';
            return;
        }

        const iva = Math.round(neto * TASA_IVA);
        const bruto = neto + iva;

        inputImpuesto.value = iva;
        inputBruto.value = bruto;
    };

    const calculateFromBruto = () => {
        const bruto = parseFloat(inputBruto.value);
        if (isNaN(bruto)) {
            inputNeto.value = '';
            inputImpuesto.value = '';
            return;
        }

        const neto = Math.round(bruto / (1 + TASA_IVA));
        const iva = bruto - neto;

        inputNeto.value = neto;
        inputImpuesto.value = iva;
    };

    inputNeto.addEventListener('input', calculateFromNeto);
    inputBruto.addEventListener('input', calculateFromBruto);

    btnLimpiar.addEventListener('click', () => {
        inputNeto.value = '';
        inputImpuesto.value = '';
        inputBruto.value = '';
        inputNeto.focus();
    });
}
