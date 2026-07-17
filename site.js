(() => {
  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuButton.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        menuButton.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const tracks = [
    {
      title: 'Welcome to My Little Sky',
      artist: 'Selkie · Realm Soundtrack',
      src: 'assets/music/welcome-to-my-little-sky.mp3',
      theme: 'theme-sky'
    },
    {
      title: 'Every Shape Is Me',
      artist: 'Selkie · Realm Soundtrack',
      src: 'assets/music/every-shape-is-me.mp3',
      theme: 'theme-shape'
    },
    {
      title: 'CRYSTAL ATTACK',
      artist: 'Selkie · Realm Soundtrack',
      src: 'assets/music/crystal-attack.mp3',
      theme: 'theme-crystal'
    }
  ];

  const audio = document.getElementById('realm-audio');
  const player = document.getElementById('soundtrack-player');
  const title = document.getElementById('track-title');
  const artist = document.getElementById('track-artist');
  const playPause = document.getElementById('play-pause');
  const previousTrack = document.getElementById('previous-track');
  const nextTrack = document.getElementById('next-track');
  const progress = document.getElementById('track-progress');
  const currentTimeLabel = document.getElementById('current-time');
  const durationLabel = document.getElementById('track-duration');
  const volume = document.getElementById('volume-slider');
  const trackButtons = Array.from(document.querySelectorAll('.track-item'));

  const miniPlayer = document.getElementById('persistent-player');
  const miniTitle = document.getElementById('mini-track-title');
  const miniPlayPause = document.getElementById('mini-play-pause');
  const miniNextTrack = document.getElementById('mini-next-track');

  let currentTrack = 0;
  let playerHasStarted = false;
  const playerStateKey = 'selkie-realm-player-v2';

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  const revealMiniPlayer = () => {
    if (!miniPlayer) return;
    miniPlayer.classList.add('is-visible');
    miniPlayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('music-active');
  };

  const savePlayerState = () => {
    if (!audio) return;
    try {
      sessionStorage.setItem(playerStateKey, JSON.stringify({
        track: currentTrack,
        time: audio.currentTime || 0,
        volume: audio.volume,
        started: playerHasStarted,
        wasPlaying: !audio.paused
      }));
    } catch (_) {
      // The player still works if storage is unavailable.
    }
  };

  const updateTrackUI = () => {
    const track = tracks[currentTrack];
    if (title) title.textContent = track.title;
    if (artist) artist.textContent = track.artist;
    if (miniTitle) miniTitle.textContent = track.title;

    if (playPause) {
      playPause.setAttribute('aria-label', `Play ${track.title}`);
    }

    if (player) {
      player.classList.remove('theme-sky', 'theme-shape', 'theme-crystal');
      player.classList.add(track.theme);
    }

    trackButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === currentTrack;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const loadTrack = (index, shouldPlay = false, resumeTime = 0) => {
    if (!audio) return;
    currentTrack = (index + tracks.length) % tracks.length;
    const track = tracks[currentTrack];

    audio.src = track.src;
    audio.load();
    updateTrackUI();

    if (progress) progress.value = 0;
    if (currentTimeLabel) currentTimeLabel.textContent = '0:00';

    const setResumeTime = () => {
      if (resumeTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(resumeTime, Math.max(audio.duration - 0.25, 0));
      }
      audio.removeEventListener('loadedmetadata', setResumeTime);
    };

    if (resumeTime > 0) {
      audio.addEventListener('loadedmetadata', setResumeTime);
    }

    if (shouldPlay) {
      playerHasStarted = true;
      revealMiniPlayer();
      audio.play().catch(() => {
        updatePlayState();
      });
    }
  };

  const updatePlayState = () => {
    if (!audio) return;
    const isPlaying = !audio.paused;
    const trackTitle = tracks[currentTrack].title;

    if (playPause) {
      playPause.classList.toggle('is-playing', isPlaying);
      playPause.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} ${trackTitle}`);
    }

    if (miniPlayPause) {
      miniPlayPause.classList.toggle('is-playing', isPlaying);
      miniPlayPause.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} ${trackTitle}`);
    }

    if (playerHasStarted) revealMiniPlayer();
    savePlayerState();
  };

  const togglePlayback = () => {
    if (!audio) return;
    playerHasStarted = true;
    revealMiniPlayer();
    if (audio.paused) {
      audio.play().catch(() => updatePlayState());
    } else {
      audio.pause();
    }
  };

  playPause?.addEventListener('click', togglePlayback);
  miniPlayPause?.addEventListener('click', togglePlayback);
  previousTrack?.addEventListener('click', () => loadTrack(currentTrack - 1, true));
  nextTrack?.addEventListener('click', () => loadTrack(currentTrack + 1, true));
  miniNextTrack?.addEventListener('click', () => loadTrack(currentTrack + 1, true));

  trackButtons.forEach((button) => {
    button.addEventListener('click', () => {
      loadTrack(Number(button.dataset.track), true);
    });
  });

  audio?.addEventListener('play', updatePlayState);
  audio?.addEventListener('pause', updatePlayState);
  audio?.addEventListener('ended', () => loadTrack(currentTrack + 1, true));

  audio?.addEventListener('loadedmetadata', () => {
    if (durationLabel) durationLabel.textContent = formatTime(audio.duration);
  });

  audio?.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    if (progress) progress.value = (audio.currentTime / audio.duration) * 100;
    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    savePlayerState();
  });

  progress?.addEventListener('input', () => {
    if (!audio?.duration) return;
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });

  volume?.addEventListener('input', () => {
    if (!audio) return;
    audio.volume = Number(volume.value);
    savePlayerState();
  });

  // Restore the last track and position after a manual refresh. Browsers may
  // require another click before resuming sound, but in-site navigation below
  // does not reload, so playback remains uninterrupted between pages.
  let restoredState = null;
  try {
    restoredState = JSON.parse(sessionStorage.getItem(playerStateKey) || 'null');
  } catch (_) {
    restoredState = null;
  }

  if (audio) {
    const restoredVolume = Number(restoredState?.volume);
    audio.volume = Number.isFinite(restoredVolume) ? restoredVolume : Number(volume?.value ?? 0.8);
    if (volume) volume.value = String(audio.volume);

    const restoredTrack = Number.isInteger(restoredState?.track) ? restoredState.track : 0;
    const restoredTime = Number(restoredState?.time) || 0;
    playerHasStarted = Boolean(restoredState?.started);
    loadTrack(restoredTrack, false, restoredTime);

    if (playerHasStarted) revealMiniPlayer();
  }

  // Persistent page navigation: swap page content without reloading the shell.
  const homeView = document.getElementById('home-view');
  const pageView = document.getElementById('page-view');
  const routeCache = new Map();
  const validRoutes = new Set(['about', 'gallery', 'portfolio', 'commissions', 'links']);
  const routeTitles = {
  about: "Enter the Realm ✦ Selkie's Realm",
  gallery: "Forms & References ✦ Selkie's Realm",
  portfolio: "Portfolio ✦ Selkie's Realm",
  commissions: "Commissions ✦ Selkie's Realm",
  links: "Realms Beyond ✦ Selkie's Realm"
};

  const showHome = (hash = '') => {
    if (!homeView || !pageView) return;
    homeView.hidden = false;
    homeView.classList.add('is-active');
    pageView.hidden = true;
    pageView.classList.remove('is-active');
    document.title = "Selkie's Realm ✦";

    requestAnimationFrame(() => {
      if (hash) {
        const target = document.querySelector(hash);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const showRoute = async (route) => {
    if (!homeView || !pageView || !validRoutes.has(route)) {
      showHome();
      return;
    }

    homeView.hidden = true;
    homeView.classList.remove('is-active');
    pageView.hidden = false;
    pageView.classList.add('is-active');
    pageView.innerHTML = '<div class="page-loading">✦ Gathering this part of the realm... ✦</div>';
    document.title = routeTitles[route] || "Selkie's Realm ✦";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await fetch(`pages/${route}.html?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${route}`);
      pageView.innerHTML = await response.text();
    } catch (error) {
      pageView.innerHTML = `
        <section class="content-page">
          <p class="page-kicker">✦ The path flickered ✦</p>
          <h1>This part of the realm could not be loaded.</h1>
          <p>Please return home and try again.</p>
          <a class="button button-primary" href="index.html">Return Home</a>
        </section>`;
      console.error(error);
    }
  };

  const renderLocation = async (url, push = false) => {
    const route = url.searchParams.get('page');

    if (push) {
      history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    if (route && validRoutes.has(route)) {
      await showRoute(route);
      return;
    }

    showHome(url.hash);
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    const isShellRoute = url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname.endsWith('/');
    if (!isShellRoute) return;

    event.preventDefault();
    renderLocation(url, true);
  });

  window.addEventListener('popstate', () => {
    renderLocation(new URL(window.location.href), false);
  });

  window.addEventListener('beforeunload', savePlayerState);

  renderLocation(new URL(window.location.href), false);
})();
