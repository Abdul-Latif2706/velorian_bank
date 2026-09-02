document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const form = $("#adminLoginForm") || $("#clientLoginForm");
  if (!form) return;
  const isAdmin = form.id === "adminLoginForm";
  const error = $(isAdmin ? "#adminLoginError" : "#clientLoginError");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const identifier = $(isAdmin ? "#adminEmail" : "#clientAccount").value.trim();
    const password = $(isAdmin ? "#adminPassword" : "#clientPassword").value;
    const state = vbGetState();

    if (isAdmin) {
      if (identifier.toLowerCase() === state.admin.email.toLowerCase() && password === state.admin.password) {
        vbSetSession("admin"); location.href = "../control-center/index.html"; return;
      }
    } else {
      const client = state.clients.find(c =>
        String(c.accountNumber || "") === identifier ||
        String(c.email || "").toLowerCase() === identifier.toLowerCase()
      );
      if (client && client.password === password) {
        if (client.status !== "Active") {
          showError(`This account is ${client.status.toLowerCase()}. Please contact Velorian Bank support.`); return;
        }
        // Store both ID and account number so the client dashboard can recover cleanly.
        vbSetSession("client", client.id, client.accountNumber);
        location.href = client.forcePasswordChange ? "client/first-login.html" : "client/index.html"; return;
      }
    }
    showError("The login details could not be verified. Please try again.");
  });

  function showError(message) {
    if (!error) return;
    error.textContent = message;
    error.classList.add("show");
    setTimeout(() => error.classList.remove("show"), 3500);
  }
});

// Password visibility controls
document.querySelectorAll(".password-toggle").forEach(btn => btn.addEventListener("click", () => {
  const input=document.getElementById(btn.dataset.target);
  if (!input) return;
  input.type=input.type === "password" ? "text" : "password";
  btn.textContent=input.type === "password" ? "Show" : "Hide";
}));
