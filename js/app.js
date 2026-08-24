/* ============================================
 * 博客核心逻辑（Hank 风格版）
 * 文章放在仓库 articles/ 目录，命名：
 *   YYYY-MM-DD-文章标题.md
 * 支持 YAML Front Matter：title / date / category / tags / cover
 * ============================================ */

(function () {
  "use strict";

  var CFG = window.BLOG_CONFIG || {};
  var API_LIST = "https://api.github.com/repos/" + CFG.githubUser + "/" + CFG.githubRepo + "/contents/articles";
  var RAW_PREFIX = "https://raw.githubusercontent.com/" + CFG.githubUser + "/" + CFG.githubRepo + "/" + CFG.githubBranch + "/articles/";

  // 示例文章（本地预览 / 仓库未配置时显示）
  var LOCAL_SAMPLE = [
    {
      file: "2026-08-24-第一篇博客.md",
      content: "---\ntitle: 第一篇博客\ndate: 2026-08-24\ncategory: 生活\ntags: [生活, 随笔]\n---\n\n你好，欢迎来到我的博客！\n\n这是一篇**示例文章**，用于本地预览。当你把博客部署到 GitHub 后，这里会显示你仓库 `articles/` 目录下的真实文章。\n\n## 怎么发新文章\n\n1. 在 GitHub 仓库的 `articles/` 文件夹里新建一个 `.md` 文件\n2. 文件名格式：`2026-08-24-文章标题.md`\n3. 写好后首页自动出现这篇文章\n\n## 支持的格式\n\n- **加粗**、*斜体*、`行内代码`\n- 列表、表格、引用\n- 代码块自动高亮\n\n```javascript\nconsole.log('hello blog');\n```\n"
    },
    {
      file: "2026-08-23-博客搭建记录.md",
      content: "---\ntitle: 博客搭建记录\ndate: 2026-08-23\ncategory: 学习\ntags: [Typecho, 博客]\ncover: \n---\n\n今天搭好了自己的博客，记录一下过程：\n\n- 用纯静态 HTML + Markdown，不依赖服务器\n- 文章托管在 GitHub 公开仓库\n- 网址通过 GitHub Pages 免费访问\n\n> 不用花一分钱，也能拥有自己的博客。\n"
    }
  ];

  var cacheArticles = [];

  // ---------- DOM ----------
  var viewList = document.getElementById("view-list");
  var viewArticle = document.getElementById("view-article");
  var viewAbout = document.getElementById("view-about");
  var articleList = document.getElementById("article-list");
  var categoryFilter = document.getElementById("category-filter");
  var aboutBody = document.getElementById("about-body");
  var sidebar = document.getElementById("sidebar");
  var menuToggle = document.getElementById("menu-toggle");

  // ---------- 工具函数 ----------

  function titleFromFile(name) {
    var s = name.replace(/\.md$/i, "");
    var m = s.match(/^\d{4}-\d{2}-\d{2}-?(.*)$/);
    return m ? m[1] : s;
  }

  function dateFromFile(name) {
    var m = name.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + "-" + m[2] + "-" + m[3] : "";
  }

  function daysBetween(start, end) {
    var a = new Date(start), b = new Date(end);
    return Math.max(0, Math.floor((b - a) / 86400000));
  }

  function parseFrontMatter(md) {
    var fm = {};
    var content = md;
    var m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (m) {
      m[1].split(/\r?\n/).forEach(function (line) {
        var kv = line.match(/^(\w+):\s*(.*)$/);
        if (kv) {
          var k = kv[1].trim();
          var v = kv[2].trim();
          v = v.replace(/^["']|["']$/g, "");
          if (k === "tags") {
            var arr = v.replace(/^\[|\]$/g, "").split(",");
            v = arr.map(function (t) { return t.trim(); }).filter(Boolean);
          }
          fm[k] = v;
        }
      });
      content = m[2];
    }
    return { fm: fm, content: content };
  }

  function renderMarkdown(md) {
    if (window.marked && marked.parse) {
      var html = marked.parse(md, { breaks: true });
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      tmp.querySelectorAll("pre code").forEach(function (b) {
        if (window.hljs) hljs.highlightElement(b);
      });
      return tmp.innerHTML;
    }
    return "<p>Markdown 解析器未加载。</p>";
  }

  function excerpt(md) {
    var lines = md.split(/\r?\n/).filter(function (l) {
      var t = l.trim();
      return t && !t.startsWith("#") && !t.startsWith(">") && !t.startsWith("```");
    });
    var text = lines.join(" ").replace(/[*_`#>|\[\]()!\-]/g, "").slice(0, 120);
    return text || "（无摘要）";
  }

  // ---------- 数据加载 ----------

  function loadArticles(cb) {
    fetch(API_LIST)
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (files) {
        var mds = files.filter(function (f) { return /\.md$/i.test(f.name); });
        if (!mds.length) throw new Error("no md");
        mds.sort(function (a, b) { return b.name.localeCompare(a.name); });
        cb({ remote: true, files: mds });
      })
      .catch(function () {
        cb({ remote: false, files: LOCAL_SAMPLE.map(function (s) { return { name: s.file }; }) });
      });
  }

  function loadArticleContent(fileName, cb) {
    var sample = LOCAL_SAMPLE.filter(function (s) { return s.file === fileName; })[0];
    if (sample) { cb(sample.content); return; }
    fetch(RAW_PREFIX + encodeURIComponent(fileName))
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
      .then(cb)
      .catch(function () {
        document.getElementById("article-body").innerHTML = '<p style="color:#c0392b">文章加载失败。请确认仓库和文件名正确。</p>';
      });
  }

  // ---------- 渲染左侧 ----------

  function renderSidebar() {
    document.getElementById("site-title").textContent = CFG.title || "片刻";
    document.getElementById("top-title").textContent = CFG.title || "片刻";
    document.getElementById("banner-title").textContent = CFG.title || "片刻";
    document.getElementById("banner-motto").textContent = CFG.motto || "";
    document.getElementById("banner-avatar").src = CFG.avatar || "";
    document.getElementById("foot-author").textContent = CFG.author || "";
    document.getElementById("foot-year").textContent = new Date().getFullYear();
    if (CFG.icp) document.getElementById("foot-icp").textContent = CFG.icp;

    var banner = document.getElementById("site-banner").querySelector(".banner-cover");
    if (CFG.banner) { banner.classList.add("img"); banner.style.backgroundImage = "url(" + CFG.banner + ")"; }

    // 菜单
    var menuEl = document.getElementById("site-menu");
    menuEl.innerHTML = "";
    (CFG.menu || []).forEach(function (m) {
      var a = document.createElement("a");
      a.href = m.url;
      a.innerHTML = '<span class="icon">' + m.icon + "</span><span>" + m.label + "</span>";
      if (location.hash === m.url || (m.url === "#/" && location.hash === "")) a.classList.add("active");
      a.addEventListener("click", function () { sidebar.classList.remove("open"); });
      menuEl.appendChild(a);
    });

    // 社交
    var soc = document.getElementById("social-links");
    soc.innerHTML = "";
    (CFG.social || []).forEach(function (s) {
      var a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.textContent = s.icon;
      soc.appendChild(a);
    });

    // 运行天数
    document.getElementById("stat-days").textContent = daysBetween(CFG.startDate, new Date().toISOString().slice(0, 10));
  }

  // ---------- 渲染右侧 ----------

  function renderRightbar() {
    var q = CFG.quotes ? CFG.quotes[Math.floor(Math.random() * CFG.quotes.length)] : "";
    document.getElementById("quote-text").textContent = q;
    document.getElementById("quote-cover").src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='90'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23e8f5e9'/%3E%3Cstop offset='1' stop-color='%23e3f2fd'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='300' height='90'/%3E%3C/svg%3E";

    document.getElementById("about-location").textContent = CFG.location || "-";
    document.getElementById("about-job").textContent = CFG.job || "-";
    document.getElementById("about-github").innerHTML = '<a href="https://github.com/' + CFG.githubUser + '" target="_blank">' + CFG.githubUser + "</a>";

    var like = document.getElementById("like-list");
    like.innerHTML = "";
    (CFG.links || []).forEach(function (l) {
      var li = document.createElement("li");
      li.innerHTML = "<span>◎</span><a href='" + l.url + "' target='_blank'>" + l.title + "</a>";
      like.appendChild(li);
    });

    var topic = document.getElementById("topic-list");
    topic.innerHTML = "";
    (CFG.topics || []).forEach(function (t) {
      var a = document.createElement("a");
      a.className = "topic";
      a.href = t.url;
      a.style.background = "linear-gradient(120deg, " + (t.cover || "#e8f5e9") + ", #fff)";
      a.innerHTML = "<span>" + t.title + "</span>";
      topic.appendChild(a);
    });
  }

  // ---------- 渲染文章列表 ----------

  function renderCategoryFilter(articles, currentCat) {
    var cats = {};
    articles.forEach(function (a) { if (a.category) cats[a.category] = 1; });
    var html = '<button class="filter-btn' + (currentCat ? "" : " active") + '" data-cat="">全部</button>';
    Object.keys(cats).sort().forEach(function (c) {
      html += '<button class="filter-btn' + (c === currentCat ? " active" : "") + '" data-cat="' + c + '">' + c + "</button>";
    });
    categoryFilter.innerHTML = html;

    categoryFilter.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = this.dataset.cat;
        location.hash = cat ? "#/category/" + encodeURIComponent(cat) : "#/";
      });
    });
  }

  function cardHTML(article) {
    var tags = (article.tags || []).map(function (t) { return '<span class="card-tag">' + t + "</span>"; }).join("");
    var cover = article.cover ? '<img class="card-cover" src="' + article.cover + '" alt="">' : "";
    return (
      '<a class="card" href="#/a/' + encodeURIComponent(article.file) + '">' +
        '<div class="card-head">' +
          '<img class="card-avatar" src="' + (CFG.avatar || "") + '" alt="">' +
          '<div>' +
            '<div class="card-author">' + (CFG.author || "作者") + "</div>" +
            '<div class="card-date">' + article.date + "</div>" +
          "</div>" +
        "</div>" +
        cover +
        '<div class="card-title">' + article.title + "</div>" +
        '<div class="card-desc">' + article.excerpt + "</div>" +
        '<div class="card-foot">' +
          '<div class="card-tags">' + tags + "</div>" +
          '<span class="read-btn">Read →</span>' +
        "</div>" +
      "</a>"
    );
  }

  function renderList(articles, remote, category) {
    var filtered = category ? articles.filter(function (a) { return a.category === category; }) : articles;
    articleList.innerHTML = "";
    filtered.forEach(function (a) {
      articleList.insertAdjacentHTML("beforeend", cardHTML(a));
    });

    document.getElementById("stat-articles").textContent = articles.length;
    var catSet = {};
    articles.forEach(function (a) { if (a.category) catSet[a.category] = 1; });
    document.getElementById("stat-cats").textContent = Object.keys(catSet).length;
    document.getElementById("stat-comments").textContent = "0";

    // 标签云
    var tagCloud = document.getElementById("tag-cloud");
    var allTags = {};
    articles.forEach(function (a) { (a.tags || []).forEach(function (t) { allTags[t] = 1; }); });
    tagCloud.innerHTML = Object.keys(allTags).sort().map(function (t) { return '<span>' + t + "</span>"; }).join("");

    renderCategoryFilter(articles, category);

    if (!remote) {
      var tip = document.createElement("div");
      tip.className = "local-tip";
      tip.innerHTML = "⚠ 当前显示的是<b>本地示例文章</b>。部署到 GitHub 后，这里会自动读取你的真实文章。";
      articleList.insertBefore(tip, articleList.firstChild);
    }
  }

  // ---------- 视图 ----------

  function showView(which) {
    [viewList, viewArticle, viewAbout].forEach(function (v) { v.classList.add("hidden"); });
    which.classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function renderArticle(fileName) {
    showView(viewArticle);
    document.getElementById("article-title").textContent = titleFromFile(fileName);
    document.getElementById("article-body").innerHTML = '<div class="loading">加载中...</div>';
    loadArticleContent(fileName, function (md) {
      var parsed = parseFrontMatter(md);
      var meta = parsed.fm;
      document.getElementById("article-title").textContent = meta.title || titleFromFile(fileName);
      var head = document.getElementById("post-meta-head");
      head.innerHTML =
        '<img src="' + (CFG.avatar || "") + '" alt="">' +
        '<div><div style="font-weight:600">' + (CFG.author || "作者") + "</div>" +
        '<div style="font-size:12px;color:var(--muted)">' + (meta.date || dateFromFile(fileName)) + " · " + (meta.category || "未分类") + "</div></div>";
      document.getElementById("article-body").innerHTML = renderMarkdown(parsed.content);
    });
  }

  function renderAbout() {
    showView(viewAbout);
    aboutBody.innerHTML = renderMarkdown(
      "# 关于我\n\n你好，我是 **" + CFG.author + "**。\n\n这是用纯静态网页搭建的个人博客，文章以 Markdown 保存在 GitHub 公开仓库中，通过 GitHub Pages 免费托管访问。\n\n> " + CFG.motto + "\n\n## 联系我\n\n- GitHub：[" + CFG.githubUser + "](https://github.com/" + CFG.githubUser + ")\n- 位置：" + CFG.location + "\n"
    );
  }

  // ---------- 路由 ----------

  function router() {
    var hash = location.hash || "#/";
    if (hash.indexOf("#/a/") === 0) {
      renderArticle(decodeURIComponent(hash.slice(4)));
    } else if (hash.indexOf("#/category/") === 0) {
      showView(viewList);
      var cat = decodeURIComponent(hash.slice(11));
      renderList(cacheArticles.articles, cacheArticles.remote, cat);
    } else if (hash === "#/about") {
      renderAbout();
    } else {
      showView(viewList);
      renderList(cacheArticles.articles, cacheArticles.remote, "");
    }
  }

  // ---------- 背景音乐（Web Audio 合成轻音乐） ----------

  function BGM() {
    this.playing = false;
    this.ctx = null;
    this.nextNoteTime = 0;
    this.timerID = null;
    this.tempo = 58; // 慢速 BPM，慵懒氛围
    // Cmaj7 / Fmaj7 / Em7 / Am7 — 舒缓和弦进行
    this.notes = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [349.23, 392.00, 466.16, 587.33], // Fmaj7
      [329.63, 392.00, 493.88, 587.33], // Em7
      [220.00, 261.63, 329.63, 392.00]  // Am7
    ];
    this.chordIdx = 0;
    this.masterGain = null;
  }

  BGM.prototype._init = function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.10;

    // 延迟 + 反馈，营造轻微空间感
    var delay = this.ctx.createDelay();
    delay.delayTime.value = 0.28;
    var feedback = this.ctx.createGain();
    feedback.gain.value = 0.22;

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(this.ctx.destination);

    return true;
  };

  BGM.prototype._playChord = function (time, chord) {
    if (!this.ctx) return;
    var dur = 3.8;
    var master = this.masterGain;
    var ctx = this.ctx;
    chord.forEach(function (freq) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.value = freq;

      filter.type = "lowpass";
      filter.frequency.value = 900;

      var now = time;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + dur);
    });
  };

  BGM.prototype._scheduler = function () {
    if (!this.playing || !this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this._playChord(this.nextNoteTime, this.notes[this.chordIdx]);
      this.nextNoteTime += (60 / this.tempo) * 4; // 一小节
      this.chordIdx = (this.chordIdx + 1) % this.notes.length;
    }
    var self = this;
    this.timerID = setTimeout(function () { self._scheduler(); }, 120);
  };

  BGM.prototype.start = function () {
    if (!this.ctx && !this._init()) return;
    if (this.playing) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.playing = true;
    this._scheduler();
    updateBgmUI(true);
  };

  BGM.prototype.stop = function () {
    this.playing = false;
    if (this.timerID) clearTimeout(this.timerID);
    if (this.ctx && this.ctx.state === "running") this.ctx.suspend();
    updateBgmUI(false);
  };

  BGM.prototype.toggle = function () {
    if (this.playing) this.stop(); else this.start();
  };

  function updateBgmUI(playing) {
    var el = document.getElementById("bgm-control");
    var icon = el ? el.querySelector(".bgm-icon") : null;
    var text = el ? el.querySelector(".bgm-text") : null;
    if (el) el.classList.toggle("playing", playing);
    if (icon) icon.textContent = playing ? "🎶" : "🎵";
    if (text) text.textContent = playing ? "暂停" : "音乐";
  }

  // ---------- 初始化 ----------

  function init() {
    renderSidebar();
    renderRightbar();

    loadArticles(function (res) {
      var articles = res.files.map(function (f) {
        var sample = LOCAL_SAMPLE.filter(function (s) { return s.file === (f.name || f.file); })[0];
        var md = sample ? sample.content : "";
        var parsed = parseFrontMatter(md);
        var fileName = f.name || f.file;
        return {
          file: fileName,
          title: parsed.fm.title || titleFromFile(fileName),
          date: parsed.fm.date || dateFromFile(fileName),
          category: parsed.fm.category || "生活",
          tags: Array.isArray(parsed.fm.tags) ? parsed.fm.tags : [],
          cover: parsed.fm.cover || "",
          excerpt: excerpt(parsed.content)
        };
      });
      // 远程文章只从文件名提取，正文等点击再加载
      cacheArticles = { articles: articles, remote: res.remote };
      router();
    });

    window.addEventListener("hashchange", router);

    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!sidebar.contains(e.target) && e.target !== menuToggle) sidebar.classList.remove("open");
    });

    // 背景音乐：自动尝试播放，浏览器阻止时等待用户第一次交互
    var bgm = new BGM();
    var bgmBtn = document.getElementById("bgm-control");
    var autoStarted = false;
    try {
      bgm.start();
      autoStarted = true;
    } catch (e) {
      autoStarted = false;
    }
    // 若自动播放被浏览器拦截，用户第一次点击页面任意位置时开启
    function firstInteraction() {
      if (!bgm.playing) bgm.start();
      document.removeEventListener("click", firstInteraction);
      document.removeEventListener("touchstart", firstInteraction);
    }
    if (!autoStarted) {
      document.addEventListener("click", firstInteraction);
      document.addEventListener("touchstart", firstInteraction);
    }
    if (bgmBtn) {
      bgmBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        bgm.toggle();
      });
    }
  }

  init();
})();
