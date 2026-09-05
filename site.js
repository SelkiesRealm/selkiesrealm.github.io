(() => {
  const validRoutes = new Set([
    'gallery',
    'media',
    'commissions',
    'links',
    'credits',
    'portfolio',
    'tos',
    'soundtrack'
  ]);

  const routeTitles = {
    gallery: "References ✦ Selkie's Realm",
    media: "Media ✦ Selkie's Realm",
    commissions: "Commissions ✦ Selkie's Realm",
    links: "Socials ✦ Selkie's Realm",
    credits: "Credits ✦ Selkie's Realm",
    portfolio: "Portfolio ✦ Selkie's Realm",
    tos: "Terms of Service ✦ Selkie's Realm",
    soundtrack: "Realm Soundtrack ✦ Selkie's Realm"
  };

  const tracks = [
    {
      title: 'Welcome to My Little Sky',
      src: 'assets/music/welcome-to-my-little-sky.mp3',
      duration: '4:38'
    },
    {
      title: 'Every Shape Is Me',
      src: 'assets/music/every-shape-is-me.mp3',
      duration: '4:09'
    },
    {
      title: 'CRYSTAL ATTACK',
      src: 'assets/music/crystal-attack.mp3',
      duration: '3:39'
    }
  ];

  const homeView = document.getElementById('home-view');
  const pageView = document.getElementById('page-view');
  const mobileNav = document.getElementById('mobile-nav');
  const menuButton = document.querySelector('.menu-button');

  const audio = document.getElementById('realm-audio');
  const miniPlayer = document.getElementById('persistent-player');
  const miniTrackTitle = document.getElementById('mini-track-title');
  const miniPlayPause = document.getElementById('mini-play-pause');
  const miniNextTrack = document.getElementById('mini-next-track');
  const miniCollapseToggle = document.getElementById('player-collapse-toggle');

  const playerStateKey = 'selkie-realm-player-v3';
  const playerCollapsedKey = 'selkie-realm-player-collapsed-v1';

  let currentTrack = 0;
  let routeAbortController = null;

  const getRoute = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('page');
  };

  const closeMobileNav = () => {
    if (!mobileNav || !menuButton) return;

    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  };

  const openMobileNav = () => {
    if (!mobileNav || !menuButton) return;

    mobileNav.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
  };

  menuButton?.addEventListener('click', () => {
    if (!mobileNav) return;

    if (mobileNav.hidden) {
      openMobileNav();
    } else {
      closeMobileNav();
    }
  });

  const revealMiniPlayer = () => {
    if (!miniPlayer) return;

    miniPlayer.classList.add('is-visible');
    miniPlayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('music-active');
  };

  const applyMiniPlayerCollapsed = (isCollapsed) => {
    if (!miniPlayer || !miniCollapseToggle) return;

    miniPlayer.classList.toggle('is-collapsed', isCollapsed);
    miniCollapseToggle.setAttribute('aria-expanded', String(!isCollapsed));
    miniCollapseToggle.setAttribute(
      'aria-label',
      isCollapsed ? 'Open soundtrack player' : 'Collapse soundtrack player'
    );
  };

  const savePlayerState = () => {
    if (!audio) return;

    try {
      sessionStorage.setItem(playerStateKey, JSON.stringify({
        currentTrack,
        currentTime: audio.currentTime || 0,
        playing: !audio.paused
      }));
    } catch (_) {
      // The player still works if storage is unavailable.
    }
  };

  const updatePlayerText = () => {
    const track = tracks[currentTrack];

    if (miniTrackTitle && track) {
      miniTrackTitle.textContent = track.title;
    }

    document.querySelectorAll('[data-track-index]').forEach((button) => {
      const buttonIndex = Number(button.dataset.trackIndex);
      const isCurrent = buttonIndex === currentTrack;
      const icon = button.querySelector('.track-button-icon');
      const label = button.querySelector('.track-button-label');

      button.classList.toggle('is-current', isCurrent);

      if (icon) {
        icon.textContent = isCurrent && !audio.paused ? 'Ⅱ' : '▶';
      }

      if (label) {
        label.textContent = isCurrent && !audio.paused ? 'Pause' : 'Play';
      }
    });

    document.body.classList.toggle('is-playing', Boolean(audio && !audio.paused));
  };

  const loadTrack = (index, autoplay = false) => {
    if (!audio) return;

    currentTrack = (index + tracks.length) % tracks.length;
    audio.src = tracks[currentTrack].src;
    audio.load();

    updatePlayerText();

    if (autoplay) {
      revealMiniPlayer();

      audio.play()
        .then(() => {
          updatePlayerText();
          savePlayerState();
        })
        .catch(() => {
          updatePlayerText();
        });
    } else {
      savePlayerState();
    }
  };

  const togglePlay = () => {
    if (!audio) return;

    if (!audio.src) {
      loadTrack(currentTrack, true);
      return;
    }

    revealMiniPlayer();

    if (audio.paused) {
      audio.play()
        .then(() => {
          updatePlayerText();
          savePlayerState();
        })
        .catch(() => {
          updatePlayerText();
        });
    } else {
      audio.pause();
      updatePlayerText();
      savePlayerState();
    }
  };

  audio?.addEventListener('play', () => {
    revealMiniPlayer();
    updatePlayerText();
    savePlayerState();
  });

  audio?.addEventListener('pause', () => {
    updatePlayerText();
    savePlayerState();
  });

  audio?.addEventListener('ended', () => {
    loadTrack(currentTrack + 1, true);
  });

  miniPlayPause?.addEventListener('click', togglePlay);
  miniNextTrack?.addEventListener('click', () => loadTrack(currentTrack + 1, true));

  miniCollapseToggle?.addEventListener('click', () => {
    const shouldCollapse = !miniPlayer?.classList.contains('is-collapsed');
    applyMiniPlayerCollapsed(shouldCollapse);

    try {
      sessionStorage.setItem(playerCollapsedKey, String(shouldCollapse));
    } catch (_) {
      // The player still works if storage is unavailable.
    }
  });

  const setupTrackButtons = () => {
    document.querySelectorAll('[data-track-index]').forEach((button) => {
      button.addEventListener('click', () => {
        const selectedIndex = Number(button.dataset.trackIndex);

        if (selectedIndex === currentTrack && audio && !audio.paused) {
          togglePlay();
        } else {
          loadTrack(selectedIndex, true);
        }
      });
    });

    updatePlayerText();
  };

  const showHome = () => {
    if (!homeView || !pageView) return;

    if (routeAbortController) {
      routeAbortController.abort();
    }

    homeView.hidden = false;
    homeView.classList.add('is-active');

    pageView.hidden = true;
    pageView.classList.remove('is-active');

    document.title = "Selkie's Realm ✦";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileNav();
  };

  const loadRoute = async (route, pushState = true) => {
    if (!homeView || !pageView || !validRoutes.has(route)) {
      showHome();
      return;
    }

    if (routeAbortController) {
      routeAbortController.abort();
    }

    routeAbortController = new AbortController();

    homeView.hidden = true;
    homeView.classList.remove('is-active');

    pageView.hidden = false;
    pageView.classList.add('is-active');
    pageView.innerHTML = '<div class="page-loading">✦ Gathering this part of the realm... ✦</div>';

    document.title = routeTitles[route] || "Selkie's Realm ✦";
    closeMobileNav();

    try {
      const response = await fetch(`pages/${route}.html?v=${Date.now()}`, {
        cache: 'no-store',
        signal: routeAbortController.signal
      });

      if (!response.ok) {
        throw new Error(`Could not load ${route}`);
      }

      pageView.innerHTML = await response.text();
      setupTrackButtons();

      if (pushState) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', route);
        history.pushState({ route }, '', url);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error.name === 'AbortError') return;

      pageView.innerHTML = `
        <section class="content-page">
          <p class="page-kicker">✦ Lost in the Realm ✦</p>
          <h1>Page Missing</h1>
          <p>This page could not be loaded yet.</p>
          <a class="button button-primary" href="index.html">Return Home</a>
        </section>
      `;
    }
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');

    if (!href) return;

    const isExternal = link.target === '_blank' || href.startsWith('http') || href.startsWith('mailto:');

    if (isExternal) return;

    const url = new URL(link.href, window.location.href);
    const route = url.searchParams.get('page');

    if (route && validRoutes.has(route)) {
      event.preventDefault();
      loadRoute(route, true);
      return;
    }

    if (href === 'index.html' || href === './' || href === '/') {
      event.preventDefault();
      history.pushState({ route: 'home' }, '', 'index.html');
      showHome();
    }
  });

  window.addEventListener('popstate', () => {
    const route = getRoute();

    if (route && validRoutes.has(route)) {
      loadRoute(route, false);
    } else {
      showHome();
    }
  });

  let restoredState = null;
  let restoredCollapsedState = false;

  try {
    restoredCollapsedState = sessionStorage.getItem(playerCollapsedKey) === 'true';
  } catch (_) {
    restoredCollapsedState = false;
  }

  applyMiniPlayerCollapsed(restoredCollapsedState);

  try {
    restoredState = JSON.parse(sessionStorage.getItem(playerStateKey) || 'null');
  } catch (_) {
    restoredState = null;
  }

  if (restoredState && Number.isInteger(restoredState.currentTrack)) {
    currentTrack = Math.min(Math.max(restoredState.currentTrack, 0), tracks.length - 1);
    loadTrack(currentTrack, false);

    if (audio) {
      audio.currentTime = restoredState.currentTime || 0;
    }

    if (restoredState.playing) {
      revealMiniPlayer();
    }
  } else {
    loadTrack(0, false);
  }

  setupTrackButtons();

  const initialRoute = getRoute();

  if (initialRoute && validRoutes.has(initialRoute)) {
    loadRoute(initialRoute, false);
  } else {
    showHome();
  }
})();
