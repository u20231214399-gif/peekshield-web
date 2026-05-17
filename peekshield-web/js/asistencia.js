let cameraStream = null;
let asistenciaBlockeada = false;
let detectandoInterval = null;

async function iniciarCamara() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    document.getElementById('video').srcObject = cameraStream;
    document.getElementById('statusAsistencia').textContent = '👤 Acércate a la cámara...';
    iniciarDeteccion();
  } catch(e) {
    document.getElementById('statusAsistencia').textContent = '❌ Sin acceso a cámara';
  }
}

function detenerCamara() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  clearInterval(detectandoInterval);
}

function iniciarDeteccion() {
  clearInterval(detectandoInterval);
  detectandoInterval = setInterval(async () => {
    if (asistenciaBlockeada) return;
    const video = document.getElementById('video');
    if (!video || video.readyState < 2) return;

    // Capturar frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    try {
      // Buscar en Face++
      const form = new FormData();
      form.append('api_key', FACEPP_KEY);
      form.append('api_secret', FACEPP_SECRET);
      form.append('outer_id', FACEPP_FACESET);
      form.append('image_base64', base64);
      form.append('return_result_count', '1');

      const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/search', {
        method: 'POST', body: form
      });
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const confidence = data.results[0].confidence;
        const faceToken = data.results[0].face_token;

        // Umbral de confianza: 75% o más
        if (confidence >= 75) {
          asistenciaBlockeada = true;
          clearInterval(detectandoInterval);

          // Buscar nombre en Firestore por faceToken
          const snap = await db.collection('estudiantes')
            .where('faceToken', '==', faceToken)
            .limit(1)
            .get();

          if (!snap.empty) {
            const nombre = snap.docs[0].data().nombre;
            await registrarAsistencia(nombre, base64);
          } else {
            document.getElementById('statusAsistencia').textContent = '❓ Cara no registrada';
            asistenciaBlockeada = false;
            iniciarDeteccion();
          }
        } else {
          document.getElementById('statusAsistencia').textContent = '👤 Acércate a la cámara...';
        }
      } else {
        document.getElementById('statusAsistencia').textContent = '👤 Acércate a la cámara...';
      }
    } catch(e) {
      console.error('Error Face++:', e);
    }

  }, 3000); // Cada 3 segundos para no agotar llamadas
}

async function registrarAsistencia(nombre, base64) {
  const status = document.getElementById('statusAsistencia');
  status.textContent = '📸 Registrando a ' + nombre + '...';

  try {
    await db.collection('asistencia').add({
      nombre,
      foto: base64,
      fecha: firebase.firestore.Timestamp.now()
    });
    const hora = new Date().toLocaleTimeString('es-CO');
    status.textContent = '✅ ' + nombre + ' — ' + hora;
    document.getElementById('btnSiguienteWrap').style.display = 'block';
  } catch(e) {
    status.textContent = '❌ Error al registrar';
    asistenciaBlockeada = false;
    iniciarDeteccion();
  }
}

function siguienteEstudiante() {
  asistenciaBlockeada = false;
  document.getElementById('statusAsistencia').textContent = '👤 Acércate a la cámara...';
  document.getElementById('btnSiguienteWrap').style.display = 'none';
  iniciarDeteccion();
}
