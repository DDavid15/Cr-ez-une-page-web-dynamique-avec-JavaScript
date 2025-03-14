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

    const response = await fetch("http://localhost:5678/api/works");
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

//Gérer l'affichage admin
document.addEventListener("DOMContentLoaded", function () {
  const loginLink = document.querySelector(".login"); // Sélection du bouton Login
  const adminHeader = document.querySelector(".administrator-header"); // Sélection de l'admin header
  const modalTrigger = document.querySelector(".js-modal"); // Sélection du bouton d'ouverture de la modal
  const modalTriggerIcon = document.querySelector(".modal-icon");
  const filter = document.querySelector(".filters");

  function checkLoginStatus() {
    const token = localStorage.getItem("token");
    if (token) {
      // L'utilisateur est connecté
      loginLink.textContent = "logout";
      loginLink.classList.add("logout");
      loginLink.href = "#"; // Désactive le lien vers login.html
      loginLink.addEventListener("click", logout);

      // Afficher les éléments réservés aux administrateurs
      if (adminHeader) adminHeader.style.display = "flex";
      if (modalTrigger) modalTrigger.style.display = "flex";
      // Filtres cachées pour le mode administrateur
      if (filter) filter.style.display = "none";
    } else {
      // L'utilisateur n'est pas connecté
      loginLink.textContent = "login";
      loginLink.classList.remove("logout");
      loginLink.href = "login.html"; // Redirige vers la page de connexion

      // Cacher les éléments réservés aux administrateurs
      if (adminHeader) adminHeader.style.display = "none";
      if (modalTrigger) modalTrigger.style.display = "none";
      if (modalTriggerIcon) modalTriggerIcon.style.display = "none";
    }
  }
  function logout(event) {
    event.preventDefault(); // Empêche la navigation
    localStorage.removeItem("token"); // Supprime le token
    window.location.reload(); // Recharge la page
  }

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
