export function initRentaSimulator() {
    const btnOpen = document.getElementById('card-renta');
    const inputBruto = document.getElementById('calc-renta-bruto');
    const inputRetenciones = document.getElementById('calc-renta-retenciones');
    const btnCalcular = document.getElementById('btn-calcular-renta');
    const resultContainer = document.getElementById('renta-resultado-container');
    const textImpuesto = document.getElementById('renta-impuesto');
    const textSaldo = document.getElementById('renta-saldo');

    if (!btnOpen || !inputBruto || !btnCalcular) return;

    // Tabla del IGC (Valores 2024 / AT 2025 aprox o lo que indica la imagen)
    const tablaIGC = [
        { desde: 0, hasta: 11265804.00, factor: 0.00, rebaja: 0.00 },
        { desde: 11265804.01, hasta: 25035120.00, factor: 0.04, rebaja: 450632.16 },
        { desde: 25035120.01, hasta: 41725200.00, factor: 0.08, rebaja: 1452036.96 },
        { desde: 41725200.01, hasta: 58415280.00, factor: 0.135, rebaja: 3746922.96 },
        { desde: 58415280.01, hasta: 75105360.00, factor: 0.23, rebaja: 9296374.56 },
        { desde: 75105360.01, hasta: 100140480.00, factor: 0.304, rebaja: 14854171.20 },
        { desde: 100140480.01, hasta: 258696240.00, factor: 0.35, rebaja: 19460633.28 },
        { desde: 258696240.01, hasta: Infinity, factor: 0.40, rebaja: 32395445.28 }
    ];

    const formatCLP = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(val));

    btnCalcular.addEventListener('click', () => {
        const honorariosAnuales = parseFloat(inputBruto.value) || 0;
        const retencionesAnuales = parseFloat(inputRetenciones.value) || 0;

        if (honorariosAnuales === 0) {
            resultContainer.style.display = 'none';
            return;
        }

        // Para honorarios, el gasto presunto es 30% con tope de 15 UTA (Aprox 11.800.000)
        let gastoPresunto = honorariosAnuales * 0.30;
        if (gastoPresunto > 11800000) gastoPresunto = 11800000;

        const baseImponible = honorariosAnuales - gastoPresunto;

        // Ubicar en la tabla
        let tramo = tablaIGC.find(t => baseImponible >= t.desde && baseImponible <= t.hasta);
        if (!tramo) tramo = tablaIGC[tablaIGC.length - 1]; // Fallback al último tramo

        const impuestoDeterminado = (baseImponible * tramo.factor) - tramo.rebaja;
        const impuestoFinal = Math.max(0, impuestoDeterminado); // No puede ser negativo

        const saldo = retencionesAnuales - impuestoFinal;

        // Mostrar resultados
        textImpuesto.innerHTML = `Tu impuesto a la renta anual estimado es de: <strong style="color: var(--color-secondary);">${formatCLP(impuestoFinal)}</strong>`;
        
        if (saldo > 0) {
            textSaldo.innerHTML = `Como acumulaste retenciones, <strong style="color: #28a745;">¡el Estado te devolvería ${formatCLP(saldo)}!</strong> 🎉`;
        } else if (saldo < 0) {
            textSaldo.innerHTML = `Tus retenciones no cubren el impuesto. <strong style="color: #dc3545;">Tendrías que pagar una diferencia de ${formatCLP(Math.abs(saldo))}.</strong>`;
        } else {
            textSaldo.innerHTML = `No tienes impuestos por pagar ni devoluciones a favor.`;
        }

        resultContainer.style.display = 'block';
    });
}
