export async function initIndicadores() {
    const container = document.getElementById('indicadores-top-bar');
    if (!container) return;

    try {
        const response = await fetch('https://mindicador.cl/api');
        if (!response.ok) throw new Error('Error de red');
        const data = await response.json();
        
        const formatCurrency = (value, isCLP = true) => {
            if (isCLP) {
                return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
            }
            return value;
        };

        container.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <span style="font-weight: 600; color: var(--color-secondary);">UF:</span>
                <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(data.uf.valor)}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span style="font-weight: 600; color: var(--color-secondary);">UTM:</span>
                <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(data.utm.valor)}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span style="font-weight: 600; color: var(--color-secondary);">Dólar:</span>
                <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(data.dolar.valor)}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span style="font-weight: 600; color: var(--color-secondary);">Euro:</span>
                <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(data.euro.valor)}</span>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching indicadores:', error);
        container.innerHTML = '<span style="color: #dc3545;">Indicadores no disponibles en este momento</span>';
    }
}
