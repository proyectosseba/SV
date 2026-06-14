import { initModal } from './modules/modal.js';
import { initEditableGrid } from './modules/reconciliation.js';
import { initHonorariosGrid } from './modules/honorarios.js';
import { initIndicadores } from './modules/indicadores.js';
import { initIVACalculator } from './modules/iva.js';
import { initRentaSimulator } from './modules/renta.js';
import { initChatbot } from './modules/chatbot.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar apertura y cierre de Modales
    initModal();

    // 2. Inicializar Grid Editable y Exportación para Conciliación
    initEditableGrid();

    // 3. Inicializar Grid Editable para Honorarios
    initHonorariosGrid();

    // 4. Inicializar Indicadores Económicos (API Mindicador)
    initIndicadores();

    // 5. Inicializar Calculadora de IVA
    initIVACalculator();

    // 6. Inicializar Simulador de Operación Renta
    initRentaSimulator();

    // 7. Inicializar Asistente IA
    initChatbot();
});
