// Crea el FaceSet en Face++ si no existe
async function crearFaceSetSiNoExiste() {
  const form = new FormData();
  form.append('api_key', FACEPP_KEY);
  form.append('api_secret', FACEPP_SECRET);
  form.append('outer_id', FACEPP_FACESET);
  form.append('display_name', 'PeekShield Estudiantes');

  try {
    await fetch('https://api-us.faceplusplus.com/facepp/v3/faceset/create', {
      method: 'POST', body: form
    });
  } catch(e) {
    // Ya existe, no pasa nada
  }
}

async function registrarEstudiante() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const status = document.getElementById('statusRegistrar');

  if (!nombre) { status.textContent = '⚠️ Escribe un nombre'; return; }

  // Verificar que haya foto capturada
  const canvas = document.getElementById('canvasRegistro');
  if (!canvas || canvas.dataset.vacio === 'true') {
    status.textContent = '⚠️ Primero captura la foto del estudiante';
    return;
  }

  status.textContent = '⏳ Registrando en Face++...';

  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

  try {
    await crearFaceSetSiNoExiste();

    // 1. Detectar cara en Face++
    const formDetect = new FormData();
    formDetect.append('api_key', FACEPP_KEY);
    formDetect.append('api_secret', FACEPP_SECRET);
    formDetect.append('image_base64', base64);

    const detectRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST', body: formDetect
    });
    const detectData = await detectRes.json();

    if (!detectData.faces || detectData.faces.length === 0) {
      status.textContent = '⚠️ No se detectó cara en la foto';
      return;
    }

    const faceToken = detectData.faces[0].face_token;

    // 2. Agregar cara al FaceSet
    const formAdd = new FormData();
    formAdd.append('api_key', FACEPP_KEY);
    formAdd.append('api_secret', FACEPP_SECRET);
    formAdd.append('outer_id', FACEPP_FACESET);
    formAdd.append('face_tokens', faceToken);

    await fetch('https://api-us.faceplusplus.com/facepp/v3/faceset/addface', {
      method: 'POST', body: formAdd
    });

    // 3. Guardar en Firestore con el face_token
    await db.collection('estudiantes').add({
      nombre,
      faceToken,
      foto: base64,
      fechaRegistro: firebase.firestore.Timestamp.now()
    });

    status.textContent = '✅ ' + nombre + ' registrado correctamente';
    document.getElementById('inputNombre').value = '';
    canvas.dataset.vacio = 'true';
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

  } catch(e) {
    status.textContent = '❌ Error: ' + e.message;
    console.error(e);
  }
}

// Cámara para registro
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
  document.getElementById('statusRegistrar').textContent = '📸 Foto capturada — ahora escribe el nombre y registra';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inputNombre').addEventListener('keydown', e => {
    if (e.key === 'Enter') registrarEstudiante();
  });
});
