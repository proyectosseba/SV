export function initModal() {
    const modals = [
        { modalId: 'modal-conciliacion', openId: 'card-conciliacion', closeId: 'close-modal-btn' },
        { modalId: 'modal-honorarios', openId: 'card-honorarios', closeId: 'close-honorarios-btn' },
        { modalId: 'modal-iva', openId: 'card-iva', closeId: 'close-iva-btn' },
        { modalId: 'modal-renta', openId: 'card-renta', closeId: 'close-renta-btn' }
    ];

    modals.forEach(({ modalId, openId, closeId }) => {
        const modal = document.getElementById(modalId);
        const openBtn = document.getElementById(openId);
        const closeBtn = document.getElementById(closeId);

        if (modal && openBtn && closeBtn) {
            openBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                // Animación de entrada suave
                const modalContent = modal.querySelector('.custom-modal-content');
                if(modalContent) {
                    modalContent.style.opacity = '0';
                    modalContent.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        modalContent.style.transition = 'all 0.3s ease';
                        modalContent.style.opacity = '1';
                        modalContent.style.transform = 'translateY(0)';
                    }, 10);
                }
            });

            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Cerrar al hacer clic en el fondo oscuro
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
}
