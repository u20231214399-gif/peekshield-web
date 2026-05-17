const FACESET = "peekshield_estudiantes";
let cameraStream = null;
let asistenciaBlockeada = false;
let detectandoInterval = null;

async function callFacepp(endpoint, params) {
  const res = await fetch('/api/facepp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, params })
  });
  return res.json();
}

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

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    try {
      const data = await callFacepp('search', {
        outer_id: FACESET,
        image_base64: base64,
        return_result_count: '1'
      });

      if (data.results && data.results.length > 0 && data.results[0].confidence >= 75) {
        asistenciaBlockeada = true;
        clearInterval(detectandoInterval);

        const faceToken = data.results[0].face_token;
        const snap = await db.collection('estudiantes')
          .where('faceToken', '==', faceToken)
          .limit(1)
          .get();

        if (!snap.empty) {
          await registrarAsistencia(snap.docs[0].data().nombre, base64);
        } else {
          document.getElementById('statusAsistencia').textContent = '❓ Cara no registrada';
          asistenciaBlockeada = false;
          iniciarDeteccion();
        }
      } else {
        document.getElementById('statusAsistencia').textContent = '👤 Acércate a la cámara...';
      }
    } catch(e) {
      console.error('Error:', e);
    }
  }, 3000);
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
