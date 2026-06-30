
    // ---- Navbar Scroll ----
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar && window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else if (navbar) {
        navbar.classList.remove('scrolled');
      }
    });
  