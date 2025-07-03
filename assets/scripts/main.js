$(document).ready(function(){
    // Inicializando o Carrossel Slick para Imóveis em Destaque
    $('.imoveis-carrossel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    // Inicializando o Carrossel Slick para Novos Imóveis
    $('.novos-imoveis-carrossel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    // Inicializando o Carrossel Slick para Detalhes do Imóvel
    $('.imovel-carrossel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000
    });

    // Inicializando o Carrossel Slick para o Banner
    $('.banner-carrossel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        dots: false,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000
    });

    // Inicializando o Carrossel Slick para Sobre
    $('.sobre-carrossel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000
    });

    $('.imoveis-lista.novos').slick({
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    });

    $('.imoveis-lista.destaques').slick({
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    });

    $('.slick-carousel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: false,
        dots: true,
        arrows: true,
        responsive: [
            {
                breakpoint: 900,
                settings: { slidesToShow: 2 }
            },
            {
                breakpoint: 600,
                settings: { slidesToShow: 1 }
            }
        ]
    });

    // Função de debounce para otimizar a busca
    /**
     * Executa uma função após um tempo de espera, ignorando chamadas repetidas nesse intervalo.
     * @param {Function} func Função a ser executada
     * @param {number} wait Tempo de espera em ms
     * @returns {Function}
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Remove acentos de uma string para facilitar buscas.
     * @param {string} str
     * @returns {string}
     */
    function removerAcentos(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Busca imóveis na lista exibida, filtrando pelo termo digitado.
     * Mostra feedback visual com o número de resultados encontrados.
     */
    function buscarImoveis() {
        const buscaContainer = document.getElementById('busca');
        const imoveisContainer = document.getElementById('imoveis-disponiveis');
        if (!imoveisContainer) {
            console.warn('Container #imoveis-disponiveis não encontrado.');
            return;
        }

        let termo = document.getElementById('busca-imovel')?.value.toLowerCase() || '';
        termo = removerAcentos(termo.trim());
        let imoveis = imoveisContainer.querySelectorAll('.imovel');
        let encontrados = 0;

        imoveis.forEach(imovel => {
            let textoBusca = imovel.innerText.toLowerCase();
            textoBusca = removerAcentos(textoBusca);
            let visivel = termo === '' || textoBusca.includes(termo);
            imovel.style.display = visivel ? 'block' : 'none';
            if (visivel && termo) encontrados++;
        });

        // Feedback visual
        let mensagem = document.createElement('p');
        mensagem.id = 'feedback-busca';
        mensagem.style.color = encontrados > 0 ? '#28a745' : '#dc3545';
        mensagem.textContent = termo
            ? (encontrados > 0
                ? `${encontrados} imóvel(is) encontrado(s).`
                : 'Nenhum imóvel encontrado.')
            : '';
        let feedbackExistente = document.getElementById('feedback-busca');
        if (feedbackExistente) feedbackExistente.remove();
        if (buscaContainer) buscaContainer.appendChild(mensagem);
    }
    window.buscarImoveis = buscarImoveis;

    // Aplicar debounce à busca
    const buscaInput = document.getElementById('busca-imovel');
    if (buscaInput) {
        buscaInput.addEventListener('input', debounce(buscarImoveis, 300));
    }

    // Função para o formulário de contato
    $('#contato-form').on('submit', function(e) {
        e.preventDefault();
        
        const nome = $('#nome').val();
        const email = $('#email').val();
        const telefone = $('#telefone').val();
        const mensagem = $('#mensagem').val();
        
        // Simulação de envio (substitua por integração com backend, se necessário)
        const feedback = $('#feedback-contato');
        feedback.text('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        feedback.css('color', '#28a745');
        
        // Limpar formulário
        $('#contato-form')[0].reset();
        
        // Remover feedback após 5 segundos
        setTimeout(() => {
            feedback.text('');
        }, 5000);
    });

    // Carregar e filtrar imóveis
    function aplicarFiltro(imoveis, filtros) {
        return imoveis.filter(imovel => {
            if (filtros.busca && !(imovel.titulo.toLowerCase().includes(filtros.busca) || imovel.localizacao.toLowerCase().includes(filtros.busca))) return false;
            if (filtros.tipo && imovel.tipo !== filtros.tipo) return false;
            if (filtros.precoMin && Number(imovel.preco) < Number(filtros.precoMin)) return false;
            if (filtros.precoMax && Number(imovel.preco) > Number(filtros.precoMax)) return false;
            if (filtros.quartos && Number(imovel.quartos) !== Number(filtros.quartos)) return false;
            return true;
        });
    }

    async function carregarImoveis() {
        const res = await fetch(`${API_URL}/imoveis`);
        let imoveis = await res.json();
        const lista = $('#lista-imoveis');
        if (imoveis.length === 0) {
            lista.html('<div style="text-align:center;color:#888;font-size:1.1em;">Nenhum imóvel encontrado.</div>');
        } else {
            lista.html(imoveis.map(imovel => `
                <div class='imovel'>
                    <a href='detalhes.html?id=${imovel.id}'><img src='${API_URL}/uploads/${imovel.imagem}' alt='${imovel.titulo} #${imovel.codigo || imovel.id}'></a>
                    <div class='imovel-info'>
                        <a href='detalhes.html?id=${imovel.id}' style='text-decoration:none;'><h3>${imovel.titulo} <span class="codigo-imovel">#${imovel.codigo ? imovel.codigo : imovel.id}</span></h3></a>
                        <p class='descricao'>${imovel.descricao}</p>
                        <p><b>Preço:</b> R$ ${Number(imovel.preco).toLocaleString('pt-BR')}</p>
                        <p><b>Quartos:</b> ${imovel.quartos} | <b>Tipo:</b> ${imovel.tipo}</p>
                        <a href='detalhes.html?id=${imovel.id}'>Ver Detalhes</a>
                    </div>
                </div>
            `).join(''));
        }
    }
    carregarImoveis();
});

