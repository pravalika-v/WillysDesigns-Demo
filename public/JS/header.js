document.addEventListener("DOMContentLoaded", function () {
    const headerContainer = document.getElementById("header-container");

    if (!headerContainer) {
        console.error("Header container element '#header-container' not found.");
        return;
    }

    headerContainer.innerHTML = `<header id="masthead" class="site-header pbmit-header-style-13 pbmit-sticky-logo-yes">
                <div class="pbmit-sticky-header "></div>
                <div class="pbmit-header-overlay">
                    <div class="pbmit-header-height-wrapper" style="min-height:100px;">
                        <div class="pbmit-main-header-area pbmit-sticky-logo-yes pbmit-responsive-logo-no pbmit-header-wrapper pbmit-bg-color-transparent">
                            <div class="container">
                                <div class="pbmit-header-content d-flex justify-content-between align-items-center">
                                    <div class="pbmit-logo">
                                        <div class="site-branding pbmit-logo-area">
                                            <div class="wrap">
                                                <h1 class="site-title">
                                                    <a href="/index.html" id="site-main-logo" rel="home">
    <span class="site-title-text">WillysDesigns — Interior Design</span>
    <img 
        src="/assets/img/main/image.png" 
        alt="Logo" 
        style="width: 100%; height: auto; pointer-events: none;"
    >
</a>
                                                </h1>
                                                <!-- Logo area -->
                                            </div>
                                            <!-- .wrap -->
                                        </div>
                                        <!-- .site-branding -->
                                    </div>
                                    <div class="pbmit-menu-search-wrap d-flex justify-content-between align-items-center">
                                        <div class="pbmit-menuarea">
                                            <!-- Top Navigation Menu -->
                                            <div class="navigation-top">
                                                <div class="wrap">
                       
                                                    <nav id="site-navigation"
                                                        class="main-navigation pbmit-navbar pbmit-main-active-color-globalcolor pbmit-dropdown-active-color-globalcolor"
                                                        aria-label="Top Menu">

                                                        <div class="menu-main-menu-container">

                                                            <ul id="pbmit-top-menu" class="menu">

                                                                <!-- HOME -->
                                                                <li id="menu-item-298"
                                                                    class="menu-item menu-item-type-custom menu-item-object-custom menu-item-298">

                                                                    <a href="/index.html">
                                                                        Home
                                                                    </a>

                                                                </li>


                                                                <!-- ABOUT US -->
                                                                <li id="menu-item-299"
                                                                    class="menu-item menu-item-type-custom menu-item-object-custom menu-item-299">

                                                                    <a href="/pages/about-us.html">
                                                                        About Us
                                                                    </a>

                                                                </li>


                                                                <!-- SERVICES -->
                                                                <li id="menu-item-301"
                                                                    class="menu-item menu-item-type-custom menu-item-object-custom menu-item-301">

                                                                    <a href="/pages/services.html">
                                                                        Services
                                                                    </a>

                                                                </li>


                                                                <!-- PORTFOLIO -->
                                                                <li id="menu-item-300"
                                                                    class="menu-item menu-item-type-custom menu-item-object-custom menu-item-300">

                                                                    <a href="/pages/Portfolio.html">
                                                                        Portfolio
                                                                    </a>

                                                                </li>


                                                                


                                                                <!-- CONTACT US -->
                                                                <li id="menu-item-284"
                                                                    class="menu-item menu-item-type-post_type menu-item-object-page menu-item-284">

                                                                    <a href="/pages/contactUs.html">
                                                                        Contact Us
                                                                    </a>

                                                                </li>

                                                            </ul>

                                                        </div>

                                                    </nav>
 

                                                    <!-- #site-navigation -->
                                                </div>
                                                <!-- .wrap -->
                                            </div>
                                            <!-- .navigation-top -->
                                        </div>
                                        <div class="pbmit-search-cart-box">
                                             
                                        </div>
                                    </div>
                                    <div class="pbmit-right-box d-flex align-items-center">
                                        <div class="pbmit-header-button">
                                            <a href="tel:+916360353223">
                                                <span class="pbmit-header-button-text-1">+91 63603 53223</span>
                                            </a>
                                        </div>
                                        <div class="pbmit-button-box-second">
                                            <div class="pbmit-header-button2">
                                                <a href="/pages/contactUs.html" class="pbmit-header-button">
                                                    <span class="pbmit-header-button-wrapper">
                                                        <span class="pbmit-header-button2-text">Book Consult</span>
                                                    </span>
                                                </a>
                                            </div>
                                        </div>
                                        <div class="pbmit-burger-menu-wrapper">
                                            <div class="pbmit-mobile-menu-bg"></div>
                                            <button id="menu-toggle" class="nav-menu-toggle" aria-label="Open navigation" aria-expanded="false">
                                                <i class="pbmit-base-icon-menu-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <!-- pbmit-header-content-end -->
                            </div>
                            <!-- pbmit-header-inner-end -->
                        </div>
                        <!-- container-end -->
                    </div>
                    <!-- pbmit-header-height-wrapper-end -->
                </div>
                <!-- pbmit-header-overlay-end -->
            </header>`;
    /* Highlight the menu item for the current page */
    (function () {
        // Normalise a path: "/" and "/index.html" are both "home"; strip trailing slash and .html
        function normalise(path) {
            path = path.split("?")[0].split("#")[0];
            path = path.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
            if (path.length > 1) path = path.replace(/\/$/, "");
            return path || "/";
        }

        const current = normalise(window.location.pathname);

        headerContainer.querySelectorAll("#pbmit-top-menu > li").forEach(function (li) {
            const link = li.querySelector("a");
            if (!link) return;

            const linkPath = normalise(new URL(link.getAttribute("href"), window.location.origin).pathname);

            if (linkPath === current) {
                li.classList.add("current-menu-item", "active");
                link.setAttribute("aria-current", "page");
            }
        });
    })();
});