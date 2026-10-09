document.addEventListener("DOMContentLoaded", function () {
  /* Global floating WhatsApp button */
  (function () {
    if (document.querySelector(".wa-float")) return;   // never add twice

    const WHATSAPP_NUMBER = "916360353223";             // country code + number, no + or spaces
    const WHATSAPP_MESSAGE = "Hi, I'd like to know more about your interior design services.";

    const link = document.createElement("a");
    link.className = "wa-float";
    link.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Chat with us on WhatsApp");
    link.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
    document.body.appendChild(link);
  })();

  const footerContainer = document.getElementById("footer-placeholder");

  if (!footerContainer) return;

  /*
   * Remove any old/static footer already present on the page.
   * This prevents duplicate footers.
   */
  document.querySelectorAll("#colophon").forEach(function (footer) {
    footer.remove();
  });

  /*
   * Footer links
   */
  const siteBase = "https://xinterio-demo.pbminfotech.com/demo4";

  /*
   * Instagram posts
   */
  const instagramPosts = [
    {
      id: "sbi_17854142214188529",
      url: "https://www.instagram.com/p/C7LSjxmiAHF/",
      alt: "#Interior Design #Sofa"
    },
    {
      id: "sbi_17905112792965993",
      url: "https://www.instagram.com/p/C7LSexoCrxK/",
      alt: "#Expert Designer #interior"
    },
    {
      id: "sbi_17890755849012058",
      url: "https://www.instagram.com/p/C7LSYcGi_-B/",
      alt: "#Exterior, #Interior"
    },
    {
      id: "sbi_18229139131274625",
      url: "https://www.instagram.com/p/C7LSUbgi8UE/",
      alt: "#Interiores Planning Team"
    },
    {
      id: "sbi_18013618853368539",
      url: "https://www.instagram.com/p/C7LSPAIiOeq/",
      alt: "#Home Interior Design"
    },
    {
      id: "sbi_18436852306058019",
      url: "https://www.instagram.com/p/C7Gdt_iCeYT/",
      alt: "#interior Design # Develop #interior"
    }
  ];

  /*
   * Left footer menu
   */
  const leftMenu = [
    ["About Us", "/about-us/"],
    ["FAQ", "/faq/"],
    ["Our Team", "/our-team/"],
    ["Our History", "/our-history/"],
    ["Contact Us", "/contact-us/"],
    ["Blog", "/blog-grid-col-4/"],
    ["Service", "/service/2d-3d-layouts/"],
    ["Team Member", "/team-member/lewis-martin/"],
    ["Project", "/portfolio/lighting/"]
  ];

  /*
   * Right footer menu
   */
  const rightMenu = [
    ["Style Guide", "#"],
    ["Instructions", "#"],
    ["Licenses", "#"],
    ["Changelog", "#"],
    ["Error 404", "#"],
    ["Password", "#"],
    ["Protected", "#"],
    ["Coming Soon", "#"]
  ];

  /*
   * Create menu HTML
   */
  function createMenu(items, menuPrefix) {

    return items.map(function (item, index) {

      const title = item[0];
      const url = item[1];

      const finalUrl = url === "#"
        ? "#"
        : siteBase + url;

      return `
                <li
                    id="${menuPrefix}-item-${index + 1}"
                    class="menu-item"
                >
                    <a href="${finalUrl}">
                        ${title}
                    </a>
                </li>
            `;

    }).join("");

  }

  /*
   * Create Instagram HTML
   */
  function createInstagramPosts() {

    return instagramPosts.map(function (post) {

      return `
                <div
                    class="sbi_item sbi_type_image sbi_new sbi_transition"
                    id="${post.id}"
                >

                    <div class="sbi_photo_wrap">

                        <a
                            class="sbi_photo"
                            href="${post.url}"
                            target="_blank"
                            rel="noopener nofollow"
                        >

                            <span class="sbi-screenreader">
                                ${post.alt}
                            </span>

                            <img
                                src="${siteBase}/wp-content/plugins/instagram-feed/img/placeholder.png"
                                alt="${post.alt}"
                                aria-hidden="true"
                                loading="lazy"
                            >

                        </a>

                    </div>

                </div>
            `;

    }).join("");

  }

  /*
   * Current year
   */
  const currentYear = new Date().getFullYear();
  const BIG_TEXT = "WILLYS";

  /*
   * Footer HTML
   */
  footerContainer.innerHTML = `
<footer id="colophon" class="pbmit-footer-section site-footer pbmit-footer-style-5 pbmit-text-color-white pbmit-bg-color-secondarycolor pbmit-footer-menu-yes pbmit-footer-widget-yes">
  <div class="pbmit-widget-copyright-wrap">

    <!-- CTA strip -->
    <div class="footer-cta">
      <div class="container">
        <div class="footer-cta__inner">
          <div>
            <h3>Let's design a space you'll love coming home to</h3>
            <p>Book a free consultation with our design team.</p>
          </div>
          <a href="/pages/contactUs.html" class="footer-cta__btn">
            Book a Consultation <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>

    <!-- Main footer -->
    <div class="pbmit-footer-section footer-wrap pbmit-footer-widget-area">
      <div class="container">
        <div class="row">

          <div class="pbmit-footer-widget pbmit-footer-widget-col-1 col-md-4">
            <aside class="widget widget_text">
              <div class="textwidget">
                <a href="/index.html">
                  <img src="/assets/img/main/image.png" alt="WillysDesigns logo"
                       style="width:150px;height:auto;margin-bottom:20px;">
                </a>
                <p>We craft thoughtful, livable interiors for homes and workspaces, from
                   concept and 3D layouts to furniture, decor and final handover.</p>
                <div class="footer-social"><a href="https://wa.me/916360353223" aria-label="WhatsApp" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a></div>
              </div>
            </aside>
          </div>

          <div class="pbmit-footer-widget pbmit-footer-widget-col-2 col-md-2">
            <aside class="widget">
              <h5>Quick Links</h5>
              <ul class="menu">
                <li><a href="/index.html">Home</a></li>
                <li><a href="/pages/about-us.html">About Us</a></li>
                <li><a href="/pages/services.html">Services</a></li>
                <li><a href="/pages/Portfolio.html">Our Projects</a></li>
                <li><a href="/pages/contactUs.html">Contact Us</a></li>
              </ul>
            </aside>
          </div>

          <div class="pbmit-footer-widget pbmit-footer-widget-col-3 col-md-3">
            <aside class="widget">
              <h5>Our Services</h5>
              <ul class="menu">
                <li><a href="/pages/services.html">Residential Interiors</a></li>
                <li><a href="/pages/services.html">Modular Kitchens</a></li>
                <li><a href="/pages/services.html">Furniture &amp; Decor</a></li>
                <li><a href="/pages/services.html">2D / 3D Layouts</a></li>
                <li><a href="/pages/services.html">Commercial Interiors</a></li>
              </ul>
            </aside>
          </div>

          <div class="pbmit-footer-widget pbmit-footer-widget-col-4 col-md-3">
            <aside class="widget">
              <h5>Contact Us</h5>
              
              <p><i class="fa-solid fa-phone"></i> <a href="tel:+916360353223">+91 63603 53223</a></p>
              <p><a href="/pages/contactUs.html">Send an enquiry</a></p>
              <p><i class="fa-solid fa-clock"></i> Mon - Sat, 10:00 AM - 7:00 PM</p>
            </aside>
          </div>

        </div>
      </div>
    </div>

    <!-- Copyright bar -->
    <div class="pbmit-footer-section pbmit-bg-color-custom">
      <div class="container">
        <div class="pbmit-footer-text-area-wrapper pbmit-footer-text-area">
          <div class="pbmit-footer-text-inner">
            <div class="row">
              <div class="col-md-7">
                <div class="pbmit-footer-copyright-text-area">
                  &copy; ${currentYear} WillysDesigns. All Rights Reserved.
                  <span class="footer-credit">
                    Designed &amp; developed by
                    <a href="https://www.climentos.com/" target="_blank" rel="noopener">Climentos Technologies</a>
                  </span>
                </div>
              </div>
              <div class="col-md-5">
                <div class="pbmit-footer-menu-area">
                  <ul class="pbmit-footer-menu">
                    
                    <li class="menu-item"><a href="/pages/privacy.html">Demo privacy notice</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Big wordmark -->
  <div class="pbmit-footer-section pbmit-footer-big-area-wrapper">
    <div class="container">
      <div class="row">
        <div class="col-sm-12 pbmit-footer-big-title">
  <h3 class="pbmit-footer-title-big" aria-hidden="true">${BIG_TEXT}</h3>
  <div class="footer-tagline">
    <span class="footer-tagline__line"></span>
    <span class="footer-tagline__text">Designs</span>
    <span class="footer-tagline__line"></span>
  </div>
</div>
      </div>
    </div>
  </div>
</footer>`;
  /* Auto-fit the big footer word to the available width */
  /* Auto-fit the big footer word to the available width */
  (function () {
    const title = footerContainer.querySelector(".pbmit-footer-title-big");
    if (!title) return;
    const box = title.parentElement;
    const MAX = 260;   // biggest allowed size (px)
    const MIN = 32;    // smallest allowed size (px)

    function textWidth() {
      const range = document.createRange();
      range.selectNodeContents(title);
      return range.getBoundingClientRect().width;   // real text width, ignores box limits
    }

    function fit() {
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (avail <= 0) return;

      title.style.setProperty("white-space", "nowrap", "important");
      title.style.setProperty("font-size", "100px", "important");

      const natural = textWidth();                  // text width at 100px
      if (!natural) return;

      let size = Math.floor(100 * avail / natural * 0.98);   // 2% safety margin

      if (size < MIN) {
        size = MIN;
        title.style.setProperty("white-space", "normal", "important");
      }
      size = Math.min(size, MAX);
      title.style.setProperty("font-size", size + "px", "important");
      box.style.setProperty("--tag-size", Math.max(12, size * 0.14) + "px");
    }

    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener("load", fit);
    new ResizeObserver(fit).observe(box);
    const tag = box.querySelector(".footer-tagline");
    if (tag && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          tag.classList.add("is-visible");
          io.disconnect();
        }
      }, { threshold: 0.4 });
      io.observe(tag);
    } else if (tag) {
      tag.classList.add("is-visible");
    }

  })();
});