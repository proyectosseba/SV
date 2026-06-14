export function initChatbot() {
    const triggerBtn = document.getElementById('copilot-trigger-btn');
    const closeBtn = document.getElementById('copilot-close-btn');
    const container = document.getElementById('sv-copilot-container');
    const messagesArea = document.getElementById('copilot-messages');
    const quickOptions = document.getElementById('copilot-quick-options');
    const inputField = document.getElementById('copilot-input');
    const sendBtn = document.getElementById('copilot-send-btn');

    let isOpen = false;
    let hasBeenOpened = false;

    // Abrir / Cerrar
    triggerBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            container.classList.remove('copilot-hidden');
            triggerBtn.style.transform = 'scale(0)';
            if (!hasBeenOpened) {
                setTimeout(sendWelcomeMessage, 300);
                hasBeenOpened = true;
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        isOpen = false;
        container.classList.add('copilot-hidden');
        triggerBtn.style.transform = 'scale(1)';
    });

    function addMessage(text, isBot = true) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('copilot-msg');
        msgDiv.classList.add(isBot ? 'copilot-msg-bot' : 'copilot-msg-user');
        msgDiv.innerHTML = text;
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.classList.add('copilot-msg', 'copilot-msg-bot');
        msgDiv.innerHTML = '<span style="color:#aaa;">Escribiendo...</span>';
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function setQuickOptions(options) {
        quickOptions.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.classList.add('copilot-chip');
            btn.innerText = opt.label;
            btn.addEventListener('click', () => {
                addMessage(opt.label, false); // Mensaje del usuario
                quickOptions.innerHTML = ''; // Limpiar opciones
                const typingId = showTyping();
                setTimeout(() => {
                    removeTyping(typingId);
                    opt.action();
                }, 1000);
            });
            quickOptions.appendChild(btn);
        });
    }

    // --- Lógica de envío al servidor Gemini --- //
    async function handleSend() {
        const text = inputField.value.trim();
        if (!text) return;

        // Limpiar UI
        inputField.value = '';
        quickOptions.innerHTML = '';
        
        // Mostrar mensaje del usuario
        addMessage(text, false);

        // Mostrar indicador de escribiendo
        const typingId = showTyping();

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            
            removeTyping(typingId);

            if (data.reply) {
                // Formatear Markdown básico de Gemini (negritas) a HTML
                let formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                // Formatear saltos de línea a <br>
                formattedReply = formattedReply.replace(/\n/g, '<br>');
                addMessage(formattedReply, true);
            } else if (data.error) {
                addMessage(`❌ Error: ${data.error}`, true);
            }
        } catch (error) {
            removeTyping(typingId);
            addMessage("❌ No me pude conectar con el servidor. ¿Aseguraste correr `node server.js` en la terminal?", true);
            console.error(error);
        }
    }

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // --- Flujos Conversacionales (Opciones Rápidas) --- //

    function sendWelcomeMessage() {
        addMessage("¡Hola! 👋 Soy <b>SV Assistant</b>, el asistente inteligente de SV Contabilidades.");
        setTimeout(() => {
            addMessage("Estoy aquí para ayudarte a navegar por nuestros servicios o resolver dudas contables rápidas. ¿Qué necesitas hoy?");
            setQuickOptions([
                { label: 'Quiero cotizar un Plan', action: flowCotizar },
                { label: 'Dudas sobre impuestos', action: flowImpuestos },
                { label: 'Hablar con un humano', action: flowContacto }
            ]);
        }, 1000);
    }

    function flowCotizar() {
        addMessage("¡Excelente elección! Nuestros planes incluyen conciliación segura y tecnología de punta.");
        setTimeout(() => {
            addMessage("Para enviarte una propuesta exacta, ¿Podrías indicarme a qué correo te contactamos? (o si prefieres, escríbenos directo al WhatsApp).");
            setQuickOptions([
                { label: 'Ir al WhatsApp 📱', action: () => window.open('https://wa.me/56900000000', '_blank') },
                { label: 'Ver Servicios', action: () => {
                    closeBtn.click();
                    const tab = new bootstrap.Tab(document.querySelector('#servicios-tab'));
                    tab.show();
                }}
            ]);
        }, 1000);
    }

    function flowImpuestos() {
        addMessage("La normativa tributaria en Chile cambia constantemente. Aquí te dejo algunos temas clave:");
        setTimeout(() => {
            setQuickOptions([
                { label: '¿Qué es el F29?', action: () => {
                    addMessage("El Formulario 29 es la declaración mensual de impuestos en Chile (IVA, Retenciones, PPM). Vence generalmente los 20 de cada mes si declaras por internet.");
                    resetFlow();
                }},
                { label: 'Operación Renta', action: () => {
                    addMessage("La Operación Renta (F22) se realiza en abril de cada año. Te recomiendo usar nuestro Simulador Gratuito en la pestaña Herramientas.");
                    resetFlow();
                }}
            ]);
        }, 500);
    }

    function flowContacto() {
        addMessage("Te pondré en contacto directo con el equipo de expertos de SV Contabilidades.");
        setTimeout(() => {
            addMessage("Haz clic abajo para abrir WhatsApp y conversar con Sebastián.");
            setQuickOptions([
                { label: 'Abrir WhatsApp', action: () => window.open('https://wa.me/56900000000', '_blank') }
            ]);
        }, 500);
    }

    function resetFlow() {
        setTimeout(() => {
            setQuickOptions([
                { label: 'Otra consulta', action: () => {
                    setQuickOptions([
                        { label: 'Quiero cotizar un Plan', action: flowCotizar },
                        { label: 'Dudas sobre impuestos', action: flowImpuestos },
                        { label: 'Hablar con un humano', action: flowContacto }
                    ]);
                }}
            ]);
        }, 1500);
    }
}
