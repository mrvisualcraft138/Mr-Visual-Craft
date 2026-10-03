/* Home navigation memory: returning Home from another page skips the opening animation. */
(function(){
  document.addEventListener('click', function(e){
    const a=e.target.closest && e.target.closest('a[href]');
    if(!a) return;

    const raw=a.getAttribute('href') || '';

    if(
      !raw ||
      raw.startsWith('#') ||
      raw.startsWith('mailto:') ||
      raw.startsWith('tel:') ||
      a.target==='_blank'
    ) return;

    try{
      const u=new URL(raw, location.href);

      const isHome =
        u.origin===location.origin &&
        (
          u.pathname==='/' ||
          u.pathname.endsWith('/index.html')
        );

      const onHome =
        location.pathname==='/' ||
        location.pathname.endsWith('/index.html');

      if(isHome && !onHome){
        e.preventDefault();

        const target =
          u.pathname +
          '?skipHomeIntro=1' +
          (u.hash||'');

        location.href=target;
      }

    }catch(_){}
  }, true);
})();


/* MR VISUALCRAFT theme control */
(function(){

  const saved =
    localStorage.getItem('mrvc_theme');

  if(saved === 'light'){
    document.documentElement.classList.add(
      'light-theme'
    );
  }

  function mountThemeToggle(){

    const actions =
      document.querySelector('.navActions');

    if(
      !actions ||
      actions.querySelector('.themeToggle')
    ) return;

    const b =
      document.createElement('button');

    b.className='themeToggle';
    b.type='button';

    b.setAttribute(
      'aria-label',
      'Toggle dark and light theme'
    );

    b.title='Toggle dark / light mode';

    b.innerHTML =
      '<span class="moon" aria-hidden="true">☾</span>' +
      '<span class="sun" aria-hidden="true">☀</span>';

    const first =
      actions.querySelector('.btn');

    actions.insertBefore(
      b,
      first || actions.firstChild
    );

    b.addEventListener('click',()=>{

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

  const $ =
    s => document.querySelector(s);

  const path =
    location.pathname.replace(/\\/g,'/');


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

  glow.className='cursorGlow';

  document.body.appendChild(glow);

  document.addEventListener(
    'pointermove',
    e => {

      glow.style.left =
        e.clientX + 'px';

      glow.style.top =
        e.clientY + 'px';

    }
  );


  /* Scroll reveal animations */
  const obs =
    new IntersectionObserver(
      es =>
        es.forEach(e =>
          e.isIntersecting &&
          e.target.classList.add('in')
        ),
      {
        threshold:.08
      }
    );

  document
    .querySelectorAll(
      '.reveal,.card,.panel,.step,.pageHero,.section'
    )
    .forEach((e,i)=>{

      e.classList.add('reveal');

      e.style.transitionDelay =
        (Math.min(i,8) * 45) + 'ms';

      obs.observe(e);

    });


  /* =========================================================
     MOBILE MENU FIX
     ========================================================= */

  const ham =
    $('.hamb');

  const nav =
    $('.links');

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


    ham.addEventListener(
      'click',
      e => {

        e.preventDefault();
        e.stopPropagation();

        const isOpen =
          nav.classList.toggle('open');

        ham.setAttribute(
          'aria-expanded',
          isOpen ? 'true' : 'false'
        );

      }
    );


    /* Close after clicking a menu link */
    nav.addEventListener(
      'click',
      e => {

        if(e.target.closest('a')){
          closeMenu();
        }

      }
    );


    /* Close when clicking outside menu */
    document.addEventListener(
      'click',
      e => {

        if(
          nav.classList.contains('open') &&
          !nav.contains(e.target) &&
          !ham.contains(e.target)
        ){

          closeMenu();

        }

      }
    );


    /* Close when returning to desktop */
    window.addEventListener(
      'resize',
      () => {

        if(window.innerWidth > 760){
          closeMenu();
        }

      }
    );

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
        localStorage.getItem(
          'mrvc_pending'
        ) || '[]'
      );


    const save = x =>
      localStorage.setItem(
        'mrvc_pending',
        JSON.stringify(x)
      );


    async function flush(){

      let q =
        pending();

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
                method:'POST',

                headers:{
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
                method:'POST',

                headers:{
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
                  ${x.phone
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

    .catch(()=>{

      admin.innerHTML =
        '<div class="panel">Backend unavailable.</div>';

    });

  }


  /* Escape HTML */
  function escape(s){

    return String(s || '').replace(
      /[&<>"']/g,
      m => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#039;'
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

    i =
      (n + 3) % 3;

    slides.style.transform =
      `translateX(-${i * 100}%)`;

    dots.forEach(
      (d,k) =>
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
   OPENING INTRO + HARD-CODED HERO TYPEWRITER
   Hero text:
   Freelance Creative Designer & Developer
   ========================================================= */

(function(){

  const intro =
    document.getElementById('typingIntro');

  const introText =
    document.getElementById('typingText');

  const hero =
    document.querySelector('.heroTitleType');

  if(
    !intro ||
    !introText ||
    !hero
  ) return;


  /* Exact hard-coded Hero text */
  const heroText =
    'Freelance Creative Designer & Developer';


  const reduce =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  const nav =
    performance.getEntriesByType(
      'navigation'
    )[0];

  const navType =
    nav ? nav.type : 'navigate';


  const ref =
    document.referrer || '';


  let sameOriginRef =
    false;


  try{

    sameOriginRef =
      ref
        ? new URL(ref).origin === location.origin
        : false;

  }catch(e){}


  /* Read Home navigation flag */
  const params =
    new URLSearchParams(
      window.location.search
    );


  const skipHomeIntro =
    params.get('skipHomeIntro') === '1';


  /* Remove skipHomeIntro from address bar */
  if(skipHomeIntro){

    history.replaceState(
      {},
      document.title,
      window.location.pathname +
      window.location.hash
    );

  }


  /*
    Fresh/direct Home visit or browser refresh:
    play opening intro + hero typing.

    Internal navigation back to Home:
    skip opening animation and show Hero immediately.
  */
  const shouldPlayIntro =
    !skipHomeIntro &&
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

    hero.querySelectorAll(
      '.heroTypeCursor'
    ).forEach(
      x => x.remove()
    );


    /*
      Hard-coded Hero text.
      This guarantees the original text
      always appears correctly.
    */
    hero.innerHTML = `
      <span class="typeWord">
        ${heroText}
      </span>
    `;


    hero.style.visibility =
      'visible';

    hero.style.opacity =
      '1';


    hero.dataset.typingStarted =
      '1';


    hero.classList.add(
      'typingStarted',
      'typingDone'
    );

  };


  /* =========================================================
     FINISH OPENING INTRO
     ========================================================= */

  const finishIntro = () => {

    intro.classList.add('hide');

    window.dispatchEvent(
      new Event('mrvcIntroDone')
    );

  };


  /* =========================================================
     START HERO TYPEWRITER
     ========================================================= */

  const startHeroTyping = () => {

    if(
      hero.dataset.typingStarted === '1'
    ) return;


    hero.dataset.typingStarted =
      '1';


    /* Clear any old Hero content */
    hero.innerHTML = '';


    const word =
      document.createElement('span');

    word.className =
      'typeWord';


    hero.appendChild(word);


    hero.style.visibility =
      'visible';

    hero.style.opacity =
      '1';


    hero.classList.add(
      'typingStarted'
    );


    /* Reduced motion */
    if(reduce){

      word.textContent =
        heroText;

      hero.classList.add(
        'typingDone'
      );

      return;

    }


    /* Animated cursor */
    const cursor =
      document.createElement('span');

    cursor.className =
      'heroTypeCursor';

    cursor.setAttribute(
      'aria-hidden',
      'true'
    );


    word.appendChild(cursor);


    let i = 0;

    const speed = 65;


    const typeNext = () => {

      if(i < heroText.length){

        const char =
          document.createElement(
            'span'
          );

        char.className =
          'typeChar shown';

        char.textContent =
          heroText.charAt(i);


        word.insertBefore(
          char,
          cursor
        );


        i++;


        setTimeout(
          typeNext,
          speed
        );

      }else{

        hero.classList.add(
          'typingDone'
        );

      }

    };


    typeNext();

  };


  /* =========================================================
     INTERNAL HOME NAVIGATION
     ========================================================= */

  if(!shouldPlayIntro){

    intro.classList.add(
      'hide'
    );

    showHeroImmediately();

    return;

  }


  /* =========================================================
     REDUCED MOTION
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
     OPENING INTRO TYPEWRITER
     ========================================================= */

  let i = 0;


  const typeIntro = () => {

    introText.textContent =
      introLine.slice(
        0,
        i++
      );


    if(
      i <= introLine.length
    ){

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


  setTimeout(
    typeIntro,
    450
  );

})();
