/* =========================================================
   HOME NAVIGATION MEMORY
   Returning Home from another page skips the opening animation.
   ========================================================= */

(function(){

  document.addEventListener('click', function(e){

    const a = e.target.closest && e.target.closest('a[href]');
    if(!a) return;

    const raw = a.getAttribute('href') || '';

    if(
      !raw ||
      raw.startsWith('#') ||
      raw.startsWith('mailto:') ||
      raw.startsWith('tel:') ||
      a.target === '_blank'
    ) return;

    try{

      const u = new URL(raw, location.href);

      const isHome =
        u.origin === location.origin &&
        (u.pathname === '/' || u.pathname.endsWith('/index.html'));

      const onHome =
        location.pathname === '/' ||
        location.pathname.endsWith('/index.html');

      if(isHome && !onHome){

        e.preventDefault();

        const target =
          u.pathname +
          '?skipHomeIntro=1' +
          (u.hash || '');

        location.href = target;
      }

    }catch(_){}

  }, true);

})();


/* =========================================================
   MR VISUALCRAFT THEME CONTROL
   ========================================================= */

(function(){

  const saved = localStorage.getItem('mrvc_theme');

  if(saved === 'light'){
    document.documentElement.classList.add('light-theme');
  }

  function mountThemeToggle(){

    const actions = document.querySelector('.navActions');

    if(!actions || actions.querySelector('.themeToggle')) return;

    const b = document.createElement('button');

    b.className = 'themeToggle';
    b.type = 'button';

    b.setAttribute(
      'aria-label',
      'Toggle dark and light theme'
    );

    b.title = 'Toggle dark / light mode';

    b.innerHTML =
      '<span class="moon" aria-hidden="true">☾</span>' +
      '<span class="sun" aria-hidden="true">☀</span>';

    const first = actions.querySelector('.btn');

    actions.insertBefore(
      b,
      first || actions.firstChild
    );

    b.addEventListener('click', () => {

      const light =
        document.documentElement.classList.toggle(
          'light-theme'
        );

      localStorage.setItem(
        'mrvc_theme',
        light ? 'light' : 'dark'
      );

    });

  }

  if(document.readyState === 'loading'){

    document.addEventListener(
      'DOMContentLoaded',
      mountThemeToggle
    );

  }else{

    mountThemeToggle();

  }

})();


/* =========================================================
   MAIN SITE JAVASCRIPT
   ========================================================= */

