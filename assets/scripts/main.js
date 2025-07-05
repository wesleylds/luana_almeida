document.addEventListener('DOMContentLoaded', function () {
  // Carregar imóveis na página imoveis.html
  if (window.location.pathname.endsWith('imoveis.html')) {
    carregarImoveisPublico();
  }

  // Inicializar carrosséis se existirem
  inicializarCarrosseis();
});

async function carregarImoveisPublico() {
  const API_URL = 'http://localhost:8080';
  const lista = document.getElementById('lista-imoveis');
  if (!lista) return;
  
  lista.innerHTML = '<div style="color:#888;text-align:center;">Carregando imóveis...</div>';
  
  try {
    const res = await fetch(`${API_URL}/imoveis`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const imoveis = await res.json();
    
    if (!Array.isArray(imoveis) || imoveis.length === 0) {
      lista.innerHTML = '<div style="color:#888;text-align:center;">Nenhum imóvel cadastrado ainda.</div>';
      return;
    }
    
    lista.innerHTML = imoveis.map(imovel => {
      // Descrição curta e elegante
      let descricao = imovel.descricao || '';
      if (descricao.length > 300) {
        descricao = descricao.substring(0, 300) + '...';
      }
      return `
      <div class="imovel-card">
        <img src="${API_URL}/uploads/${imovel.imagem}" alt="${imovel.titulo}" class="imovel-img" onerror="this.src='assets/images/exemplo-sala-estar.jpg'">
        <div class="imovel-info">
          <div class="imovel-titulo">${imovel.titulo}</div>
          <div class="imovel-dados-destaque">
            <span title="Preço"><i class="fa-solid fa-tag"></i> R$ ${Number(imovel.preco).toLocaleString('pt-BR')}</span>
            <span title="Tipo"><i class="fa-solid fa-home"></i> ${imovel.tipo || '-'}</span>
            <span title="Quartos"><i class="fa-solid fa-bed"></i> ${imovel.quartos ?? '-'} Quartos</span>
            <span title="Salas"><i class="fa-solid fa-couch"></i> ${imovel.salas ?? '-'} Salas</span>
            <span title="Banheiros"><i class="fa-solid fa-bath"></i> ${imovel.banheiros ?? '-'} Banheiros</span>
            <span title="Área Total"><i class="fa-solid fa-ruler-combined"></i> ${imovel.area_total ? imovel.area_total + ' m²' : '-'}</span>
            <span title="Área Construída"><i class="fa-solid fa-building"></i> ${imovel.area_construida ? imovel.area_construida + ' m²' : '-'}</span>
          </div>
          <div class="imovel-extra-info">
            <span title="Localização"><i class="fa-solid fa-map-marker-alt"></i> ${imovel.localizacao || '-'}</span>
            <span title="Código"><i class="fa-solid fa-hashtag"></i> IMV${imovel.codigo || '-'}</span>
          </div>
          <div class="imovel-descricao-simples">${descricao}</div>
          <a href="detalhes.html?id=${imovel.id}" class="btn-detalhes">Ver Detalhes</a>
        </div>
      </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Erro ao carregar imóveis:', e);
    lista.innerHTML = '<div style="color:#d00;text-align:center;">Erro ao carregar imóveis. Verifique se o servidor está rodando.</div>';
  }
}

function inicializarCarrosseis() {
  // Verificar se o jQuery e Slick estão carregados
  if (typeof $ === 'undefined' || typeof $.fn.slick === 'undefined') {
    console.log('jQuery ou Slick não estão carregados');
    return;
  }

  // Inicializando o Carrossel Slick para Imóveis em Destaque
  if ($('.destaque-carrossel').length) {
    $('.destaque-carrossel').slick({
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
  }

  // Inicializando o Carrossel Slick para Novos Imóveis
  if ($('.novos-imoveis-carrossel').length) {
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
  }

  // Inicializando o Carrossel Slick para Detalhes do Imóvel
  if ($('.detalhes-carrossel').length) {
    $('.detalhes-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para o Banner
  if ($('.banner-carrossel').length) {
    $('.banner-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para Sobre
  if ($('.sobre-carrossel').length) {
    $('.sobre-carrossel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000
    });
  }

  // Inicializando o Carrossel Slick para Lista de Novos Imóveis
  if ($('.imoveis-lista.novos').length) {
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
  }
}

// Função de debounce para otimizar buscas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Função para remover acentos
function removerAcentos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Função de busca de imóveis
function buscarImoveis() {
  const termo = document.getElementById('busca-input').value.toLowerCase();
  const cards = document.querySelectorAll('.imovel-card');
  
  cards.forEach(card => {
    const titulo = card.querySelector('h3').textContent.toLowerCase();
    const localizacao = card.querySelector('p:last-child').textContent.toLowerCase();
    const tituloSemAcentos = removerAcentos(titulo);
    const localizacaoSemAcentos = removerAcentos(localizacao);
    const termoSemAcentos = removerAcentos(termo);
    
    if (titulo.includes(termo) || localizacao.includes(termo) || 
        tituloSemAcentos.includes(termoSemAcentos) || localizacaoSemAcentos.includes(termoSemAcentos)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Aplicar filtros de busca
function aplicarFiltro(tipo, valor) {
  const cards = document.querySelectorAll('.imovel-card');
  
  cards.forEach(card => {
    let mostrar = true;
    
    if (tipo === 'preco') {
      const precoTexto = card.querySelector('p').textContent;
      const preco = parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (valor === 'baixo' && preco > 200000) mostrar = false;
      if (valor === 'medio' && (preco < 200000 || preco > 500000)) mostrar = false;
      if (valor === 'alto' && preco < 500000) mostrar = false;
    }
    
    if (tipo === 'tipo') {
      const tipoImovel = card.querySelector('p:nth-child(3)').textContent.toLowerCase();
      if (valor !== 'todos' && !tipoImovel.includes(valor)) mostrar = false;
    }
    
    card.style.display = mostrar ? 'block' : 'none';
  });
}

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