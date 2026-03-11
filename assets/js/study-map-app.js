(function () {
  function init(userConfig) {
    if (!userConfig || !Array.isArray(userConfig.mindMapData)) {
      throw new Error('StudyMapApp: mindMapData is required');
    }

    const config = {
      emptyMessage: 'Sem questoes disponiveis',
      emptyDescription: 'Ainda nao adicionamos exercicios para este tema.',
      noSubjectMessage: 'Nenhum assunto encontrado.',
      countLabel: null,
      ...userConfig,
    };

    const mindMapData = config.mindMapData;
    const questionsData = Array.isArray(config.questionsData) ? config.questionsData : [];

    let activeSubject = mindMapData[0];
    let viewMode = 'map';
    let quizState = { currentQIndex: 0, selectedOption: null, showExplanation: false };

    const sidebar = document.getElementById('sidebar');
    const mobileOpenBtn = document.getElementById('mobileOpenBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const searchInput = document.getElementById('searchInput');
    const subjectListEl = document.getElementById('subjectList');
    const materiasCountEl = document.getElementById('materiasCount');
    const headerTitle = document.getElementById('headerTitle');
    const tabMap = document.getElementById('tabMap');
    const tabQuiz = document.getElementById('tabQuiz');
    const mapContainer = document.getElementById('mapContainer');
    const quizContainer = document.getElementById('quizContainer');

    if (!subjectListEl || !tabMap || !tabQuiz || !mapContainer || !quizContainer) {
      throw new Error('StudyMapApp: required DOM elements not found');
    }

    injectA11yStyles();
    configureAria();
    bindEvents();
    renderSidebarList('');
    updateHeader();
    updateTabsUI();
    renderMainContent();

    function injectA11yStyles() {
      if (document.getElementById('studyMapA11yStyles')) return;

      const style = document.createElement('style');
      style.id = 'studyMapA11yStyles';
      style.textContent = [
        '.a11y-focus:focus-visible{outline:2px solid #0f172a;outline-offset:2px;border-radius:.5rem;}',
        '.a11y-focus-light:focus-visible{outline:2px solid #ffffff;outline-offset:2px;border-radius:.5rem;}',
        '.a11y-focus-ring:focus-visible{box-shadow:0 0 0 3px rgba(15,23,42,.35);}',
      ].join('');
      document.head.appendChild(style);
    }

    function configureAria() {
      const resolvedCountLabel = config.countLabel || (materiasCountEl ? materiasCountEl.textContent.trim() : 'Topicos');

      if (mobileOpenBtn) {
        mobileOpenBtn.setAttribute('aria-label', mobileOpenBtn.getAttribute('aria-label') || 'Abrir menu lateral');
        mobileOpenBtn.setAttribute('aria-controls', 'sidebar');
        mobileOpenBtn.setAttribute('aria-expanded', 'false');
        mobileOpenBtn.classList.add('a11y-focus-light');
      }

      if (mobileCloseBtn) {
        mobileCloseBtn.setAttribute('aria-label', mobileCloseBtn.getAttribute('aria-label') || 'Fechar menu lateral');
        mobileCloseBtn.classList.add('a11y-focus-light');
      }

      if (searchInput) {
        searchInput.setAttribute('aria-label', searchInput.getAttribute('aria-label') || 'Buscar assunto');
        searchInput.classList.add('a11y-focus-ring');
      }

      if (subjectListEl) {
        subjectListEl.setAttribute('role', 'listbox');
        subjectListEl.setAttribute('aria-label', resolvedCountLabel);
      }

      tabMap.setAttribute('role', 'tab');
      tabQuiz.setAttribute('role', 'tab');
      tabMap.setAttribute('aria-controls', 'mapContainer');
      tabQuiz.setAttribute('aria-controls', 'quizContainer');
      tabMap.classList.add('a11y-focus');
      tabQuiz.classList.add('a11y-focus');

      const tabsContainer = tabMap.parentElement;
      if (tabsContainer) {
        tabsContainer.setAttribute('role', 'tablist');
        tabsContainer.setAttribute('aria-label', 'Alternar entre mapa mental e questoes');
      }

      mapContainer.setAttribute('role', 'region');
      mapContainer.setAttribute('aria-label', 'Mapa mental');
      quizContainer.setAttribute('role', 'region');
      quizContainer.setAttribute('aria-label', 'Questoes praticas');
      quizContainer.setAttribute('aria-live', 'polite');
    }

    function bindEvents() {
      if (mobileOpenBtn) {
        mobileOpenBtn.addEventListener('click', function () {
          toggleSidebar(true);
        });
      }

      if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', function () {
          toggleSidebar(false);
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          renderSidebarList(e.target.value);
        });
      }

      tabMap.addEventListener('click', function () {
        setViewMode('map');
      });
      tabQuiz.addEventListener('click', function () {
        setViewMode('quiz');
      });

      [tabMap, tabQuiz].forEach(function (tab) {
        tab.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          if (tab === tabMap) {
            tabQuiz.focus();
            setViewMode('quiz');
          } else {
            tabMap.focus();
            setViewMode('map');
          }
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
          toggleSidebar(false);
          if (mobileOpenBtn) mobileOpenBtn.focus();
        }
      });
    }

    function toggleSidebar(open) {
      if (!sidebar) return;
      if (open) {
        sidebar.classList.remove('-translate-x-full');
      } else {
        sidebar.classList.add('-translate-x-full');
      }

      if (mobileOpenBtn) {
        mobileOpenBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    }

    function setViewMode(mode) {
      viewMode = mode;
      updateTabsUI();
      renderMainContent();
    }

    function updateTabsUI() {
      const activeClass = 'flex items-center gap-2 px-4 md:px-6 py-1.5 rounded-lg text-sm font-semibold transition-all bg-white text-slate-900 shadow-sm';
      const inactiveClass = 'flex items-center gap-2 px-4 md:px-6 py-1.5 rounded-lg text-sm font-semibold transition-all text-slate-700 hover:text-slate-900';

      if (viewMode === 'map') {
        tabMap.className = activeClass + ' a11y-focus';
        tabQuiz.className = inactiveClass + ' a11y-focus';
        tabMap.setAttribute('aria-selected', 'true');
        tabQuiz.setAttribute('aria-selected', 'false');
      } else {
        tabQuiz.className = activeClass + ' a11y-focus';
        tabMap.className = inactiveClass + ' a11y-focus';
        tabMap.setAttribute('aria-selected', 'false');
        tabQuiz.setAttribute('aria-selected', 'true');
      }

      tabMap.setAttribute('tabindex', '0');
      tabQuiz.setAttribute('tabindex', '0');
    }

    function updateHeader() {
      if (headerTitle) headerTitle.textContent = activeSubject.title;
    }

    function selectSubject(subjectId) {
      const found = mindMapData.find(function (s) {
        return s.id === subjectId;
      });
      if (!found) return;

      activeSubject = found;
      quizState = { currentQIndex: 0, selectedOption: null, showExplanation: false };

      renderSidebarList(searchInput ? searchInput.value : '');
      updateHeader();
      renderMainContent();

      if (window.innerWidth < 768) toggleSidebar(false);
    }

    function renderSidebarList(filterText) {
      const text = (filterText || '').toLowerCase();
      const filtered = mindMapData.filter(function (s) {
        return s.title.toLowerCase().includes(text);
      });

      if (materiasCountEl) {
        const label = config.countLabel || materiasCountEl.textContent.replace(/\(.*\)/, '').trim();
        materiasCountEl.textContent = label + ' (' + filtered.length + ')';
        materiasCountEl.classList.remove('text-slate-400');
        materiasCountEl.classList.add('text-slate-600');
      }

      subjectListEl.innerHTML = '';

      if (filtered.length === 0) {
        subjectListEl.innerHTML = '<div class="text-center text-slate-600 text-sm py-4">' + config.noSubjectMessage + '</div>';
        return;
      }

      filtered.forEach(function (subject) {
        const isActive = activeSubject.id === subject.id;
        const subjectHref = typeof config.subjectHrefResolver === 'function' ? config.subjectHrefResolver(subject) : null;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.setAttribute('aria-label', subjectHref ? 'Abrir pagina do topico ' + subject.title : 'Abrir topico ' + subject.title);
        btn.setAttribute('data-subject-option', 'true');
        btn.dataset.subjectId = subject.id;
        if (subjectHref) {
          btn.dataset.subjectHref = subjectHref;
        }
        btn.tabIndex = 0;
        btn.onclick = function () {
          if (subjectHref) {
            window.location.href = subjectHref;
            return;
          }
          selectSubject(subject.id);
          btn.focus();
        };

        let classes = 'w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all a11y-focus ';
        if (isActive) {
          classes += 'bg-slate-100 text-slate-900 font-semibold shadow-sm ring-1 ring-slate-300';
        } else {
          classes += 'hover:bg-slate-100 text-slate-700';
        }
        btn.className = classes;

        btn.innerHTML =
          '<div class="w-2.5 h-2.5 rounded-full ' + subject.color + ' shadow-sm shrink-0"></div>' +
          '<span class="text-sm leading-tight truncate">' + subject.title + '</span>';

        btn.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          e.preventDefault();
          const options = Array.from(subjectListEl.querySelectorAll('[data-subject-option="true"]'));
          const currentIndex = options.indexOf(btn);
          const nextIndex = e.key === 'ArrowDown'
            ? Math.min(options.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);

          const next = options[nextIndex];
          if (next) {
            next.focus();
          }
        });

        subjectListEl.appendChild(btn);
      });
    }

    function renderMainContent() {
      if (viewMode === 'map') {
        mapContainer.classList.remove('hidden');
        quizContainer.classList.add('hidden');
        renderMindMap();
      } else {
        mapContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        renderQuiz();
      }
    }

    function renderMindMap() {
      let html =
        '<div class="mb-8 flex justify-center md:justify-start">' +
          '<div class="px-6 md:px-8 py-4 rounded-2xl shadow-lg text-white font-bold text-xl md:text-2xl flex items-center gap-3 ' + activeSubject.color + '">' +
            '<i class="fa-solid fa-book opacity-90 text-2xl"></i>' +
            activeSubject.title +
          '</div>' +
        '</div>' +
        '<div class="flex flex-col gap-6 pl-2 md:pl-12">';

      activeSubject.nodes.forEach(function (node) {
        html += createMapNode(node, 0);
      });

      html += '</div>';
      mapContainer.innerHTML = html;
    }

    function createMapNode(node, depth) {
      const hasChildren = node.children && node.children.length > 0;
      const isTip = String(node.title || '').toLowerCase().includes('dica');

      let html = '<div class="flex flex-col ' + (depth > 0 ? 'ml-6 md:ml-8' : '') + '">';
      html += '<div class="flex items-start my-2 relative">';

      if (depth > 0) {
        html += '<div class="w-6 md:w-8 h-6 border-b-2 border-l-2 border-slate-300 rounded-bl-lg absolute -left-6 md:-left-8 top-1"></div>';
      }

      const bgColor = isTip ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300';
      const textColor = isTip ? 'text-amber-900' : 'text-slate-900';
      const contentColor = isTip ? 'text-amber-900 font-medium' : 'text-slate-700';
      const keywordClass = isTip ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-800 border-slate-300';
      const exampleClass = isTip ? 'bg-amber-100 border-amber-300 text-amber-950' : 'bg-indigo-50 border-indigo-200 text-indigo-900';
      const borderLeft = depth === 0 ? 'border-l-4 border-l-slate-900' : '';

      html +=
        '<details class="group relative shadow-sm border rounded-xl p-4 w-full md:w-96 transition-all hover:shadow-md ' + bgColor + ' ' + borderLeft + '" open>' +
          '<summary class="flex justify-between items-center cursor-pointer list-none outline-none a11y-focus">' +
            '<h3 class="font-semibold ' + textColor + ' ' + (depth === 0 ? 'text-lg' : 'text-base') + '">' + node.title + '</h3>' +
            (hasChildren
              ? '<span aria-hidden="true" class="text-slate-500 bg-slate-50/50 rounded-full w-6 h-6 flex items-center justify-center transition-colors">' +
                  '<i class="fa-solid fa-chevron-down group-open:hidden"></i>' +
                  '<i class="fa-solid fa-chevron-up hidden group-open:block"></i>' +
                '</span>'
              : '') +
          '</summary>' +
          (node.content ? '<p class="text-sm mt-3 leading-relaxed ' + contentColor + '">' + node.content + '</p>' : '') +
          (node.keywords
            ? '<div class="flex flex-wrap gap-1.5 mt-3">' +
                node.keywords
                  .map(function (kw) {
                    return '<span class="text-xs px-2.5 py-1 rounded-md font-medium border ' + keywordClass + '">' + kw + '</span>';
                  })
                  .join('') +
              '</div>'
            : '') +
          (node.examples
            ? '<div class="mt-3 p-2.5 rounded-lg border ' + exampleClass + '">' +
                node.examples
                  .map(function (ex) {
                    return '<p class="text-xs italic mb-1 last:mb-0 leading-relaxed">' + ex + '</p>';
                  })
                  .join('') +
              '</div>'
            : '');

      if (hasChildren) {
        html += '<div class="flex flex-col relative mt-4">';
        html += '<div class="absolute left-0 top-0 bottom-6 w-px bg-slate-300"></div>';
        node.children.forEach(function (child) {
          html += createMapNode(child, depth + 1);
        });
        html += '</div>';
      }

      html += '</details></div></div>';
      return html;
    }

    function renderQuiz() {
      const subjectQuestions = questionsData.filter(function (q) {
        return q.subjectId === activeSubject.id;
      });

      if (subjectQuestions.length === 0) {
        quizContainer.innerHTML =
          '<div class="flex flex-col items-center justify-center h-64 text-center px-4 mt-12">' +
            '<i class="fa-solid fa-circle-question text-5xl text-slate-400 mb-4"></i>' +
            '<h3 class="text-lg font-bold text-slate-800 mb-2">' + config.emptyMessage + '</h3>' +
            '<p class="text-sm text-slate-700">' + config.emptyDescription + '</p>' +
          '</div>';
        return;
      }

      const q = subjectQuestions[quizState.currentQIndex];
      const isAnswered = quizState.selectedOption !== null;
      const isCorrect = quizState.selectedOption === q.correctAnswer;

      let html =
        '<div class="mb-6 flex items-center justify-between">' +
          '<span class="text-sm font-bold text-slate-600 uppercase tracking-wider">Questao ' + (quizState.currentQIndex + 1) + ' de ' + subjectQuestions.length + '</span>' +
          '<span class="text-xs px-3 py-1 rounded-full text-white font-medium shadow-sm ' + activeSubject.color + '">Modo Pratica</span>' +
        '</div>' +
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">' +
          '<div class="p-6 md:p-8">' +
            '<h2 class="text-lg md:text-xl font-medium text-slate-900 leading-relaxed mb-8">' + q.text + '</h2>' +
            '<div class="space-y-3" id="optionsContainer" role="group" aria-label="Alternativas da questao">';

      q.options.forEach(function (opt, idx) {
        let btnClass = 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer';
        let iconHTML = '';

        if (isAnswered) {
          btnClass = 'cursor-default ';
          if (idx === q.correctAnswer) {
            btnClass += 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-600';
            iconHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-xl"></i>';
          } else if (idx === quizState.selectedOption) {
            btnClass += 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-600';
            iconHTML = '<i class="fa-solid fa-circle-xmark text-red-600 text-xl"></i>';
          } else {
            btnClass += 'border-slate-300 bg-slate-50 text-slate-500 opacity-70';
          }
        }

        html +=
          '<button type="button" data-option-index="' + idx + '" ' + (isAnswered ? 'disabled' : '') +
          ' class="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left a11y-focus ' + btnClass + '">' +
            '<span class="text-sm md:text-base leading-snug pr-4">' + opt + '</span>' +
            (iconHTML ? '<span class="shrink-0" aria-hidden="true">' + iconHTML + '</span>' : '') +
          '</button>';
      });

      html += '</div></div>';

      if (quizState.showExplanation) {
        const explBg = isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
        const explText = isCorrect ? 'text-emerald-800' : 'text-amber-800';
        const explTitle = isCorrect ? 'Resposta Correta!' : 'Incorreto.';

        html +=
          '<div class="p-6 md:p-8 border-t ' + explBg + '">' +
            '<h4 class="font-bold text-sm uppercase tracking-wider mb-2 ' + explText + '">' + explTitle + '</h4>' +
            '<p class="text-sm text-slate-800 leading-relaxed">' + q.explanation + '</p>' +
            '<div class="mt-6 flex justify-end">' +
              '<button type="button" id="nextQuestionBtn" class="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm a11y-focus">Proxima Questao</button>' +
            '</div>' +
          '</div>';
      }

      html += '</div>';
      quizContainer.innerHTML = html;

      quizContainer.querySelectorAll('[data-option-index]').forEach(function (button) {
        button.addEventListener('click', function () {
          handleOptionClick(Number(button.getAttribute('data-option-index')));
        });
      });

      const nextBtn = document.getElementById('nextQuestionBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
      }
    }

    function handleOptionClick(idx) {
      if (quizState.selectedOption !== null) return;
      quizState.selectedOption = idx;
      quizState.showExplanation = true;
      renderQuiz();
    }

    function nextQuestion() {
      const subjectQuestions = questionsData.filter(function (q) {
        return q.subjectId === activeSubject.id;
      });

      quizState.selectedOption = null;
      quizState.showExplanation = false;
      quizState.currentQIndex = (quizState.currentQIndex + 1) % subjectQuestions.length;
      renderQuiz();
    }
  }

  window.StudyMapApp = { init: init };
})();
