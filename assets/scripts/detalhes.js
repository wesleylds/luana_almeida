const API_URL = 'https://luana-almeida.onrender.com';

function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function criarCarrosselNovo(imagens, imagemPrincipal) {
    const banner = document.getElementById('banner-carrossel');
    const thumbs = document.getElementById('miniaturas-carrossel');
    if (!banner || !thumbs) return;
    const todasImagens = [imagemPrincipal, ...imagens.filter(img => img !== imagemPrincipal)];
    let idxAtual = 0;

    // Função única para abrir modal fullscreen do carrossel
    function abrirModalFullscreen(startIdx) {
        let modalIdx = startIdx;
        const modal = document.createElement('div');
        modal.id = 'img-fullscreen-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.85)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <span id='close-modal' style='position:fixed;top:24px;right:40px;font-size:2.5em;color:#fff;cursor:pointer;font-weight:bold;z-index:10000;'>&times;</span>
            <button class='carrossel-seta esq' id='modal-prev-img' style='left:24px;z-index:10001;position:fixed;top:50%;transform:translateY(-50%);font-size:2em;background:none;border:none;color:#fff;cursor:pointer;'>&#10094;</button>
            <img src='https://luana-almeida.onrender.com/uploads/${todasImagens[modalIdx]}' id='modal-img' style='max-width:90vw;max-height:90vh;display:block;margin:auto;border-radius:8px;'>
            <button class='carrossel-seta dir' id='modal-next-img' style='right:24px;z-index:10001;position:fixed;top:50%;transform:translateY(-50%);font-size:2em;background:none;border:none;color:#fff;cursor:pointer;'>&#10095;</button>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-modal').onclick = () => modal.remove();
        document.getElementById('modal-prev-img').onclick = (e) => {
            e.stopPropagation();
            modalIdx = (modalIdx - 1 + todasImagens.length) % todasImagens.length;
            document.getElementById('modal-img').src = `https://luana-almeida.onrender.com/uploads/${todasImagens[modalIdx]}`;
        };
        document.getElementById('modal-next-img').onclick = (e) => {
            e.stopPropagation();
            modalIdx = (modalIdx + 1) % todasImagens.length;
            document.getElementById('modal-img').src = `https://luana-almeida.onrender.com/uploads/${todasImagens[modalIdx]}`;
        };
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
    }

    function renderBanner(idx) {
        banner.innerHTML = `
            <img src="https://luana-almeida.onrender.com/uploads/${todasImagens[idx]}" alt="Imagem do imóvel" id="img-fullscreen-trigger">
            ${todasImagens.length > 1 ? `<button class='carrossel-seta esq' id='prev-img'>&#10094;</button><button class='carrossel-seta dir' id='next-img'>&#10095;</button>` : ''}
        `