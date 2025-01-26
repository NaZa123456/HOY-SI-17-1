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
    canvas.width = tempImage.width;
    canvas.height = tempImage.height;

    ctx.drawImage(tempImage, 0, 0);
    const resolutionText = document.querySelector('.resolution-text');
    resolutionText.textContent = `${tempImage.width} x ${tempImage.height}`;

    ctx.font = '36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';

    const watermarkText = 'SkateMappers';
    const textWidth = ctx.measureText(watermarkText).width;
    const diagonalSpacing = 100;
    const angle = -45 * Math.PI / 180;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);

    for (let x = -canvas.width; x < canvas.width; x += textWidth + diagonalSpacing) {
      for (let y = -canvas.height; y < canvas.height; y += diagonalSpacing) {
        ctx.fillText(watermarkText, x, y);
      }
    }

    ctx.restore();
  };
} else {
  console.error('No se encontró el parámetro imageUrl en la URL.');
}

// Lógica de pago
const buyButton = document.querySelector('.buy-button');
const downloadButton = document.querySelector('.download-button');

// Genera la preferencia de pago y obtiene el link
const MP_ACCESS_TOKEN = 'APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637';

const preference = {
  items: [
    {
      title: 'Tubarao Fotografia',
      unit_price: 5000,
      quantity: 1,
    }
  ],
  back_urls: {
    success: 'https://hoy-si-17-1.onrender.com/payment.html?imageUrl=' + encodeURIComponent(imageUrl), // URL de éxito
    failure: 'https://tuapp.com/failure',
    pending: 'https://tuapp.com/pending',
  },
  auto_return: 'approved',
};

const createPreference = async () => {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const preferenceData = await response.json();
  console.log(preferenceData);
  return preferenceData.init_point; // Link de pago
};

// Redirigir al usuario al link de pago generado
buyButton.addEventListener('click', () => {
  createPreference().then(url => {
    window.location.href = url; // Redirige al usuario al link de pago
  });
});

// Verificar el estado del pago (esto debe hacerse después de la redirección en el back-end)
const interval = setInterval(async () => {
  try {
    // Aquí debes obtener el paymentId real del pago
    const paymentId = params.get('payment_id');  // Esto obtiene el payment_id de la URL de éxito
    const response = await fetch(`/check-payment?paymentId=${paymentId}`);
    const result = await response.json();

    if (result.status === 'approved') {
      clearInterval(interval); // Detenemos la verificación
      downloadButton.disabled = false; // Habilitamos el botón de descarga
    }
  } catch (error) {
    console.error('Error verificando el pago:', error);
  }
}, 5000); // Verificar cada 5 segundos

// Descargar la foto
downloadButton.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = imageUrl; // URL de la imagen original
  link.download = 'foto.jpg'; // Nombre del archivo descargado
  link.click();
});
