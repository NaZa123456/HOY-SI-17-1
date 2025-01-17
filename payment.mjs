// Obtener el parámetro de la URL
const params = new URLSearchParams(window.location.search);
const imageUrl = params.get('imageUrl');

// Verificar que la URL de la imagen exista
if (imageUrl) {
  const canvas = document.getElementById('photoCanvas');
  const ctx = canvas.getContext('2d');

  // Crear un objeto Image
  const tempImage = new Image();
  tempImage.crossOrigin = 'anonymous'; // Evitar problemas de CORS
  tempImage.src = imageUrl;

  // Cargar la imagen en el canvas
  tempImage.onload = () => {
    // Ajustar el tamaño del canvas a las dimensiones de la imagen
    canvas.width = tempImage.width;
    canvas.height = tempImage.height;

    // Dibujar la imagen en el canvas
    ctx.drawImage(tempImage, 0, 0);

    // Mostrar la resolución de la imagen
    const resolutionText = document.querySelector('.resolution-text');
    resolutionText.textContent = `${tempImage.width} x ${tempImage.height}`;

    // Configurar estilo de la marca de agua
    ctx.font = '36px Arial'; // Tamaño del texto
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Color blanco semitransparente
    ctx.textAlign = 'center';

    // Texto de la marca de agua
    const watermarkText = 'SkateMappers';

    // Repetir la marca de agua en diagonal
    const textWidth = ctx.measureText(watermarkText).width;
    const diagonalSpacing = 100; // Espaciado entre marcas de agua
    const angle = -45 * Math.PI / 180; // Ángulo de inclinación (grados a radianes)

    // Guardar el contexto para rotar la marca de agua
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);

    // Dibujar el texto repetido
    for (let x = -canvas.width; x < canvas.width; x += textWidth + diagonalSpacing) {
      for (let y = -canvas.height; y < canvas.height; y += diagonalSpacing) {
        ctx.fillText(watermarkText, x, y);
      }
    }

    // Restaurar el contexto original
    ctx.restore();
  };
} else {
  console.error('No se encontró el parámetro imageUrl en la URL.');
}
