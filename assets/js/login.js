const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Empêche le rechargement de la page

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    //  ENVOI de la requête POST avec fetch
    const response = await fetch("http://localhost:5678/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();

      //  Stocke le token pour les futures requêtes
      localStorage.setItem("token", data.token);

      //  Redirige vers la page d'accueil
      window.location.href = "index.html";
    } else if (response.status === 401) {
      errorMessage.textContent = "Erreur dans l’identifiant ou le mot de passe";
    } else if (response.status === 404) {
      errorMessage.textContent = "Utilisateur non trouvé";
    } else {
      errorMessage.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    errorMessage.textContent = "Une erreur est survenue. Veuillez réessayer.";
  }
});
