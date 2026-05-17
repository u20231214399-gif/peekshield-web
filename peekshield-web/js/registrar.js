const FACESET = "peekshield_estudiantes";

async function callFacepp(endpoint, params) {
  const res = await fetch('/api/facepp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, params })
  });
  return res.json();
}

async function registrarEstudiante() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const status = document.getElementById('statusRegistrar');

  if (!nombre) { status.textContent = '⚠️ Escribe un nombre'; return; }

  const canvas = document.getElementById('canvasRegistro');
  if (!canvas || canvas.dataset.vacio === 'true') {
    status.textContent = '⚠️ Primero captura la foto';
    return;
  }

  status.textContent = '⏳ Registrando...';
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

  try {
    // Crear FaceSet si no existe
    await callFacepp('faceset/create', {
      outer_id: FACESET,
      display_name: 'PeekShield Estudiantes'
    });

    // Detectar cara
    const detectData = await callFacepp('detect', { image_base64: base64 });

    if (!detectData.faces || detectData.faces.length === 0) {
      status.textContent = '⚠️ No se detectó cara en la foto';
      return;
    }

    const faceToken = detectData.faces[0].face_token;

    // Agregar al FaceSet
    await callFacepp('faceset/addface', {
      outer_id: FACESET,
      face_tokens: faceToken
    });

    // Guardar en Firestore
    await db.collection('estudiantes').add({
      nombre,
      faceToken,
      foto: base64,
      fechaRegistro: firebase.firestore.Timestamp.now()
    });

    status.textContent = '✅ ' + nombre + ' registrado correctamente';
    document.getElementById('inputNombre').value = '';
    canvas.dataset.vacio = 'true';
    canvas.style.display = 'none';

  } catch(e) {
    status.textContent = '❌ Error: ' + e.message;
    console.error(e);
  }
}

let streamRegistro = null;

async function iniciarCamaraRegistro() {
  try {
    streamRegistro = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    document.getElementById('videoRegistro').srcObject = streamRegistro;
  } catch(e) {
    document.getElementById('statusRegistrar').textContent = '❌ Sin acceso a cámara';
  }
}

function detenerCamaraRegistro() {
  if (streamRegistro) {
    streamRegistro.getTracks().forEach(t => t.stop());
    streamRegistro = null;
  }
}

function capturarFotoRegistro() {
  const video = document.getElementById('videoRegistro');
  const canvas = document.getElementById('canvasRegistro');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.dataset.vacio = 'false';
  canvas.style.display = 'block';
  document.getElementById('statusRegistrar').textContent = '📸 Foto capturada — escribe el nombre y registra';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inputNombre').addEventListener('keydown', e => {
    if (e.key === 'Enter') registrarEstudiante();
  });
});
