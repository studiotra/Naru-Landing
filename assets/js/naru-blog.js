/* =============================================================
   Naru Landing — lightweight blog data layer
   -------------------------------------------------------------
   • Published posts: assets/data/posts.json
   • Korean copy: assets/data/posts-kr.json
   • Drafts / edits: localStorage (admin.html)
   • insights.html + insight-detail.html render from getPosts()
   ============================================================= */
(function (window) {
  'use strict';

  var STORAGE_KEY = 'naru_posts_v2';
  var POSTS_URL = 'assets/data/posts.json';
  var POSTS_KR_URL = 'assets/data/posts-kr.json';
  var LANG_KEY = 'naru-lang';
  var DEFAULT_COVER = 'assets/imgs/blog/blog-5.webp';

  var _posts = null;
  var _krMap = null;
  var _loadPromise = null;

  var SEED_POSTS = window.NARU_POSTS_SEED || null;
  var _krSeed = window.NARU_POSTS_KR_SEED || null;

  function applyKrSeed() {
    if (_krSeed && (!_krMap || !Object.keys(_krMap).length)) {
      _krMap = _krSeed;
    }
  }

  function applyPostSeed() {
    if (SEED_POSTS && SEED_POSTS.length) return SEED_POSTS;
    if (window.NARU_POSTS_SEED && window.NARU_POSTS_SEED.length) {
      SEED_POSTS = window.NARU_POSTS_SEED;
      return SEED_POSTS;
    }
    return [];
  }

  function getLang() {
    try {
      return window.localStorage.getItem(LANG_KEY) === 'kr' ? 'kr' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return null;
  }

  function savePosts(arr) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      return false;
    }
  }

  function resetToSeed() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    return loadPosts(true);
  }

  function fetchJsonPosts() {
    return fetch(POSTS_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('posts.json not found');
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) throw new Error('empty posts');
        SEED_POSTS = data;
        return data;
      });
  }

  function fetchKrMap() {
    return fetch(POSTS_KR_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('posts-kr.json not found');
        return r.json();
      })
      .catch(function () {
        return {};
      });
  }

  function loadPosts(forceJson) {
    if (_loadPromise && !forceJson) return _loadPromise;

    _loadPromise = Promise.all([
      new Promise(function (resolve) {
        var stored = forceJson ? null : readStore();
        if (stored) {
          _posts = stored;
          resolve(_posts);
          return;
        }
        fetchJsonPosts()
          .then(function (json) {
            _posts = json;
            resolve(_posts);
          })
          .catch(function () {
            _posts = applyPostSeed();
            resolve(_posts);
          });
      }),
      fetchKrMap().then(function (map) {
        _krMap = map && Object.keys(map).length ? map : (_krSeed || {});
      })
    ]).then(function () {
      applyKrSeed();
      if (!_posts || !_posts.length) _posts = applyPostSeed();
      return _posts;
    });

    return _loadPromise;
  }

  function localizePost(p) {
    if (!p) return p;
    if (getLang() !== 'kr') return p;
    var kr = (p.kr) || (_krMap && _krMap[p.slug]);
    if (!kr) return p;
    return {
      slug: p.slug,
      title: kr.title || p.title,
      category: kr.category || p.category,
      excerpt: kr.excerpt || p.excerpt,
      body: kr.body || p.body,
      date: p.date,
      author: p.author,
      cover: p.cover
    };
  }

  function getPosts() {
    var base;
    if (_posts) {
      base = _posts;
    } else {
      var stored = readStore();
      base = stored && stored.length ? stored : applyPostSeed();
    }
    return base.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    }).map(localizePost);
  }

  function getPost(slug) {
    if (!slug) return null;
    var all = getPosts();
    for (var i = 0; i < all.length; i++) {
      if (all[i].slug === slug) return all[i];
    }
    /* Fallback: slug may exist in published seed but not in localStorage draft */
    var seed = applyPostSeed();
    for (var j = 0; j < seed.length; j++) {
      if (seed[j].slug === slug) return localizePost(seed[j]);
    }
    return null;
  }

  function slugify(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    var lang = getLang();
    var locale = lang === 'kr' ? 'ko-KR' : 'en-US';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function metaLabel() {
    return getLang() === 'kr' ? '작성' : 'By';
  }

  function renderInsightsList(selector) {
    var wrap = document.querySelector(selector);
    if (!wrap) return;
    var posts = getPosts();
    if (!posts.length) {
      wrap.innerHTML = getLang() === 'kr'
        ? '<p class="text">아직 인사이트가 없습니다.</p>'
        : '<p class="text">No insights yet.</p>';
      return;
    }
    var delays = ['0.45', '0.60', '0.75'];
    wrap.innerHTML = posts.map(function (p, i) {
      var cover = p.cover || DEFAULT_COVER;
      return '' +
        '<a href="insight-detail.html?slug=' + encodeURIComponent(p.slug) + '">' +
        '<article class="blog fade-anim" data-delay="' + delays[i % 3] + '">' +
        '<div class="thumb"><img src="' + escapeHtml(cover) + '" alt="' + escapeHtml(p.title) + '"></div>' +
        '<div class="content-wrapper"><div class="content">' +
        '<h2 class="title">' + escapeHtml(p.title) + '</h2>' +
        '<div class="meta"><span class="name">' + metaLabel() + ' <span>' + escapeHtml(p.author || 'Naru') + '</span></span>' +
        '<span class="date has-left-line">' + escapeHtml(formatDate(p.date)) + '</span></div>' +
        '</div></div>' +
        '</article></a>';
    }).join('');
  }

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  function renderInsightDetail() {
    var slug = getParam('slug');
    var post = slug ? getPost(slug) : null;
    var kr = getLang() === 'kr';
    var set = function (id, val, asHtml) {
      var el = document.getElementById(id);
      if (!el) return;
      if (asHtml) el.innerHTML = val; else el.textContent = val;
    };

    if (!post) {
      set('article-category', kr ? '인사이트' : 'Insight');
      set('article-title', kr ? '글을 찾을 수 없습니다' : 'Article not found');
      set('article-meta', '');
      set('article-body', kr
        ? '<p>해당 인사이트를 찾을 수 없습니다. <a href="insights.html">전체 인사이트로 돌아가기</a>.</p>'
        : '<p>Sorry, we couldn&rsquo;t find that insight. <a href="insights.html">Back to all insights</a>.</p>', true);
      var coverWrap = document.getElementById('article-cover-wrap');
      if (coverWrap) coverWrap.style.display = 'none';
      return;
    }

    document.title = post.title + ' — Naru Landing';
    set('article-category', post.category || (kr ? '인사이트' : 'Insight'));
    set('article-title', post.title);
    set('article-meta', metaLabel() + ' ' + (post.author || 'Naru') + ' · ' + formatDate(post.date));
    var coverImg = document.getElementById('article-cover');
    if (coverImg) {
      coverImg.src = post.cover || DEFAULT_COVER;
      coverImg.alt = post.title;
    }
    set('article-body', post.body || '', true);
  }

  function refresh() {
    renderInsightsList('#insights-list');
    if (document.getElementById('article-body')) {
      renderInsightDetail();
    }
  }

  function init() {
    return loadPosts(false);
  }

  window.addEventListener('naru:langchange', function () {
    refresh();
  });

  window.NaruBlog = {
    STORAGE_KEY: STORAGE_KEY,
    POSTS_URL: POSTS_URL,
    POSTS_KR_URL: POSTS_KR_URL,
    get SEED_POSTS() { return SEED_POSTS || []; },
    getLang: getLang,
    init: init,
    loadPosts: loadPosts,
    getPosts: getPosts,
    getPost: getPost,
    savePosts: savePosts,
    resetToSeed: resetToSeed,
    slugify: slugify,
    formatDate: formatDate,
    localizePost: localizePost,
    renderInsightsList: renderInsightsList,
    renderInsightDetail: renderInsightDetail,
    refresh: refresh
  };
})(window);