(function(){

  const $ = s => document.querySelector(s);

  const path =
    location.pathname.replace(/\\/g, '/');


  /* Active navigation link */

  const active =
    [...document.querySelectorAll('.links a')].find(a =>

      a.getAttribute('href') === path ||

      (
        path.startsWith('/work/') &&
        a.getAttribute('href') === '/work'
      ) ||

      (
        path.startsWith('/services/') &&
        a.getAttribute('href') === '/services'
      )

    );

  if(active){
    active.classList.add('active');
  }


  /* Cursor glow */

  const glow =
    document.createElement('div');

  glow.className = 'cursorGlow';

  document.body.appendChild(glow);

  document.addEventListener('pointermove', e => {

    glow.style.left =
      e.clientX + 'px';

    glow.style.top =
      e.clientY + 'px';

  });


  /* Scroll reveal animations */

  const obs =
    new IntersectionObserver(

      es =>
        es.forEach(e =>
          e.isIntersecting &&
          e.target.classList.add('in')
        ),

      {
        threshold: .08
      }

    );

  document
    .querySelectorAll(
      '.reveal,.card,.panel,.step,.pageHero,.section'
    )
    .forEach((e, i) => {

      e.classList.add('reveal');

      e.style.transitionDelay =
        (Math.min(i, 8) * 45) + 'ms';

      obs.observe(e);

    });


  /* =========================================================
     MOBILE MENU
     ========================================================= */

  const ham = $('.hamb');
  const nav = $('.links');

  if(ham && nav){

    ham.setAttribute(
      'aria-expanded',
      'false'
    );


    function closeMenu(){

      nav.classList.remove('open');

      ham.setAttribute(
        'aria-expanded',
        'false'
      );

    }


    ham.addEventListener('click', e => {

      e.preventDefault();
      e.stopPropagation();

      const isOpen =
        nav.classList.toggle('open');

      ham.setAttribute(
        'aria-expanded',
        isOpen ? 'true' : 'false'
      );

    });


    nav.addEventListener('click', e => {

      if(e.target.closest('a')){
        closeMenu();
      }

    });


    document.addEventListener('click', e => {

      if(
        nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !ham.contains(e.target)
      ){

        closeMenu();

      }

    });


    window.addEventListener('resize', () => {

      if(window.innerWidth > 760){
        closeMenu();
      }

    });

  }


  /* =========================================================
     CONTACT FORM
     ========================================================= */

  const form =
    $('#contactForm');

  if(form){

    const status =
      $('#formStatus');


    const pending = () =>
      JSON.parse(
        localStorage.getItem('mrvc_pending') || '[]'
      );


    const save = x =>
      localStorage.setItem(
        'mrvc_pending',
        JSON.stringify(x)
      );


    async function flush(){

      let q = pending();

      if(!q.length) return;


      for(const item of [...q]){

        try{

          const r =
            await fetch(
              (
                location.protocol === 'file:'
                  ? 'http://localhost:3000'
                  : ''
              ) + '/api/contact',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(item)
              }
            );


          if(r.ok){

            q =
              q.filter(
                x => x !== item
              );

          }

        }catch(e){

          break;

        }

      }


      save(q);

    }


    flush();


    form.addEventListener(
      'submit',
      async e => {

        e.preventDefault();


        const x =
          Object.fromEntries(
            new FormData(form).entries()
          );


        status.textContent =
          'Sending…';


        try{

          const r =
            await fetch(
              (
                location.protocol === 'file:'
                  ? 'http://localhost:3000'
                  : ''
              ) + '/api/contact',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(x)
              }
            );


          if(!r.ok){
            throw new Error();
          }


          status.textContent =
            'Message sent successfully.';

          form.reset();


        }catch(err){

          const q =
            pending();

          q.push(x);

          save(q);


          status.textContent =
            'Saved offline — it will sync when the backend is available.';

        }

      }
    );

  }


  /* =========================================================
     ADMIN MESSAGES
     ========================================================= */

  const admin =
    $('#adminList');

  if(admin){

    fetch(
      (
        location.protocol === 'file:'
          ? 'http://localhost:3000'
          : ''
      ) + '/api/messages'
    )

    .then(r => r.json())

    .then(items => {

      admin.innerHTML =
        items.length

          ? items.map(x => `

              <article class="panel">

                <strong>
                  ${escape(x.name)}
                </strong>

                <div>

                  ${escape(x.email)}

                  ${
                    x.phone
                      ? ' · ' + escape(x.phone)
                      : ''
                  }

                  ·

                  ${new Date(
                    x.createdAt
                  ).toLocaleString()}

                </div>

                <p>

                  ${
                    x.project
                      ? '<strong>Project:</strong> ' +
                        escape(x.project) +
                        '<br>'
                      : ''
                  }

                  ${escape(x.message)}

                </p>

              </article>

            `).join('')

          : '<div class="panel">No messages yet.</div>';

    })

    .catch(() => {

      admin.innerHTML =
        '<div class="panel">Backend unavailable.</div>';

    });

  }


  /* Escape HTML */

  function escape(s){

    return String(s || '').replace(
      /[&<>"']/g,

      m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m])

    );

  }

})();


/* =========================================================
   PROJECT SLIDER
   ========================================================= */

const slides =
  document.querySelector('#slides');

