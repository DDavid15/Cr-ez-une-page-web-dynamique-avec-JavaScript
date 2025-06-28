// Variable globale pour le cache
let cachedWorks = [];

// Fonction principale pour récupérer les travaux depuis l'API
async function fetchWorks() {
  if (cachedWorks.length > 0) {
    displayWorks(cachedWorks);
    extractAndDisplayCategories(cachedWorks);
    return;
  }

  try {
    showLoading(); // Affiche un indicateur de chargement

    const response = await fetch("https://backend-for-p4-website.onrender.com/api/works");
    if (!response.ok) throw new Error(`Erreur : ${response.statusText}`);

    cachedWorks = await response.json();

    displayWorks(cachedWorks);
    extractAndDisplayCategories(cachedWorks);
  } catch (error) {
    console.error("Erreur lors de la récupération des travaux :", error);
    showError(
      "Impossible de charger les travaux. Veuillez réessayer plus tard."
    );
  }
}

// Fonction pour afficher les travaux dans la galerie
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = ""; // Nettoyer l'ancienne galerie avant d'afficher les nouveaux projets

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.innerHTML = `
        <img src="${work.imageUrl}" alt="${work.title}" loading="lazy">
        <figcaption>${work.title}</figcaption>
      `;
    gallery.appendChild(figure);
  });
}

// Fonction pour extraire les catégories et créer les boutons de filtre
function extractAndDisplayCategories(works) {
  const filterContainer = document.querySelector(".filters");
  filterContainer.innerHTML = "";

  // Bouton "Tous" pour afficher tous les projets
  const allButton = createButton("Tous", "filter-btn", () =>
    displayWorks(works)
  );
  allButton.dataset.categoryId = "";
  filterContainer.appendChild(allButton);

  // Utilisation d'un Map pour éviter les doublons
  const categoryMap = new Map();

  works.forEach((work) => {
    if (work.categoryId && work.category && !categoryMap.has(work.categoryId)) {
      categoryMap.set(work.categoryId, work.category.name);
    }
  });

  categoryMap.forEach((name, id) => {
    const button = createButton(name, "filter-btn", () =>
      filterWorksByCategory(works, id)
    );
    button.dataset.categoryId = id;
    button.setAttribute("aria-label", `Filtrer par ${name}`);
    filterContainer.appendChild(button);
  });
}

//  Fonction pour filtrer les travaux selon la catégorie choisie
function filterWorksByCategory(works, categoryId) {
  const filteredWorks = works.filter((work) => work.categoryId === categoryId);
  displayWorks(filteredWorks);
}

// Fonction utilitaire pour créer des boutons
function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.classList.add(className);
  button.addEventListener("click", onClick);
  return button;
}

// Indicateur de chargement
function showLoading() {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = `<p class="loading">Chargement des travaux...</p>`;
}

// Gestion des erreurs utilisateur
function showError(message) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = `<p class="error">${message}</p>`;
}

// Lancement du script lorsque la page est chargée
document.addEventListener("DOMContentLoaded", fetchWorks);

