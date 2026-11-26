
/* =====================================
   DFP EDUCATION
   SISTEMA ADMINISTRATIVO
===================================== */

// 1. CONFIGURACIÓN DE SUPABASE

const SUPABASE_URL = "https://ytoyzrwmmuqeeupqugik.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qcocZrQ5wDFU6L5No2j6JQ_JGOjMc7T";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. ELEMENTOS HTML

const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

const requestsTable = document.getElementById("requestsTable");
const requestsMessage = document.getElementById("requestsMessage");
const searchRequests = document.getElementById("searchRequests");

const ADMIN_UID = "473a41f3-dc57-477d-a714-0253a34b6781";

let allRequests = [];

function updateStatistics() {
  const total = allRequests.length;

  const pending = allRequests.filter(
    request => request.estado === "pendiente"
  ).length;

  const accepted = allRequests.filter(
    request => request.estado === "aceptada"
  ).length;

  const collected = allRequests.filter(
    request => request.estado === "recogida"
  ).length;

  const rejected = allRequests.filter(
    request => request.estado === "rechazada"
  ).length;

  document.getElementById("totalRequests").textContent = total;
  document.getElementById("pendingRequests").textContent = pending;
  document.getElementById("acceptedRequests").textContent = accepted;
  document.getElementById("collectedRequests").textContent = collected;
  document.getElementById("rejectedRequests").textContent = rejected;
}

// 3. MOSTRAR PANEL

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  loadRequests();
}

// 4. MOSTRAR LOGIN

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

// 5. INICIAR SESIÓN

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginMessage.textContent = "Verificando acceso...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    if (data.user.id !== ADMIN_UID) {
      await supabaseClient.auth.signOut();
      throw new Error("No tienes autorización administrativa.");
    }

    loginMessage.textContent = "Acceso autorizado.";
    showDashboard();

  } catch (error) {
    loginMessage.textContent = error.message;

  } finally {
    loginButton.disabled = false;
  }
});

// 6. CERRAR SESIÓN

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      alert("No se pudo cerrar la sesión.");
      return;
    }

    showLogin();
  });
}

// 7. COMPROBAR SESIÓN

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showLogin();
    return;
  }

  const user = data.session?.user;

  if (user && user.id === ADMIN_UID) {
    showDashboard();
  } else {
    if (user) {
      await supabaseClient.auth.signOut();
    }

    showLogin();
  }
}

// 8. CARGAR SOLICITUDES

async function loadRequests() {
  requestsMessage.textContent = "Cargando solicitudes...";
  requestsTable.replaceChildren();

  try {
    const { data, error } = await supabaseClient
      .from("solicitudes_recoleccion")
      .select("*");

    if (error) throw error;

allRequests = data || [];

updateStatistics();

renderRequests(allRequests);

    requestsMessage.textContent =
      `${allRequests.length} solicitud(es) encontrada(s).`;

  } catch (error) {
    requestsMessage.textContent =
      "Error al cargar solicitudes: " + error.message;
  }
}


// 9. MOSTRAR SOLICITUDES

function renderRequests(requests) {
  requestsTable.replaceChildren();

  if (requests.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = "No hay solicitudes registradas.";

    row.appendChild(cell);
    requestsTable.appendChild(row);
    return;
  }

  requests.forEach(request => {
    const row = document.createElement("tr");

    // NOMBRE
    const nameCell = document.createElement("td");
    nameCell.textContent = request.nombre || "Sin nombre";
    row.appendChild(nameCell);

    // TELEFONO
    const phoneCell = document.createElement("td");
    phoneCell.textContent = request.telefono || "No disponible";
    row.appendChild(phoneCell);

    // ESTADO
    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");

    const statuses = [
      "pendiente",
      "aceptada",
      "recogida",
      "rechazada"
    ];

    statuses.forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent =
        status.charAt(0).toUpperCase() + status.slice(1);

      statusSelect.appendChild(option);
    });

    statusSelect.value = statuses.includes(request.estado)
      ? request.estado
      : "pendiente";

    statusSelect.addEventListener("change", async () => {
      const nuevoEstado = statusSelect.value;

      statusSelect.disabled = true;
      requestsMessage.textContent = "Guardando cambios...";

      const { error } = await supabaseClient
        .from("solicitudes_recoleccion")
        .update({ estado: nuevoEstado })
        .eq("id", request.id);

      statusSelect.disabled = false;

      if (error) {
        requestsMessage.textContent =
          "Error al guardar: " + error.message;
        statusSelect.value = request.estado || "pendiente";
        return;
      }

      request.estado = nuevoEstado;

      updateStatistics();

      requestsMessage.textContent =
        "Estado actualizado correctamente.";
    });

    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    // BOTON VER DETALLES
    const detailsCell = document.createElement("td");
    const detailsButton = document.createElement("button");

    detailsButton.textContent = "Ver detalles";
    detailsButton.type = "button";

    detailsButton.addEventListener("click", () => {
      const details = [
        "DETALLES DE LA SOLICITUD",
        "",
        "Nombre: " + (request.nombre || "No disponible"),
        "Participante: " + (request.tipo_participante || "No disponible"),
        "Teléfono: " + (request.telefono || "No disponible"),
        "Ubicación: " + (request.ubicacion || "No disponible"),
        "Cantidad de litros: " + (request.cantidad_litros ?? "No disponible"),
        "Fecha disponible: " + (request.fecha_disponible || "No disponible"),
        "Observaciones: " + (request.observaciones || "Ninguna"),
        "Estado: " + (request.estado || "pendiente")
      ];

      alert(details.join("\n"));
    });

    detailsCell.appendChild(detailsButton);
    row.appendChild(detailsCell);

    requestsTable.appendChild(row);
  });
}