if(slides){

  let i = 0;

  const dots =
    [
      ...document.querySelectorAll(
        '[data-slide]'
      )
    ];


  const go = n => {

    i = (n + 3) % 3;

    slides.style.transform =
      `translateX(-${i * 100}%)`;


    dots.forEach(
      (d, k) =>
        d.classList.toggle(
          'on',
          k === i
        )
    );

  };


  dots.forEach(
    d =>
      d.onclick =
        () => go(+d.dataset.slide)
  );


  const prev =
    document.querySelector('#prev');

  const next =
    document.querySelector('#next');


  if(prev){

    prev.onclick =
      () => go(i - 1);

  }


  if(next){

    next.onclick =
      () => go(i + 1);

  }


  setInterval(
    () => go(i + 1),
    6500
  );

}


/* =========================================================
   CV PRINT SHORTCUT
   ========================================================= */

document.addEventListener(
  'keydown',
  e => {

    if(
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === 'p' &&
      document.body.classList.contains('cvBody')
    ){

      e.preventDefault();

      window.print();

    }

  }
);


/* =========================================================
   DESKTOP PROJECT CARD POINTER LIGHTING
   ========================================================= */

(function(){

  if(
    window.matchMedia(
      '(pointer:fine)'
    ).matches
  ){

    document
      .querySelectorAll(
        '.luxWorkGrid .workCard'
      )
      .forEach(card => {

        card.addEventListener(
          'pointermove',
          e => {

            const r =
              card.getBoundingClientRect();


            card.style.setProperty(
              '--mx',
              (
                (e.clientX - r.left) /
                r.width *
                100
              ) + '%'
            );


            card.style.setProperty(
              '--my',
              (
                (e.clientY - r.top) /
                r.height *
                100
              ) + '%'
            );

          }
        );

      });

  }

})();


/* =========================================================
   OPENING INTRO + SMOOTH HERO TYPEWRITER

   Fresh/direct Home visit or browser refresh:
   - Play opening intro
   - Then type Hero text smoothly

   Internal navigation back to Home:
   - Skip opening intro
   - Show finished Hero immediately

   ========================================================= */

