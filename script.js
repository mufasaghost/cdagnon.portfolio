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

// Contact form submission
//
// Posts to /api/contact (see api/contact.js), a serverless function that
// classifies the message with Jev (TypeSafe AI) for spam/lead-quality
// before it would be forwarded on.

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', handleContactSubmit);
}

async function handleContactSubmit(e) {
  e.preventDefault();

  const status = document.querySelector('#contact-status');
  const formData = new FormData(contactForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  };

  if (status) status.textContent = 'Sending...';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Something went wrong');
    }

    if (status) {
      status.textContent = result.forwarded
        ? "Thanks! I'll get back to you soon."
        : 'Thanks for the message.';
    }
    contactForm.reset();
  } catch (err) {
    if (status) status.textContent = 'Could not send message. Please try again later.';
  }
}

