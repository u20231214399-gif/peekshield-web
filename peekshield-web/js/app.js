function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');

  if (id === 'asistencia') {
    iniciarCamara();
  } else {
    detenerCamara();
  }

  if (id === 'registrar') {
    iniciarCamaraRegistro();
  } else {
    detenerCamaraRegistro();
  }

  if (id === 'historial') {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('filtroFecha').value = hoy;
    cargarHistorial();
  }
}
