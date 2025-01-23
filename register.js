function setRole(role) {
    document.getElementById('role').value = role;
  }
  
  // Agregar evento al formulario para verificar si se seleccionó un rol
  document.querySelector('form').addEventListener('submit', function (event) {
    const role = document.getElementById('role').value;
    if (!role) {
      event.preventDefault();
      alert('Por favor, selecciona un rol.');
    }
  });

  // Redirigir a /login al hacer clic en la cruz de cierre
document.getElementById('close-form').addEventListener('click', function () {
  window.location.href = '/';
});