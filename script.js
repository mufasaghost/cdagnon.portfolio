// Navigation scroll

const navLinks = document.querySelectorAll('nav a');

navLinks.forEach(link => {
  link.addEventListener('click', smoothScroll);
})

function smoothScroll(e) {
  e.preventDefault();
  
  const targetId = e.target.getAttribute('href');
  const target = document.querySelector(targetId);
  target.scrollIntoView({
    behavior: 'smooth'
  });
}