(function(){

  const intro =
    document.getElementById('typingIntro');

  const introText =
    document.getElementById('typingText');

  const hero =
    document.querySelector('.heroTitleType');


  if(!intro || !introText || !hero) return;


  const reduce =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  const navEntry =
    performance.getEntriesByType('navigation')[0];

  const navType =
    navEntry
      ? navEntry.type
      : 'navigate';


  const ref =
    document.referrer || '';


  let sameOriginRef = false;

  try{

    sameOriginRef =
      ref
        ? new URL(ref).origin === location.origin
        : false;

  }catch(e){}


  /*
    URL flag from Home navigation.
  */

  const urlParams =
    new URLSearchParams(
      location.search
    );


  const skipFromURL =
    urlParams.get('skipHomeIntro') === '1';


  /*
    Clean the URL so the flag does not stay visible.
  */

  if(skipFromURL){

    const cleanURL =
      location.pathname +
      (location.hash || '');

    history.replaceState(
      {},
      document.title,
      cleanURL
    );

  }


  /*
    Browser refresh = play.
    Direct Home visit = play.
    Internal navigation = skip.
  */

  const shouldPlayIntro =
    !skipFromURL &&
    (
      navType === 'reload' ||
      !sameOriginRef
    );


  const introLine =
    'UBAIDULLAH  •  DESIGN  •  DIGITAL  •  AI';


  /* =========================================================
     SHOW HERO IMMEDIATELY
     ========================================================= */

  const showHeroImmediately = () => {

    hero
      .querySelectorAll('.heroTypeCursor')
      .forEach(x => x.remove());


    hero
      .querySelectorAll('.typeChar')
      .forEach(x => {

        x.classList.add('shown');

        x.style.animation = 'none';

      });


    /*
      If original HTML contains normal text,
      make sure it remains visible.
    */

    hero.dataset.typingStarted = '1';

    hero.classList.add(
      'typingStarted',
      'typingDone'
    );

  };


  /* =========================================================
     FINISH INTRO
     ========================================================= */

  const finishIntro = () => {

    intro.classList.add('hide');

    window.dispatchEvent(
      new Event('mrvcIntroDone')
    );

  };


  /* =========================================================
     SMOOTH HERO TYPEWRITER
     ========================================================= */

  const startHeroTyping = () => {

    if(
      hero.dataset.typingStarted === '1'
    ) return;


    hero.dataset.typingStarted = '1';


    const parts =
      [...hero.querySelectorAll('.typeWord')];


    if(!parts.length){

      hero.classList.add(
        'typingStarted',
        'typingDone'
      );

      return;

    }


    /*
      Save the original text BEFORE clearing it.
    */

    const words =
      parts.map(
        part => part.textContent
      );


    /*
      Clear old text and old cursor.
    */

    hero
      .querySelectorAll('.heroTypeCursor')
      .forEach(x => x.remove());


    parts.forEach(
      part => {
        part.textContent = '';
      }
    );


    /*
      Create cursor at the end of the final word.
    */

    const finalPart =
      parts[parts.length - 1];


    const cursor =
      document.createElement('span');

    cursor.className =
      'heroTypeCursor';

    cursor.setAttribute(
      'aria-hidden',
      'true'
    );


    finalPart.appendChild(cursor);


    hero.classList.add(
      'typingStarted'
    );


    /*
      Reduced-motion users:
      show everything immediately.
    */

    if(reduce){

      parts.forEach(
        (part, index) => {

          part.textContent =
            words[index] || '';

        }
      );


      finalPart.appendChild(cursor);


      hero.classList.add(
        'typingDone'
      );


      return;

    }


    /*
      Smooth real letter-by-letter typing.

      58ms = smooth enough to see every letter
      without feeling too slow.
    */

    const speed = 58;

    const pauseBetweenWords = 110;


    let partIndex = 0;
    let charIndex = 0;


    const typeNext = () => {

      if(partIndex >= parts.length){

        hero.classList.add(
          'typingDone'
        );

        return;

      }


      const part =
        parts[partIndex];

      const text =
        words[partIndex] || '';


      /*
        Still typing current word.
      */

      if(charIndex < text.length){

        const span =
          document.createElement('span');


        span.className =
          'typeChar shown';


        span.textContent =
          text[charIndex];


        charIndex++;


        /*
          Insert the new letter BEFORE cursor.
          This keeps cursor at exact text end.
        */

        part.insertBefore(
          span,
          cursor
        );


        /*
          Keep cursor inside final part.
        */

        if(partIndex === parts.length - 1){

          part.appendChild(cursor);

        }


        setTimeout(
          typeNext,
          speed
        );


        return;

      }


      /*
        Current word finished.
        Move to next word.
      */

      charIndex = 0;

      partIndex++;


      setTimeout(
        typeNext,
        pauseBetweenWords
      );

    };


    typeNext();

  };


  /* =========================================================
     INTERNAL NAVIGATION
     ========================================================= */

  if(!shouldPlayIntro){

    intro.classList.add('hide');

    showHeroImmediately();

    return;

  }


  /* =========================================================
     REDUCED MOTION INTRO
     ========================================================= */

  if(reduce){

    introText.textContent =
      introLine;


    setTimeout(
      () => {

        finishIntro();

        setTimeout(
          startHeroTyping,
          450
        );

      },
      1700
    );


    return;

  }


  /* =========================================================
     SMOOTH INTRO TYPEWRITER
     ========================================================= */

  let i = 0;


  const typeIntro = () => {

    introText.textContent =
      introLine.slice(
        0,
        i++
      );


    if(i <= introLine.length){

      setTimeout(
        typeIntro,
        48
      );

    }else{

      setTimeout(
        () => {

          finishIntro();


          setTimeout(
            startHeroTyping,
            500
          );

        },
        1050
      );

    }

  };


  /*
    Small delay before intro starts.
  */

  setTimeout(
    typeIntro,
    450
  );

})();