const API_URL = 'https://luana-almeida-site.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  // Renderização dinâmica para imoveis.html
  const container = document.getElementById('lista-imoveis');
  if (container && window.location.pathname.includes('imoveis.html')) {
    fetch(`${API_URL}/imoveis`)
      .then(res => res.json())
      .then(imoveis => {
        container.innerHTML = '';
        imoveis.forEach(imovel => {
          const card = document.createElement('div');
          card.className = 'imovel';
          card.innerHTML = `
            <a href="detalhes.html?id=${imovel.id}"><img src="${API_URL}/uploads/${imovel.imagem}" alt="${imovel.titulo}" class="fachada-img"></a>
            <a href="detalhes.html?id=${imovel.id}" style="text-decoration:none;"><h3 class="titulo-imovel">${imovel.titulo}<br><span class="codigo-imovel">#${imovel.codigo ? imovel.codigo : imovel.id}</span></h3></a>
            <div class="imovel-info">
                <p class="descricao">${imovel.descricao ?? ''}</p>
                <ul class="detalhes-lista">
                    <li><span class="icon"><i class="fas fa-home"></i></span> <strong>Tipo:</strong> ${imovel.tipo ?? '-'}</li>
                    <li><span class="icon"><i class="fas fa-bed"></i></span> <strong>Quartos:</strong> ${imovel.quartos ?? '-'}</li>
                    <li><span class="icon"><i class="fas fa-couch"></i></span> <strong>Salas:</strong> ${imovel.salas ?? '-'}</li>
                    <li><span class="icon"><i class="fas fa-ruler-combined"></i></span> <strong>Área:</strong> ${imovel.area ?? '-'} m²</li>
                    <li><span class="icon"><i class="fas fa-bath"></i></span> <strong>Banheiros:</strong> ${imovel.banheiros ?? '-'}</li>
                    <li><span class="icon"><i class="fas fa-map-marker-alt"></i></span> <strong>Localização:</strong> ${imovel.localizacao ?? '-'}</li>
                    <li><span class="icon"><i class="fas fa-dollar-sign"></i></span> <strong>Preço:</strong> R$ ${Number(imovel.preco).toLocaleString('pt-BR')}</li>
                </ul>
            </div>
            <a href="detalhes.html?id=${imovel.id}" class="btn-detalhes">Ver Detalhes</a>
          `;
          container.appendChild(card);
        });
      });
  }

  // Renderização dinâmica para index.html (apenas em Imóveis Novos, sem descrição)
  const novosContainer = document.querySelector('#imoveis-novos .imoveis-lista');
  if (novosContainer && window.location.pathname.endsWith('index.html')) {
    fetch(`${API_URL}/imoveis`)
      .then(res => res.json())
      .then(imoveis => {
        novosContainer.innerHTML = '';
        imoveis.forEach(imovel => {
          const card = document.createElement('div');
          card.className = 'imovel';
          card.innerHTML = `
            <img src="${API_URL}/uploads/${imovel.imagem}" alt="${imovel.titulo}">
            <div class="imovel-info">
                <h3>${imovel.titulo}</h3>
                <a href="detalhes.html?id=${imovel.id}">Ver Detalhes</a>
            </div>
          `;
          novosContainer.appendChild(card);
        });
      });
  }
});

// Menu hambúrguer responsivo e acessível
$(function() {
  const $menu = $('.hamburger-menu');
  const $nav = $('.header-nav .nav-menu');

  function toggleMenu() {
    $menu.toggleClass('active');
    $nav.toggleClass('active');
  }

  $menu.on('click', toggleMenu);
  $menu.on('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  // Fecha o menu ao clicar fora
  $(document).on('click', function(e) {
    if (!$menu.is(e.target) && $menu.has(e.target).length === 0 && !$nav.is(e.target) && $nav.has(e.target).length === 0) {
      $menu.removeClass('active');
      $nav.removeClass('active');
    }
  });
});