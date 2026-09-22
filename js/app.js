/* Chemistry 1 – Dr. Otter Mission · Vanilla JS */
(function () {
  'use strict';

  const TOTAL_TIERS = 7;
  const STORAGE_PREFIX = 'chem1_otter_';

  const state = {
    name: '',
    tier: 0,
    progress: 0,
    factDone: 0,
    cluesDone: new Set(),
    zonesDone: new Set(),
    sortDone: false,
    matchDone: false,
    mcDone: 0,
    casesDone: new Set(),
    quizIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    startedAt: null,
    factScore: 0,
    clueScore: 0,
    zoneScore: 0,
    labScore: 0,
    caseScore: 0
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Mascot ---- */
  const MASCOT = {
    greeting: 'assets/images/otter-greeting.png',
    thinking: 'assets/images/otter-thinking.png',
    explaining: 'assets/images/otter-explaining.png',
    pointing: 'assets/images/otter-pointing.png',
    celebrating: 'assets/images/otter-celebrating.png',
    sad: 'assets/images/otter-sad.png'
  };

  const LINES = {
    greeting: [
      'Hello, explorer! I’m Dr. Otter. Let’s restore my lab notes together!',
      'Welcome aboard! Your curiosity is already helping me.'
    ],
    thinking: [
      'Hmm… think carefully. Chemistry rewards careful observation.',
      'Take your time. Every clue counts.'
    ],
    explaining: [
      'Here’s the idea: chemistry turns understanding into solutions.',
      'See? Matter, change, and problem-solving are connected.'
    ],
    pointing: [
      'Look here — this is an important connection!',
      'Focus on this part. You’re doing great.'
    ],
    celebrating: [
      'Yes! You helped me restore another piece of the mission!',
      'Fantastic work! I couldn’t have done this without you.',
      'You’re a real Chemistry Explorer!'
    ],
    sad: [
      'Not quite — but mistakes help us learn. Try the next one!',
      'It’s okay. Every scientist revises their thinking.'
    ],
    affirm: [
      'Because of you, my lab notes are clearer. Thank you!',
      'Your careful thinking restored important chemistry ideas.',
      'You helped a fellow scientist today. That’s meaningful work.'
    ]
  };

  function setMascot(scene, customText) {
    const img = $('#mascot-img');
    const fb = $('#mascot-fallback');
    const text = $('#mascot-text');
    if (img) {
      img.style.display = '';
      img.src = MASCOT[scene] || MASCOT.greeting;
      img.onerror = () => { img.style.display = 'none'; if (fb) fb.style.display = 'flex'; };
    }
    if (fb) fb.style.display = 'none';
    const pool = LINES[scene] || LINES.greeting;
    text.textContent = customText || pool[Math.floor(Math.random() * pool.length)];
  }

  function showMascot(show) {
    const p = $('#mascot-panel');
    if (show) p.classList.remove('hidden');
    else p.classList.add('hidden');
  }

  function enableMascotDrag() {
    const panel = $('#mascot-panel');
    if (!panel || panel._dragBound) return;
    panel._dragBound = true;

    let dragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;

    function getPoint(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      // ignore if hidden
      if (panel.classList.contains('hidden')) return;
      const p = getPoint(e);
      const rect = panel.getBoundingClientRect();
      dragging = true;
      panel.classList.add('dragging');
      startX = p.x;
      startY = p.y;
      // switch from bottom/right to left/top for free placement
      origLeft = rect.left;
      origTop = rect.top;
      panel.style.left = origLeft + 'px';
      panel.style.top = origTop + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      const p = getPoint(e);
      let left = origLeft + (p.x - startX);
      let top = origTop + (p.y - startY);
      const maxL = window.innerWidth - panel.offsetWidth - 4;
      const maxT = window.innerHeight - panel.offsetHeight - 4;
      left = Math.max(4, Math.min(left, maxL));
      top = Math.max(4, Math.min(top, maxT));
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      e.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      // remember position for this session
      try {
        localStorage.setItem('chem1_otter_pos', JSON.stringify({
          left: panel.style.left,
          top: panel.style.top
        }));
      } catch (err) {}
    }

    panel.addEventListener('mousedown', onStart);
    panel.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // restore last position if any
    try {
      const saved = JSON.parse(localStorage.getItem('chem1_otter_pos') || 'null');
      if (saved && saved.left && saved.top) {
        panel.style.left = saved.left;
        panel.style.top = saved.top;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    } catch (err) {}
  }



  /* ---- Storage ---- */
  function storageKey(name) {
    return STORAGE_PREFIX + name.trim().toLowerCase().replace(/\s+/g, '_');
  }

  function saveProgress() {
    if (!state.name) return;
    const data = {
      name: state.name,
      tier: state.tier,
      progress: state.progress,
      factDone: state.factDone,
      factScore: state.factScore,
      cluesDone: [...state.cluesDone],
      clueScore: state.clueScore,
      zonesDone: [...state.zonesDone],
      zoneScore: state.zoneScore,
      sortDone: state.sortDone,
      matchDone: state.matchDone,
      mcDone: state.mcDone,
      labScore: state.labScore,
      casesDone: [...state.casesDone],
      caseScore: state.caseScore,
      quizIndex: state.quizIndex,
      quizScore: state.quizScore,
      startedAt: state.startedAt,
      savedAt: Date.now()
    };
    try { localStorage.setItem(storageKey(state.name), JSON.stringify(data)); } catch (e) {}
  }

  function loadProgress(name) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  /* ---- UI helpers ---- */
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = $(`#screen-${id}`);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress(tier, percent) {
    state.tier = tier;
    state.progress = percent;
    const header = $('#progress-header');
    if (tier > 0) {
      header.classList.remove('hidden');
      document.body.classList.add('has-progress');
    }
    $('#tier-label').textContent = `Tier ${Math.min(tier, TOTAL_TIERS)} of ${TOTAL_TIERS}`;
    $('#progress-fill').style.width = percent + '%';
    $('#progress-percent').textContent = percent + '%';
    saveProgress();
  }

  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  function personalize(str) {
    return (str || '').replace(/\[Name\]/g, state.name || 'Explorer');
  }

  /* ================= DATA ================= */

  const facts = [
    { s: 'Everything around us that has mass and occupies space is matter.', fact: true,
      ok: 'Correct, [Name]! Matter is the foundation of chemistry.',
      no: 'Not quite. Matter has mass and occupies space.' },
    { s: 'An element can be broken down into simpler substances by ordinary chemical means.', fact: false,
      ok: 'Right! Elements cannot be broken down by ordinary chemical means.',
      no: 'Actually, elements cannot be broken down further by ordinary chemical reactions.' },
    { s: 'Water (H₂O) is a compound formed from hydrogen and oxygen in a fixed ratio.', fact: true,
      ok: 'Yes! Compounds form when elements combine chemically in definite proportions.',
      no: 'Water is a classic compound — hydrogen and oxygen bonded chemically.' },
    { s: 'A chemical reaction always produces a new substance with different properties.', fact: true,
      ok: 'Exactly. New substances are the hallmark of chemical change.',
      no: 'Chemical reactions rearrange atoms to form new substances.' },
    { s: 'Chemistry is only useful inside laboratories and has little link to daily life.', fact: false,
      ok: 'True — chemistry is everywhere: food, medicine, water, materials.',
      no: 'Chemistry is deeply woven into everyday life, not just the lab.' },
    { s: 'Medicines work through chemical interactions with molecules in the body.', fact: true,
      ok: 'Great! Pharmacology is chemistry applied to health.',
      no: 'Medicines are chemical substances designed to interact with body chemistry.' },
    { s: 'Environmental chemistry has no role in protecting water quality.', fact: false,
      ok: 'Correct. Environmental chemists monitor and protect water and air.',
      no: 'Environmental chemistry actively protects resources like water.' },
    { s: 'Chemistry-related careers include healthcare, environmental work, materials, and pharmaceuticals.', fact: true,
      ok: 'Excellent. Many paths use chemistry to solve real problems.',
      no: 'Chemistry opens doors across health, environment, industry, and research.' }
  ];

  const objects = [
    { id: 'toothpaste', label: 'Toothpaste', emoji: '🦷',
      text: 'Fluoride strengthens enamel. Surfactants and abrasives clean through chemistry.',
      q: 'What does fluoride in toothpaste mainly do?',
      opts: ['Strengthen tooth enamel', 'Change tooth color permanently', 'Replace brushing', 'Add sweetness only'],
      ans: 0 },
    { id: 'soap', label: 'Soap', emoji: '🧼',
      text: 'Soap molecules have a water-loving head and oil-loving tail — they lift grease so water can rinse it away.',
      q: 'Why can soap clean oily hands?',
      opts: ['It has both water-attracting and oil-attracting parts', 'It is only hydrophobic', 'It destroys all chemical bonds', 'It works only in boiling water'],
      ans: 0 },
    { id: 'food', label: 'Food', emoji: '🍎',
      text: 'Cooking involves chemical changes such as the Maillard reaction that create flavor and browning.',
      q: 'Browning of food when cooked is often due to:',
      opts: ['Only the color of the pan', 'Chemical reactions like the Maillard reaction', 'Gravity', 'Magnetic fields'],
      ans: 1 },
    { id: 'medicine', label: 'Medicine', emoji: '💊',
      text: 'Active ingredients are precise chemical compounds that interact with targets in the body.',
      q: 'How do most medicines work?',
      opts: ['Only by their color', 'By changing blood type', 'Through chemical interactions with biological targets', 'By pure physical rest'],
      ans: 2 },
    { id: 'water', label: 'Drinking Water', emoji: '💧',
      text: 'Treatment uses coagulation, disinfection (often chlorine compounds), and pH control.',
      q: 'A key chemical step in making water safe is often:',
      opts: ['Only counting pipes', 'Waiting for rain', 'Ignoring chemistry', 'Disinfection with chlorine compounds'],
      ans: 3 },
    { id: 'battery', label: 'Batteries', emoji: '🔋',
      text: 'Batteries convert chemical energy to electrical energy via redox reactions.',
      q: 'Batteries work mainly because of:',
      opts: ['Gravity alone', 'Only magnetism', 'Redox (oxidation–reduction) chemical reactions', 'Creating energy from nothing'],
      ans: 2 },
    { id: 'cooking', label: 'Cooking', emoji: '🍳',
      text: 'Heat drives chemical changes in proteins, carbohydrates, and fats that affect texture and safety.',
      q: 'Understanding cooking chemistry helps control:',
      opts: ['Only the stove brand', 'Planetary motion', 'None of the above', 'Texture, flavor, and safety'],
      ans: 3 },
    { id: 'cleaner', label: 'Cleaner', emoji: '🧴',
      text: 'Cleaners use acids, bases, surfactants, or oxidizers for specific chemical jobs.',
      q: 'Household cleaners rely on:',
      opts: ['Chosen chemical agents for specific actions', 'Only the bottle shape', 'Astronomy', 'Avoiding all chemistry'],
      ans: 0 }
  ];

  const zoneQuizzes = {
    health: {
      title: 'Health Zone Quiz',
      items: [
        { q: 'Medicines are effective mainly because they:', opts: ['Are always white', 'Interact chemically with targets in the body', 'Ignore molecular structure', 'Work only by taste'], a: 1 },
        { q: 'A career that applies chemistry to medicine quality and dosing is:', opts: ['Orchestra conductor', 'Landscape photographer', 'Pharmacist / pharmaceutical chemist', 'Professional gamer only'], a: 2 }
      ]
    },
    environment: {
      title: 'Environment Zone Quiz',
      items: [
        { q: 'To check if well water is safe after possible contamination, first:', opts: ['Only look at the color from far away', 'Wait a year with no testing', 'Analyze samples for pollutants against safety standards', 'Assume clear water is always safe'], a: 2 },
        { q: 'Environmental chemistry helps protect communities by:', opts: ['Only painting well covers', 'Monitoring and reducing pollutants in water and air', 'Ignoring chemical data', 'Focusing solely on logos'], a: 1 }
      ]
    },
    industry: {
      title: 'Industry Zone Quiz',
      items: [
        { q: 'Designing a lighter, stronger packaging material is mainly an application of chemistry in:', opts: ['Weather forecasting only', 'Pure astronomy', 'Materials / industrial chemistry', 'Avoiding molecules'], a: 2 },
        { q: 'Quality control in industry relies on:', opts: ['Only the product logo', 'Ignoring specifications', 'Random guessing', 'Analytical chemistry to verify purity and composition'], a: 3 }
      ]
    }
  };

  const sortItems = [
    { text: 'Antibiotic tablets', cat: 'health' },
    { text: 'Water purification', cat: 'environment' },
    { text: 'Polymer for packaging', cat: 'industry' },
    { text: 'Baking soda in cooking', cat: 'everyday' },
    { text: 'Vaccine formulation', cat: 'health' },
    { text: 'Oil-spill dispersant', cat: 'environment' },
    { text: 'Fertilizer production', cat: 'industry' },
    { text: 'Soap and detergent', cat: 'everyday' }
  ];

  const matchPairs = [
    { left: 'Drug design & body chemistry', right: 'Health' },
    { left: 'Water testing & pollution control', right: 'Environment' },
    { left: 'Polymers & quality control', right: 'Industry' },
    { left: 'Cooking & household cleaners', right: 'Everyday Life' }
  ];

  const labMC = [
    { q: 'A patient receives a fever medicine. Chemistry is involved because:', opts: ['The tablet color alone cures fever', 'No molecules are involved', 'The drug molecule interacts with biological pathways', 'It changes the patient’s blood type'], a: 2 },
    { q: 'A community has cloudy well water. The most useful first chemical step is:', opts: ['Only count the number of wells', 'Test for pH, chlorine residual, and contaminants', 'Measure sky temperature', 'Ignore chemistry completely'], a: 1 },
    { q: 'A factory wants stronger, lighter packaging. Chemistry helps by:', opts: ['Only changing the logo color', 'Using heavier metal only', 'Avoiding material science', 'Designing polymers with the right structure and additives'], a: 3 }
  ];

  const cases = [
    {
      id: 'health', tag: 'Health', title: 'Unreliable Fever Medicine',
      story: 'A coastal clinic sometimes receives expired or low-quality fever medicine. Families worry about giving children ineffective doses.',
      questions: [
        { q: 'What is the core problem?', opts: ['The clinic needs a new logo', 'Uncertain quality and reliability of fever medicine', 'Patients dislike the color of tablets', 'There are too many chairs'], a: 1 },
        { q: 'Where does chemistry come in?', opts: ['Only the shape of the bottle', 'The color of the walls', 'Analyzing identity, purity, and strength of the active ingredient', 'The number of windows'], a: 2 },
        { q: 'How can chemistry help?', opts: ['Ignoring all chemical tests', 'Focusing only on packaging art', 'Avoiding pharmaceutical knowledge', 'Quality testing and proper formulation of reliable medicines'], a: 3 }
      ]
    },
    {
      id: 'environment', tag: 'Environment', title: 'Metallic-Tasting Well',
      story: 'A farming community notices metallic taste and cloudiness in shared well water after heavy rains. Children have more stomach complaints.',
      questions: [
        { q: 'What is the core problem?', opts: ['The well cover is the wrong color', 'There is too much sunshine', 'Possible contamination of drinking water affecting health', 'The village needs a new sign'], a: 2 },
        { q: 'Where does chemistry come in?', opts: ['Only tasting the water again', 'Detecting metals, nitrates, or other pollutants with chemical tests', 'Counting rainfall days', 'Ignoring lab results'], a: 1 },
        { q: 'How can chemistry help?', opts: ['Assume the water is fine', 'Only paint the well', 'Identify contaminants and guide safe treatment or protection steps', 'Avoid any testing'], a: 2 }
      ]
    },
    {
      id: 'industry', tag: 'Industry', title: 'Safer Food Packaging',
      story: 'A food cooperative wants packaging that still protects products but has lower environmental impact than single-use plastic.',
      questions: [
        { q: 'What is the core problem?', opts: ['The logo font is outdated', 'Workers dislike the factory color', 'There are too many shelves', 'Need for protective packaging with reduced environmental impact'], a: 3 },
        { q: 'Where does chemistry come in?', opts: ['Only the brand name', 'The shape of the building', 'Understanding material properties and designing alternative polymers or coatings', 'Ignoring material science'], a: 2 },
        { q: 'How can chemistry help?', opts: ['Avoid all material knowledge', 'Develop or select materials that balance protection, cost, and environmental impact', 'Focus only on marketing slogans', 'Use heavier metal exclusively'], a: 1 }
      ]
    }
  ];

  const quiz = [
    { q: 'Which statement best defines matter?', c: ['Only substances visible to the eye', 'Anything that has mass and occupies space', 'Energy that can do work', 'Any liquid or gas'], a: 1, e: 'Matter has mass and takes up space.' },
    { q: 'An element is best described as:', c: ['A mixture of two or more substances', 'A compound that always contains oxygen', 'A pure substance that cannot be broken down by ordinary chemical means', 'Any substance found in mixtures'], a: 2, e: 'Elements are the simplest pure substances chemically.' },
    { q: 'Water (H₂O) is a compound because:', c: ['It is a mixture of gases only', 'It can be separated by filtering alone', 'It is an element on the periodic table', 'Hydrogen and oxygen are chemically combined in a fixed ratio'], a: 3, e: 'Compounds form when different elements bond in definite proportions.' },
    { q: 'Key evidence of a chemical reaction is:', c: ['Formation of a new substance with different properties', 'Only a temperature change', 'A change in shape with no new substance', 'Dissolving with no new substance'], a: 0, e: 'New substances define chemical change.' },
    { q: 'A patient takes an antibiotic. Chemistry explains this because:', c: ['The tablet works only by its color', 'The drug interacts with specific targets in bacteria', 'No molecular interaction occurs', 'It permanently changes blood type'], a: 1, e: 'Medicines act through chemical interactions with biological molecules.' },
    { q: 'Chemistry contributes to environmental protection when we:', c: ['Only paint the well cover', 'Ignore chemical data', 'Test water for heavy metals and nitrates', 'Assume all clear water is safe'], a: 2, e: 'Chemical analysis identifies contaminants and guides protection.' },
    { q: 'Developing a lightweight polymer for packaging is mainly chemistry in:', c: ['Only weather forecasting', 'Industry and materials science', 'Astronomy', 'Pure mathematics with no materials'], a: 1, e: 'Materials design is a major industrial application of chemistry.' },
    { q: 'Soap cleans oily hands because soap molecules:', c: ['Are purely hydrophobic', 'Destroy all bonds in oil instantly', 'Have both water-attracting and oil-attracting parts', 'Work only if water is boiling'], a: 2, e: 'Amphiphilic structure lets soap emulsify oils for rinsing.' },
    { q: 'A career that uses chemistry for medicine safety and dosing is:', c: ['Professional athlete only', 'Landscape photographer', 'Orchestra conductor', 'Pharmacist or pharmaceutical chemist'], a: 3, e: 'Pharmacists apply chemical knowledge to medicine quality and safety.' },
    { q: 'After a factory spill into a river, a useful first chemical step is:', c: ['Analyze samples for pollutants and compare with standards', 'Only observe color from a distance', 'Wait one year without testing', 'Assume no chemical components'], a: 0, e: 'Targeted analysis identifies contaminants and guides action.' },
    { q: 'Batteries power devices because they:', c: ['Create energy from nothing', 'Work only by gravity', 'Convert chemical energy to electrical energy via redox reactions', 'Rely solely on magnetism with no chemistry'], a: 2, e: 'Batteries are electrochemical devices.' },
    { q: 'Understanding body chemistry matters in a medical program because:', c: ['The body contains no chemical substances', 'Metabolism, signaling, and drug action are chemical processes', 'Chemistry is irrelevant to health', 'Only physics explains biology'], a: 1, e: 'Physiology and medicine rest on chemical understanding.' },
    { q: 'Adding a preservative to food relies on knowledge of:', c: ['Only the package shape', 'The brand logo', 'Astronomy', 'Chemical reactions that cause spoilage and how to slow them'], a: 3, e: 'Preservatives work through chemistry against spoilage reactions.' },
    { q: 'The best summary of chemistry’s role in real-world problems is:', c: ['Chemistry is only for memorizing the periodic table', 'Chemistry has no link to health or environment', 'Chemistry helps us understand matter and use that understanding to develop solutions', 'Chemistry is limited to decorative experiments'], a: 2, e: 'Understanding matter becomes problem-solving power.' },
    { q: 'Which is a chemistry-related career path?', c: ['Only professional video gaming', 'Environmental chemist monitoring water quality', 'Sports coaching with no science', 'Fashion modeling unrelated to materials'], a: 1, e: 'Environmental chemistry is one of many applied chemistry careers.' }
  ];

  /* ================= RENDERERS  /* ================= RENDERERS ================= */

  function renderFacts() {
    const box = $('#fact-container');
    box.innerHTML = '';
    facts.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'fact-card';
      card.dataset.i = i;
      card.innerHTML = `
        <p class="statement">${item.s}</p>
        <div class="fact-actions">
          <button class="btn-fact" data-a="fact">Fact</button>
          <button class="btn-myth" data-a="myth">Myth</button>
        </div>
        <div class="fact-feedback"></div>`;
      box.appendChild(card);
    });
    box.onclick = (e) => {
      const btn = e.target.closest('[data-a]');
      if (!btn) return;
      const card = btn.closest('.fact-card');
      if (card.classList.contains('answered')) return;
      const i = +card.dataset.i;
      const item = facts[i];
      const saidFact = btn.dataset.a === 'fact';
      const correct = saidFact === item.fact;
      card.classList.add('answered');
      $$('[data-a]', card).forEach(b => b.disabled = true);
      const fb = $('.fact-feedback', card);
      fb.classList.add('show', correct ? 'correct' : 'incorrect');
      fb.textContent = personalize(correct ? item.ok : item.no);
      if (correct) { state.factScore++; setMascot('celebrating'); }
      else setMascot('sad');
      state.factDone++;
      if (state.factDone >= facts.length) {
        $('#btn-fact-next').classList.remove('hidden');
        updateProgress(2, 20);
        setMascot('celebrating', personalize('All facts checked, [Name]! Tier unlocked.'));
      }
      saveProgress();
    };
  }

  function renderClues() {
    const grid = $('#object-grid');
    grid.innerHTML = '';
    objects.forEach(o => {
      const b = document.createElement('button');
      b.className = 'object-card' + (state.cluesDone.has(o.id) ? ' done' : '');
      b.dataset.id = o.id;
      b.innerHTML = `<div class="obj-icon">${o.emoji}</div><div class="obj-label">${o.label}</div>`;
      grid.appendChild(b);
    });
    const panel = $('#clue-panel');
    grid.onclick = (e) => {
      const card = e.target.closest('.object-card');
      if (!card) return;
      const o = objects.find(x => x.id === card.dataset.id);
      if (!o || state.cluesDone.has(o.id)) return;
      setMascot('explaining');
      panel.classList.remove('hidden');
      panel.innerHTML = `
        <h4>${o.label}</h4>
        <p>${o.text}</p>
        <p class="clue-q">${o.q}</p>
        <div class="clue-opts">
          ${o.opts.map((t, j) => `<button class="clue-opt" data-j="${j}">${t}</button>`).join('')}
        </div>`;
      panel.onclick = (ev) => {
        const opt = ev.target.closest('.clue-opt');
        if (!opt || opt.disabled) return;
        const j = +opt.dataset.j;
        const correct = j === o.ans;
        $$('.clue-opt', panel).forEach(b => {
          b.disabled = true;
          if (+b.dataset.j === o.ans) b.classList.add('correct');
        });
        if (!correct) opt.classList.add('wrong');
        if (correct) { state.clueScore++; setMascot('celebrating'); }
        else setMascot('sad');
        state.cluesDone.add(o.id);
        card.classList.add('done');
        if (state.cluesDone.size >= objects.length) {
          $('#btn-clues-next').classList.remove('hidden');
          updateProgress(3, 35);
          setMascot('celebrating', personalize('All clues solved, [Name]! Map unlocked.'));
        }
        saveProgress();
      };
    };
  }

  function renderZones() {
    state.zonesDone.forEach(z => {
      const card = $(`#zone-${z}`);
      if (card) {
        card.classList.add('completed');
        $(`#status-${z}`).textContent = 'Completed ✓';
      }
    });
    if (state.zonesDone.size >= 3) {
      $('#btn-map-next').classList.remove('hidden');
    }

    $$('.zone-card').forEach(btn => {
      btn.onclick = () => {
        const zone = btn.dataset.zone;
        if (state.zonesDone.has(zone)) {
          toast('You already completed this zone.');
          return;
        }
        setMascot('pointing');
        const data = zoneQuizzes[zone];
        const quizEl = $('#zone-quiz');
        quizEl.classList.remove('hidden');
        let answered = 0;
        let localScore = 0;
        quizEl.innerHTML = `<h3>${data.title}</h3>` + data.items.map((it, idx) => `
          <div class="zq-item" data-idx="${idx}">
            <p>${it.q}</p>
            <div class="zq-opts">
              ${it.opts.map((t, j) => `<button class="zq-opt" data-j="${j}" data-a="${it.a}">${t}</button>`).join('')}
            </div>
          </div>`).join('');

        quizEl.onclick = (e) => {
          const opt = e.target.closest('.zq-opt');
          if (!opt || opt.disabled) return;
          const item = opt.closest('.zq-item');
          if (item.dataset.done) return;
          const j = +opt.dataset.j;
          const correct = j === +opt.dataset.a;
          $$('.zq-opt', item).forEach(b => {
            b.disabled = true;
            if (+b.dataset.j === +b.dataset.a) b.classList.add('correct');
          });
          if (!correct) opt.classList.add('wrong');
          if (correct) { localScore++; setMascot('celebrating'); }
          else setMascot('sad');
          item.dataset.done = '1';
          answered++;
          if (answered >= data.items.length) {
            state.zonesDone.add(zone);
            state.zoneScore += localScore;
            btn.classList.add('completed');
            $(`#status-${zone}`).textContent = 'Completed ✓';
            if (state.zonesDone.size >= 3) {
              $('#btn-map-next').classList.remove('hidden');
              updateProgress(4, 50);
              setMascot('celebrating', personalize('All zones explored, [Name]! Challenge Lab unlocked.'));
            }
            saveProgress();
          }
        };
      };
    });
  }

  function renderSort() {
    const box = $('#sort-items');
    box.innerHTML = '';
    const shuffled = [...sortItems].sort(() => Math.random() - 0.5);
    shuffled.forEach(it => {
      const b = document.createElement('button');
      b.className = 'sort-item';
      b.textContent = it.text;
      b.dataset.cat = it.cat;
      box.appendChild(b);
    });
    let selItem = null, selCat = null;
    box.onclick = (e) => {
      const it = e.target.closest('.sort-item');
      if (!it || it.classList.contains('sorted')) return;
      $$('.sort-item').forEach(x => x.classList.remove('selected'));
      it.classList.add('selected');
      selItem = it;
      trySort();
    };
    $('#sort-categories').onclick = (e) => {
      const c = e.target.closest('.sort-cat');
      if (!c) return;
      $$('.sort-cat').forEach(x => x.classList.remove('selected'));
      c.classList.add('selected');
      selCat = c.dataset.cat;
      trySort();
    };
    function trySort() {
      if (!selItem || !selCat) return;
      const ok = selItem.dataset.cat === selCat;
      const fb = $('#sort-feedback');
      if (ok) {
        selItem.classList.add('sorted');
        selItem.classList.remove('selected');
        fb.className = 'feedback-msg ok';
        fb.textContent = `Correct! “${selItem.textContent}” → ${selCat}`;
        state.labScore++;
        setMascot('celebrating');
        selItem = null; selCat = null;
        $$('.sort-cat').forEach(x => x.classList.remove('selected'));
        if ($$('.sort-item:not(.sorted)').length === 0) {
          state.sortDone = true;
          fb.textContent = 'Station A complete!';
          $('#station-match').classList.remove('hidden');
          setMascot('pointing', 'Station B is ready. Matching next!');
          checkLabDone();
        }
      } else {
        fb.className = 'feedback-msg err';
        fb.textContent = `Not that category. Try another.`;
        setMascot('thinking');
      }
      saveProgress();
    }
  }

  function renderMatch() {
    const board = $('#match-board');
    const lefts = [...matchPairs].sort(() => Math.random() - 0.5);
    const rights = [...matchPairs].map(p => p.right).sort(() => Math.random() - 0.5);
    board.innerHTML = `
      <div class="match-left">${lefts.map((p, i) => `<button class="match-item" data-i="${i}" data-right="${p.right}">${p.left}</button>`).join('')}</div>
      <div class="match-right">${rights.map(r => `<button class="match-cat" data-right="${r}">${r}</button>`).join('')}</div>`;
    let selL = null, selR = null, matched = 0;
    board.onclick = (e) => {
      const left = e.target.closest('.match-item');
      const right = e.target.closest('.match-cat');
      if (left && !left.classList.contains('matched')) {
        $$('.match-item').forEach(x => x.classList.remove('selected'));
        left.classList.add('selected');
        selL = left;
      }
      if (right && !right.classList.contains('matched')) {
        $$('.match-cat').forEach(x => x.classList.remove('selected'));
        right.classList.add('selected');
        selR = right;
      }
      if (selL && selR) {
        const ok = selL.dataset.right === selR.dataset.right;
        const fb = $('#match-feedback');
        if (ok) {
          selL.classList.add('matched');
          selR.classList.add('matched');
          selL.classList.remove('selected');
          selR.classList.remove('selected');
          matched++;
          state.labScore++;
          fb.className = 'feedback-msg ok';
          fb.textContent = 'Match correct!';
          setMascot('celebrating');
          selL = null; selR = null;
          if (matched >= matchPairs.length) {
            state.matchDone = true;
            fb.textContent = 'Station B complete!';
            $('#station-mc').classList.remove('hidden');
            setMascot('pointing', 'Final station: scenario questions.');
            checkLabDone();
          }
        } else {
          fb.className = 'feedback-msg err';
          fb.textContent = 'Not a match. Try again.';
          setMascot('thinking');
          selL.classList.remove('selected');
          selR.classList.remove('selected');
          selL = null; selR = null;
        }
        saveProgress();
      }
    };
  }

  function renderLabMC() {
    const list = $('#mc-list');
    list.innerHTML = '';
    labMC.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'mc-item';
      div.dataset.i = i;
      div.innerHTML = `
        <h4>${item.q}</h4>
        <div class="mc-opts">
          ${item.opts.map((t, j) => `<button class="mc-opt" data-j="${j}">${t}</button>`).join('')}
        </div>`;
      list.appendChild(div);
    });
    list.onclick = (e) => {
      const opt = e.target.closest('.mc-opt');
      if (!opt || opt.disabled) return;
      const itemEl = opt.closest('.mc-item');
      if (itemEl.dataset.done) return;
      const i = +itemEl.dataset.i;
      const j = +opt.dataset.j;
      const correct = j === labMC[i].a;
      $$('.mc-opt', itemEl).forEach(b => {
        b.disabled = true;
        if (+b.dataset.j === labMC[i].a) b.classList.add('correct');
      });
      if (!correct) opt.classList.add('wrong');
      if (correct) { state.labScore++; setMascot('celebrating'); }
      else setMascot('sad');
      itemEl.dataset.done = '1';
      state.mcDone++;
      if (state.mcDone >= labMC.length) {
        checkLabDone();
      }
      saveProgress();
    };
  }

  function checkLabDone() {
    if (state.sortDone && state.matchDone && state.mcDone >= labMC.length) {
      $('#btn-lab-next').classList.remove('hidden');
      updateProgress(5, 70);
      setMascot('celebrating', personalize('Challenge Lab cleared, [Name]! Case Files unlocked.'));
    }
  }

  function renderCases() {
    const box = $('#case-container');
    box.innerHTML = '';
    cases.forEach(c => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.dataset.id = c.id;
      let html = `<span class="case-tag">${c.tag}</span><h3>${c.title}</h3><p class="case-story">${c.story}</p>`;
      c.questions.forEach((qq, qi) => {
        html += `<p class="case-q">${qi + 1}. ${qq.q}</p><div class="case-opts" data-qi="${qi}">
          ${qq.opts.map((t, j) => `<button class="case-opt" data-j="${j}" data-a="${qq.a}">${t}</button>`).join('')}
        </div>`;
      });
      card.innerHTML = html;
      box.appendChild(card);
    });

    box.onclick = (e) => {
      const opt = e.target.closest('.case-opt');
      if (!opt || opt.disabled) return;
      const optsRow = opt.closest('.case-opts');
      if (optsRow.dataset.done) return;
      const j = +opt.dataset.j;
      const correct = j === +opt.dataset.a;
      $$('.case-opt', optsRow).forEach(b => {
        b.disabled = true;
        if (+b.dataset.j === +b.dataset.a) b.classList.add('correct');
      });
      if (!correct) opt.classList.add('wrong');
      if (correct) { state.caseScore++; setMascot('celebrating'); }
      else setMascot('sad');
      optsRow.dataset.done = '1';

      const card = opt.closest('.case-card');
      const allRows = $$('.case-opts', card);
      if (allRows.every(r => r.dataset.done)) {
        state.casesDone.add(card.dataset.id);
        if (state.casesDone.size >= cases.length) {
          $('#btn-cases-next').classList.remove('hidden');
          updateProgress(6, 85);
          setMascot('celebrating', personalize('All case files solved, [Name]! Final Assessment unlocked.'));
        }
      }
      saveProgress();
    };
  }

  function renderQuiz() {
    const container = $('#quiz-container');
    const resultEl = $('#quiz-result');
    resultEl.classList.add('hidden');
    container.classList.remove('hidden');

    function showQ() {
      if (state.quizIndex >= quiz.length) {
        container.classList.add('hidden');
        const pct = Math.round((state.quizScore / quiz.length) * 100);
        let msg;
        if (pct >= 85) msg = `Outstanding, ${state.name}! Strong mastery of chemistry in daily life.`;
        else if (pct >= 70) msg = `Solid work, ${state.name}. You can apply the main ideas well.`;
        else if (pct >= 50) msg = `Good effort, ${state.name}. Review the tiers you found harder.`;
        else msg = `${state.name}, keep exploring. Revisit earlier tiers and try again.`;
        resultEl.innerHTML = `<h3>Assessment Complete</h3><div class="big-score">${state.quizScore} / ${quiz.length}</div><p style="font-size:1.15rem;margin-bottom:.6rem">${pct}%</p><p style="color:var(--text-muted)">${msg}</p>`;
        resultEl.classList.remove('hidden');
        $('#btn-final-next').classList.remove('hidden');
        updateProgress(7, 100);
        setMascot(pct >= 70 ? 'celebrating' : 'thinking');
        saveProgress();
        return;
      }
      const item = quiz[state.quizIndex];
      $('#q-num').textContent = state.quizIndex + 1;
      state.quizAnswered = false;
      setMascot('thinking');
      container.innerHTML = `
        <p class="q-text">${item.q}</p>
        <div class="quiz-options">
          ${item.c.map((t, i) => `<button class="quiz-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${t}</button>`).join('')}
        </div>
        <div class="quiz-feedback"></div>`;
      $$('.quiz-opt', container).forEach(btn => {
        btn.onclick = () => {
          if (state.quizAnswered) return;
          state.quizAnswered = true;
          const chosen = +btn.dataset.i;
          const correct = chosen === item.a;
          $$('.quiz-opt', container).forEach(b => {
            b.disabled = true;
            if (+b.dataset.i === item.a) b.classList.add('correct');
          });
          if (!correct) btn.classList.add('wrong');
          if (correct) { state.quizScore++; setMascot('celebrating'); }
          else setMascot('sad');
          const fb = $('.quiz-feedback', container);
          fb.classList.add('show', correct ? 'correct' : 'incorrect');
          fb.innerHTML = (correct ? '<strong>Correct!</strong> ' : '<strong>Not quite.</strong> ') + item.e;
          saveProgress();
          setTimeout(() => { state.quizIndex++; showQ(); }, 2000);
        };
      });
    }
    showQ();
  }

  function showReport() {
    const pct = Math.round((state.quizScore / quiz.length) * 100);
    $('#report-name').textContent = `Mission complete, ${state.name}!`;
    $('#final-score').textContent = `${state.quizScore} / ${quiz.length}`;
    $('#final-percent').textContent = pct + '%';

    const body = $('#report-body');
    body.innerHTML = `
      <h3>Mission Report</h3>
      <ul>
        <li><strong>Explorer:</strong> ${state.name}</li>
        <li><strong>Fact Check:</strong> ${state.factScore} / ${facts.length}</li>
        <li><strong>Everyday Clues:</strong> ${state.clueScore} / ${objects.length}</li>
        <li><strong>Zone Quizzes:</strong> ${state.zoneScore} correct</li>
        <li><strong>Challenge Lab:</strong> ${state.labScore} correct actions</li>
        <li><strong>Case Files:</strong> ${state.caseScore} correct choices</li>
        <li><strong>Final Assessment:</strong> ${state.quizScore} / ${quiz.length} (${pct}%)</li>
      </ul>`;

    const affirm = LINES.affirm[Math.floor(Math.random() * LINES.affirm.length)];
    $('#otter-affirmation').textContent = `Dr. Otter says: “${affirm}”`;
    setMascot('celebrating', affirm);
    showScreen('report');
    saveProgress();
  }

  /* ================= NAV & INIT ================= */

  function bindNav() {
    $('#btn-start').onclick = () => {
      const name = $('#learner-name').value.trim();
      if (name.length < 2) { toast('Please enter your complete name.'); return; }
      state.name = name;
      state.startedAt = state.startedAt || Date.now();
      const saved = loadProgress(name);
      if (saved && saved.tier > 0 && saved.progress < 100) {
        // Resume option handled simply: continue from story if they want fresh, or jump
        // For simplicity we always start story but keep scores if they finished parts
        Object.assign(state, {
          factDone: saved.factDone || 0,
          factScore: saved.factScore || 0,
          cluesDone: new Set(saved.cluesDone || []),
          clueScore: saved.clueScore || 0,
          zonesDone: new Set(saved.zonesDone || []),
          zoneScore: saved.zoneScore || 0,
          sortDone: !!saved.sortDone,
          matchDone: !!saved.matchDone,
          mcDone: saved.mcDone || 0,
          labScore: saved.labScore || 0,
          casesDone: new Set(saved.casesDone || []),
          caseScore: saved.caseScore || 0,
          quizIndex: saved.quizIndex || 0,
          quizScore: saved.quizScore || 0,
          startedAt: saved.startedAt || Date.now()
        });
      }
      showMascot(true);
      setMascot('greeting', personalize(`Welcome, [Name]! I’m glad you’re here.`));
      updateProgress(1, 5);
      showScreen('story');
      toast(`Welcome, ${state.name}!`);
    };

    $('#learner-name').oninput = (e) => {
      const name = e.target.value.trim();
      $('#btn-start').disabled = name.length < 2;
      const saved = name.length >= 2 ? loadProgress(name) : null;
      const hint = $('#resume-hint');
      if (saved && saved.progress > 0) {
        hint.classList.remove('hidden');
        hint.textContent = `Saved progress found (${saved.progress}%). Starting continues your record.`;
      } else {
        hint.classList.add('hidden');
      }
    };
    $('#learner-name').onkeydown = (e) => {
      if (e.key === 'Enter' && !$('#btn-start').disabled) $('#btn-start').click();
    };

    $('#btn-story-next').onclick = () => {
      showScreen('factcheck');
      renderFacts();
      setMascot('pointing', 'Let’s check facts and myths first.');
      updateProgress(2, 10);
    };

    $('#btn-fact-next').onclick = () => {
      showScreen('clues');
      renderClues();
      setMascot('explaining', 'Everyday objects hide chemistry. Tap each one.');
    };

    $('#btn-clues-next').onclick = () => {
      showScreen('map');
      renderZones();
      setMascot('pointing', 'Explore all three zones to unlock the lab.');
    };

    $('#btn-map-next').onclick = () => {
      showScreen('lab');
      renderSort();
      renderMatch();
      renderLabMC();
      if (state.sortDone) $('#station-match').classList.remove('hidden');
      if (state.matchDone) $('#station-mc').classList.remove('hidden');
      checkLabDone();
      setMascot('thinking', 'Challenge Lab: sorting, matching, then scenarios.');
    };

    $('#btn-lab-next').onclick = () => {
      showScreen('cases');
      renderCases();
      setMascot('explaining', 'Real cases — choose the best answers.');
    };

    $('#btn-cases-next').onclick = () => {
      showScreen('final');
      if (state.quizIndex >= quiz.length) state.quizIndex = 0; // allow retake display if needed
      renderQuiz();
      setMascot('thinking', 'Final Assessment. You’ve got this.');
    };

    $('#btn-final-next').onclick = () => showReport();

    $('#btn-restart').onclick = () => {
      if (state.name) {
        try { localStorage.removeItem(storageKey(state.name)); } catch (e) {}
      }
      location.reload();
    };
  }

  function init() {
    bindNav();
    enableMascotDrag();
    $('#btn-start').disabled = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
