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
    console.log(cachedWorks);
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

// 🎯 Gestion de l'ouverture et fermeture de la modale
let modal = null;

const openModal = function (e) {
  e.preventDefault();

  // Sélection de la modale
  modal = document.querySelector(e.target.getAttribute("href"));

  if (!modal) {
    console.error("Erreur : La modale n'a pas été trouvée.");
    return;
  }

  modal.style.display = "flex"; // 🔹 Affiche la modale
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");

  // Ajout des événements pour fermer la modale
  modal.addEventListener("click", closeModal);
  modal.querySelector(".close-modal").addEventListener("click", closeModal);
  document.addEventListener("keydown", closeOnEscape);

  // Lancement de la modale avec la première étape
  currentStep = 0;
  updateModalContent(currentStep);
};

const closeModal = function (e) {
  if (!modal) return;
  e.preventDefault();

  // Vérifie si on clique en dehors de la modale ou sur le bouton de fermeture
  if (
    e.type === "keydown" ||
    e.target === modal ||
    e.target.classList.contains("close-modal")
  ) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");
    modal.removeEventListener("click", closeModal);
    modal
      .querySelector(".close-modal")
      .removeEventListener("click", closeModal);
    document.removeEventListener("keydown", closeOnEscape);
    modal = null;
  }
};

// 📌 Fonction pour fermer la modale avec la touche "Échap"
const closeOnEscape = function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
};

// 📌 Ajoute l'événement aux boutons qui ouvrent la modale
document.querySelectorAll(".js-modal").forEach((btn) => {
  btn.addEventListener("click", openModal);
});

// Sélection des éléments
const nextButton = document.querySelector(".next-button");
const prevButton = document.querySelector(".prev-button");
const modalBody = document.querySelector(".modal-body");
const titleModal = document.querySelector(".modal-header h2");

let currentStep = 0;
let selectedFile = null; // Stocker le fichier choisi

// 🚀 Fonction de mise à jour du contenu de la modale
function updateModalContent(step) {
  if (!titleModal || !modalBody) {
    console.error("Erreur : Élément non trouvé !");
    return;
  }

  // 🎨 Mise à jour selon l'étape
  if (step === 0) {
    titleModal.textContent = "Galerie photo";
    modalBody.innerHTML = `<div class="modal-gallery"></div>`;
    fetchWork().then(injectGalleryModal);
    nextButton.value = "Ajouter une photo";
  } else if (step === 1) {
    titleModal.textContent = "Ajout photo";
    modalBody.innerHTML = `
      <form class="add-photo-form">
        <label for="file">+ Ajouter une photo</label>
        <input type="file" id="file" accept="image/*">
        <p id="file-name">Aucun fichier sélectionné</p>
      </form>
    `;
    nextButton.value = "Suivant";

    document
      .getElementById("file")
      .addEventListener("change", function (event) {
        selectedFile = event.target.files[0]; // Stocke le fichier
        if (selectedFile) {
          document.getElementById("file-name").textContent = selectedFile.name;
        }
      });
  } else if (step === 2) {
    titleModal.textContent = "Ajout photo";
    modalBody.innerHTML = `
      <form class="add-photo-form">
        <img id="preview-image" src="" alt="Aperçu de l'image" style="display: none; width: 100px;">
        <label for="title">Titre</label>
        <input type="text" id="title">
        <label for="category">Catégorie</label>
        <input type="text" id="category">
      </form>
    `;
    nextButton.value = "Valider";

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const preview = document.getElementById("preview-image");
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  // 🔄 Mise à jour des boutons
  prevButton.style.display = step === 0 ? "none" : "inline-block";
}

// 🔄 Gestion des boutons "Suivant" et "Précédent"
nextButton.addEventListener("click", () => {
  if (currentStep < 2) {
    currentStep++;
    updateModalContent(currentStep);
  } else {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");
    modal.removeEventListener("click", closeModal);
    modal
      .querySelector(".close-modal")
      .removeEventListener("click", closeModal);
    document.removeEventListener("keydown", closeOnEscape);
    modal = null;
  }
});

prevButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    updateModalContent(currentStep);
  }
});

// 📸 Injection des images dans la galerie
function injectGalleryModal(works) {
  const gallery = document.querySelector(".modal-gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.dataset.id = work.id;

    figure.innerHTML = `<img src="${work.imageUrl}" alt="${work.title}" loading="lazy" style="width: 100%;">
     <button class="delete-project" data-id="${work.id}">
        <img src="/FrontEnd/assets/icons/trash.svg" alt="Supprimer" />
      </button>
    `;
    gallery.appendChild(figure);
  });

  // Ajout des événements pour la suppression
  document.querySelectorAll(".delete-project").forEach((btn) => {
    btn.addEventListener("click", deleteProject);
  });
}

// 🔥 Récupération des travaux depuis l'API
async function fetchWork() {
  try {
    const response = await fetch("http://localhost:5678/api/works");
    if (!response.ok) throw new Error(`Erreur : ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des travaux :", error);
    return [];
  }
}

// 🏁 Initialisation de la modale à l'ouverture
document.addEventListener("DOMContentLoaded", () => {
  updateModalContent(currentStep);
});

async function deleteProject(event) {
  const projectId = event.target.dataset.id;

  if (!projectId) return;

  // Confirmation avant suppression
  const confirmation = confirm("Voulez-vous vraiment supprimer ce projet ?");
  if (!confirmation) return;

  try {
    const response = await fetch(
      `http://localhost:5678/api/works/${projectId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Erreur lors de la suppression");

    // Supprime l'élément du DOM
    document.querySelector(`figure[data-id='${projectId}']`).remove();
  } catch (error) {
    console.error("Impossible de supprimer le projet :", error);
  }
}