// Gérer l'affichage admin
document.addEventListener("DOMContentLoaded", function () {
  const loginLink = document.querySelector(".login"); // Sélection du bouton Login
  const adminHeader = document.querySelector(".administrator-header"); // Sélection de l'admin header
  const modal = document.querySelector(".modal-container"); // Sélection de la modal
  const filter = document.querySelector(".filters");

  // Vérifier si le token JWT est valide
  async function isTokenValid(token) {
    try {
      //  Vérification expiration du token
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const now = Math.floor(Date.now() / 1000);

      if (!decodedPayload.exp || now >= decodedPayload.exp) {
        console.warn("Token expiré !");
        return false;
      }

      //  Vérification avec `DELETE /works/{id}`, mais avec un ID inexistant
      const testProjectId = 999999; // Un ID très grand qui n’existe pas
      const response = await fetch(
        `https://backend-for-p4-website.onrender.com/api/works/${testProjectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      //  Si 401, alors le token est invalide
      if (response.status === 401) {
        localStorage.removeItem("token"); //  Supprime immédiatement le token falsifié
        return false;
      }

      //  Si 404, l’ID n’existe pas mais le token est bon
      if (response.status === 404) {
        return true;
      }

      //  Si 200 ou 204, alors le token est valide (mais attention, ça supprime un projet)
      if (response.status === 200 || response.status === 204) {
        return true;
      }

      return false; // Tout autre code = problème
    } catch (error) {
      return false;
    }
  }

  // Vérifier le statut de connexion
  async function checkLoginStatus() {
    const token = localStorage.getItem("token");

    if (!token || !(await isTokenValid(token))) {
      // Vérifier si on est sur une page nécessitant une connexion
      const isAdminPage =
        window.location.pathname.includes("admin") ||
        window.location.pathname.includes("dashboard");

      localStorage.removeItem("token"); //  Supprimer immédiatement le token

      if (isAdminPage) {
        console.warn("Redirection vers la page de connexion...");
        window.location.href = "/login.html";
      } else {
        applyAdminMode(false); //  Désactiver le mode admin sans redirection
      }
    } else {
      applyAdminMode(true); //  Activer le mode admin si le token est valide
    }
  }

  // Gérer l'affichage du mode admin de manière sécurisée
  function applyAdminMode(isAdmin) {
    if (isAdmin) {
      loginLink.textContent = "logout";
      loginLink.classList.add("logout");
      loginLink.href = "#";

      // Vérifier si l'événement `click` est déjà ajouté avant d'ajouter `logout`
      if (!loginLink.hasAttribute("data-logout")) {
        loginLink.setAttribute("data-logout", "true");
        loginLink.addEventListener("click", logout);
      }

      if (adminHeader) adminHeader.style.display = "flex";
      if (modal) modal.style.display = "flex";
      if (filter) filter.style.display = "none";
    } else {
      loginLink.textContent = "login";
      loginLink.classList.remove("logout");
      loginLink.href = "login.html";

      //  Sécurisation : Supprimer complètement les éléments admin du DOM
      if (adminHeader) adminHeader.remove();
      if (modal) modal.remove();
    }
  }

  // Vérifier le statut de connexion au chargement
  document.addEventListener("DOMContentLoaded", () => {
    applyAdminMode(false); //  Mode admin désactivé par défaut
    checkLoginStatus(); //  Vérifier si l'utilisateur est connecté
  });

  // Fonction de déconnexion
  function logout(event) {
    event.preventDefault(); // Empêche la navigation
    localStorage.removeItem("token"); // Supprime le token
    window.location.reload(); // Recharge la page
  }

  // Vérifier le statut de connexion au chargement
  checkLoginStatus();
});

//  Écoute l'événement pour ajouter un projet directement sans rechargement
window.addEventListener("addProjectToGallery", (event) => {
  const newProject = event.detail;

  //  Ajouter directement le projet à la galerie principale
  const gallery = document.querySelector(".gallery");
  const figure = document.createElement("figure");
  figure.innerHTML = `
        <img src="${newProject.imageUrl}" alt="${newProject.title}" loading="lazy">
        <figcaption>${newProject.title}</figcaption>
        `;
  gallery.appendChild(figure);

  //  Ajouter le projet au cache pour éviter qu'il disparaisse au filtre
  cachedWorks.push(newProject);
});

window.addEventListener("updateGalleryAfterDeletion", () => {
  displayWorks(cachedWorks);
});

// Redirection depuis la page de login
document.addEventListener("DOMContentLoaded", () => {
  const scrollToSection = (sectionId, checkCondition) => {
    const checkLoaded = setInterval(() => {
      const section = document.getElementById(sectionId);

      if (section && checkCondition()) {
        section.scrollIntoView();
        clearInterval(checkLoaded);

        // Supprime l’ancre de l’URL après le scroll
        history.replaceState(null, null, window.location.pathname);

        // Enregistre en sessionStorage que le scroll a été effectué
        sessionStorage.setItem("scrolledToSection", sectionId);
      }
    }, 300);
  };

  // Vérifie si l'URL contient #contact ou #portfolio et si le scroll n'a pas déjà été fait
  if (
    window.location.hash === "#contact" &&
    sessionStorage.getItem("scrolledToSection") !== "contact"
  ) {
    scrollToSection(
      "contact",
      () => document.getElementById("contact").offsetHeight > 0
    );
  }

  if (
    window.location.hash === "#portfolio" &&
    sessionStorage.getItem("scrolledToSection") !== "portfolio"
  ) {
    scrollToSection(
      "portfolio",
      () => document.querySelectorAll(".gallery figure").length > 0
    );
  }

  // Efface la mémoire du scroll si l'utilisateur navigue sans ancre
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("scrolledToSection");
  });
});
