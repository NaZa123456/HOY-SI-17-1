// Seleccionar elementos del DOM
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const logoutBtn = document.getElementById('logout-btn');
const userRoleIcon = document.getElementById('user-role-icon');

// Alternar visibilidad del menú desplegable
settingsBtn.addEventListener('click', () => {
  settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
});

// Manejo del botón "Cerrar sesión"
logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/';
      })
      .catch(err => console.error('Error al cerrar sesión:', err));
  }); 