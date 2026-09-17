    }
  }
  
  try {
    let bOpts =
      `<option value="" disabled selected>Pilih Cawangan</option>` +
      (shopData.Branches || [])
        .map((b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`)
        .join("");

    const buildCard = (arr, prefix, tab, category) =>
      arr
        .map(
          (x, i) => `
      <div class="service-card-wrapper rgb-border-container" id="card-${prefix}${i}">
        <div class="card-inner rgb-border-inner service-card-inner">
          <div class="card-header"><div><h3>${escapeHTML(x.name)}</h3><p style="font-weight:500; font-size:11px; margin-top:3px;">${escapeHTML(x.desc || "Tiada diskripsi")}</p></div><div class="price">RM${parseFloat(x.price).toFixed(2)}</div></div>
          <div class="card-body">
            <form data-service-id="${x.id}" data-price="${x.price}" data-category="${category}">
              <div class="form-group"><label>Cawangan</label><select class="input-field" name="branch" onchange="updBarber(this,'${prefix}${i}')" required>${bOpts}</select></div>
              <div class="form-group"><label>Barber</label><select class="input-field" name="barber" id="barber-${prefix}${i}" required><option value="" disabled selected>Sila Pilih</option></select></div>
              
              <div class="form-group" style="margin-top:6px;">
                <button type="button" class="btn-pilih-jadual" id="btn-jadual-${prefix}${i}" onclick="openScheduleModal('${prefix}${i}')">${i18n_index[currentLang]["services-btn-schedule"]}</button>
                <input type="hidden" id="input-date-${prefix}${i}" name="date" required>
                <input type="hidden" id="input-time-${prefix}${i}" name="time" required>
              </div>
              
              <button type="submit" class="submit-btn" style="margin-top:4px;">${i18n_index[currentLang]["services-btn-pay"]}</button>
            </form>
          </div>
        </div>
      </div>`,
        )
        .join("");

    document.getElementById("services-haircuts").innerHTML =
      `<div class="section-title">Guntingan Rambut</div>` +
      buildCard(shopData.Haircuts || [], "hc", "Pelantikan", "Haircuts");
    document.getElementById("services-treatments").innerHTML =
      `<div class="section-title">Rawatan & Terapi</div>` +
      buildCard(shopData.Treatments || [], "tr", "Rawatan", "Treatments");
      
    renderHomeBranches();

    let oncallSvc = document.getElementById("oncall-service-dropdown");
    if (oncallSvc)
      oncallSvc.innerHTML =
        `<option value="" disabled selected>Pilih Servis</option>` +
        (shopData.OnCall || [])
          .map(
            (s) => `<option value="${s.id}">${escapeHTML(s.name)} - RM${s.price}</option>`,
          )
          .join("");

    let oncallBarber = document.getElementById("oncall-barber-dropdown");
    if (oncallBarber)
      oncallBarber.innerHTML =
        `<option value="" disabled selected>Pilih Barber</option>` +
        (shopData.OnCallBarbers || [])
          .map((b) => `<option value="${b.id}">${escapeHTML(b.name)}</option>`).join("");

    const posterTrack = document.getElementById("dynamic-slider-track");
    const paginationContainer = document.querySelector(".pagination");
    if (shopData.Posters && shopData.Posters.length > 0) {
      posterTrack.innerHTML = shopData.Posters.map(
        (p) =>
          `<div class="slide"><div class="poster-card"><img src="${p.imageUrl}" alt="Promosi"></div></div>`,
      ).join("");
      
      // Update pagination dots
      if (paginationContainer) {
        paginationContainer.innerHTML = shopData.Posters.map((_, i) => 
          `<div class="dot ${i === 0 ? 'active' : ''}"></div>`
        ).join("");
      }
      
      const viewport = document.querySelector(".slider-viewport");
      
      // Sync dots on manual scroll
      if (viewport && paginationContainer) {
          viewport.onscroll = () => {
            const firstSlide = viewport.querySelector('.slide');
            if (!firstSlide) return;
            const gap = parseFloat(window.getComputedStyle(posterTrack).gap) || 0;
            const slideWidth = firstSlide.offsetWidth + gap;
            const index = Math.round(viewport.scrollLeft / slideWidth);
            const dots = paginationContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
              if (i === index) dot.classList.add('active');
              else dot.classList.remove('active');
            });
          };
        }
  
        if (window.sliderInterval) clearInterval(window.sliderInterval);
        if (shopData.Posters.length > 1) {
          window.sliderInterval = setInterval(() => {
            if (!viewport || !viewport.offsetParent || document.hidden) return;
            
            const firstSlide = viewport.querySelector('.slide');
            if (!firstSlide) return;
            const gap = parseFloat(window.getComputedStyle(posterTrack).gap) || 0;
            const slideWidth = firstSlide.offsetWidth + gap;
            
            const maxScroll = viewport.scrollWidth - viewport.clientWidth;
            const currentIndex = Math.round(viewport.scrollLeft / slideWidth);
            const isLastSlide = currentIndex >= shopData.Posters.length - 1;
            if (isLastSlide || viewport.scrollLeft >= maxScroll - 10) {
              // At the end, go back to start
              viewport.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              // Scroll to next slide
              viewport.scrollTo({ left: viewport.scrollLeft + slideWidth, behavior: 'smooth' });
            }
          }, 7000);
        }
    } else {
      posterTrack.innerHTML = `<div class="slide"><div class="poster-card"><div style="color:gray; font-size:12px; font-weight:bold;">Tiada Promosi Dijalankan</div></div></div>`;
      if (paginationContainer) paginationContainer.innerHTML = '';
    }
