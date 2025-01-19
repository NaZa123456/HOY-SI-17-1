import React, { useState } from 'react';
import { SafeAreaView, Button } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
  const [uri, setUri] = useState('https://hoy-si-17-1.onrender.com'); // Página de inicio

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Botones para cambiar de URL */}
      <Button title="Ir a Login" onPress={() => setUri('https://hoy-si-17-1.onrender.com')} />
      <Button title="Ir a Signup" onPress={() => setUri('https://hoy-si-17-1.onrender.com/signup')} />
      <Button title="Ir a Home" onPress={() => setUri('https://hoy-si-17-1.onrender.com/home')} />
      <Button title="Ir a Profile" onPress={() => setUri('https://hoy-si-17-1.onrender.com/profile')} />
      <Button title="Ir a Payment" onPress={() => setUri('https://hoy-si-17-1.onrender.com/payment.html?imageUrl=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fskatemapp-38f04.firebasestorage.app%2Fo%2Fimages%252F1736448884561-WhatsApp%2520Image%25202024-10-28%2520at%252007.35.58.jpeg%3Falt%3Dmedia%26token%3D7a865cb0-b5b2-43f4-9614-3b6ab0523da2')} />


      {/* WebView para cargar la URL */}
      <WebView
        source={{ uri }}  // Aquí cargamos la URL de Render
        style={{ marginTop: 20 }}
      />
    </SafeAreaView>
  );
};

export default App;