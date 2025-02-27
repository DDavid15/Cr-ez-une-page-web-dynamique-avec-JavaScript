// ✅ Variable globale pour le cache
let cachedWorks = [];

// ✅ Fonction principale pour récupérer les travaux depuis l'API
async function fetchWorks() {
  if (cachedWorks.length > 0) {
    displayWorks(cachedWorks);
    extractAndDisplayCategories(cachedWorks);
    return;
  }

  try {
    showLoading(); // 🕒 Affiche un indicateur de chargement

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

// 🖼️ Fonction pour afficher les travaux dans la galerie
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.innerHTML = `
      <img src="${work.imageUrl}" alt="${work.title}" loading="lazy">
      <figcaption>${work.title}</figcaption>
    `;
    gallery.appendChild(figure);
  });
}

// 📊 Fonction pour extraire les catégories et créer les boutons de filtre
function extractAndDisplayCategories(works) {
  const filterContainer = document.querySelector(".filters");
  filterContainer.innerHTML = "";

  const allButton = createButton("Tous", "filter-btn", () =>
    displayWorks(works)
  );
  allButton.dataset.categoryId = "";
  filterContainer.appendChild(allButton);

  const categorySet = new Set(
    works.map((work) =>
      JSON.stringify({
        id: work.categoryId,
        name: work.category.name,
      })
    )
  );

  [...categorySet].forEach((catStr) => {
    const category = JSON.parse(catStr);
    const button = createButton(category.name, "filter-btn", () =>
      filterWorksByCategory(works, category.id)
    );
    button.dataset.categoryId = category.id;
    button.setAttribute("aria-label", `Filtrer par ${category.name}`);
    filterContainer.appendChild(button);
  });

  // ✅ Délégation d'événements
  filterContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("filter-btn")) {
      const categoryId = event.target.dataset.categoryId;
      if (!categoryId) return displayWorks(works); // Affiche tous les travaux
      filterWorksByCategory(works, parseInt(categoryId));
    }
  });
}

// 🏷️ Fonction pour filtrer les travaux selon la catégorie choisie
function filterWorksByCategory(works, categoryId) {
  const filteredWorks = works.filter((work) => work.categoryId === categoryId);
  displayWorks(filteredWorks);
}

// 🛠️ Fonction utilitaire pour créer des boutons
function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.classList.add(className);
  button.addEventListener("click", onClick);
  return button;
}

// 🕒 Indicateur de chargement
function showLoading() {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = `<p class="loading">Chargement des travaux...</p>`;
}

// ❌ Gestion des erreurs utilisateur
function showError(message) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = `<p class="error">${message}</p>`;
}

// 🚀 Lancement du script lorsque la page est chargée
document.addEventListener("DOMContentLoaded", fetchWorks);

//Gérer l'affichage admin
document.addEventListener("DOMContentLoaded", function () {
  const loginLink = document.querySelector(".login-header"); // Sélection du bouton Login
  const adminHeader = document.querySelector(".administrator-header"); // Sélection de l'admin header
  const modalTrigger = document.querySelector(".js-modal"); // Sélection du bouton d'ouverture de la modal
  const modalTriggerIcon = document.querySelector(".modal-icon");

  function checkLoginStatus() {
    const token = localStorage.getItem("token");
    if (token) {
      // ✅ L'utilisateur est connecté
      loginLink.textContent = "logout";
      loginLink.classList.add("logout");
      loginLink.href = "#"; // Désactive le lien vers login.html
      loginLink.addEventListener("click", logout);

      // ✅ Afficher les éléments réservés aux administrateurs
      if (adminHeader) adminHeader.style.display = "flex";
      if (modalTrigger) modalTrigger.style.display = "flex";
    } else {
      // ❌ L'utilisateur n'est pas connecté
      loginLink.textContent = "login";
      loginLink.classList.remove("logout");
      loginLink.href = "login.html"; // Redirige vers la page de connexion

      // ❌ Cacher les éléments réservés aux administrateurs
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

// Fenêtre Modal
let modal = null;

const openModal = function (e) {
  e.preventDefault();

  const target = document.querySelector(e.target.getAttribute(`href`));
  if (!target) return;

  target.style.display = `flex`;
  target.removeAttribute(`aria-hidden`);
  target.setAttribute(`aria-modal`, `true`);
  modal = target;

  // Ajout des écouteurs d'événements
  modal.addEventListener(`click`, closeModal);
  modal.querySelector(`.close-modal`).addEventListener(`click`, closeModal);

  // Vérifie si l'écouteur existe déjà avant d'en ajouter un
  document.addEventListener(`keydown`, closeOnEscape);
};

const closeModal = function (e) {
  if (modal === null) return;
  e.preventDefault();

  // Vérifie si on clique en dehors du contenu ou sur la croix de fermeture
  if (
    e.type === "keydown" ||
    e.target === modal ||
    e.target.classList.contains("close-modal")
  ) {
    modal.style.display = `none`;
    modal.setAttribute(`aria-hidden`, `true`);
    modal.removeAttribute(`aria-modal`);
    modal.removeEventListener(`click`, closeModal);
    modal
      .querySelector(`.close-modal`)
      .removeEventListener(`click`, closeModal);

    // Suppression de l'écouteur de touche Échap
    document.removeEventListener(`keydown`, closeOnEscape);

    modal = null;
  }
};

// Fonction pour fermer la modale avec la touche Échap
const closeOnEscape = function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
};

// Ajoute les événements aux liens d'ouverture
document.querySelectorAll(`.js-modal`).forEach((a) => {
  a.addEventListener(`click`, openModal);
});
