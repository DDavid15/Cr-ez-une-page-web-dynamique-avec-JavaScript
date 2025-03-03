// Gestion de la modale et des fichiers uploadés

let modal = null;
let currentStep = 0;
let selectedFile = null; // Stocker le fichier sélectionné

// Fonction pour ouvrir la modale
const openModal = function (e) {
  e.preventDefault();
  modal = document.querySelector(e.target.getAttribute("href"));
  if (!modal) {
    console.error("Erreur : La modale n'a pas été trouvée.");
    return;
  }
  modal.style.display = "flex";
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");
  modal.addEventListener("click", closeModal);
  modal.querySelector(".close-modal").addEventListener("click", closeModal);
  document.addEventListener("keydown", closeOnEscape);
  currentStep = 0;
  updateModalContent(currentStep);
};

// Fonction pour fermer la modale
const closeModal = function (e) {
  if (!modal) return;
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

// Fonction pour fermer la modale avec la touche "Échap"
const closeOnEscape = function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
};

// Fonction de mise à jour du contenu de la modale
function updateModalContent(step) {
  const modalBody = document.querySelector(".modal-body");
  const titleModal = document.querySelector(".modal-header h2");
  const nextButton = document.querySelector(".next-button");
  const prevButton = document.querySelector(".prev-button");
  if (!titleModal || !modalBody) {
    console.error("Erreur : Élément non trouvé !");
    return;
  }

  if (step === 0) {
    titleModal.textContent = "Galerie photo";
    modalBody.innerHTML = `<div class="modal-gallery"></div>`;
    fetchWork().then(injectGalleryModal);
    nextButton.value = "Ajouter une photo";
    nextButton.disabled = false; // Bouton actif en step 0
    nextButton.classList.remove("disabled-step-1"); // Supprimer la classe grise
    prevButton.style.display = "none"; // Cacher le bouton "Précédent" à l'étape 0
  } else {
    prevButton.style.display = "inline-block"; // Afficher le bouton aux autres étapes
  }

  if (step === 1) {
    titleModal.textContent = "Ajout photo";
    modalBody.innerHTML = `
      <form class="add-photo-form">
        <div class="file-upload">
          <label for="file" id="upload-trigger" class="upload-container">
            <img id="preview-icon" src="/FrontEnd/assets/icons/upload-icon.svg" alt="icone d'upload">
            <p id="upload-text">+ Ajouter une photo</p>
            <p class="upload-info">jpg, png : 4mo max</p>
          </label>
          <input type="file" id="file" accept="image/*" style="display: none;">
        </div>
        <div class="input-upload">
          <label for="title">Titre</label>
          <input type="text" id="title" required>
          <label for="category">Catégories</label>
          <select id="category" required>
          </select>
        </div>
      </form>
      <p class="error-message" style="color: red; display: none;"></p>
    `;
    fetchWork().then(injectCategoryModal);
    setTimeout(setupFileUpload, 50);
    setTimeout(setupFormValidation, 50); // Vérification des champs

    nextButton.value = "Valider";
    nextButton.disabled = true; // Désactiver le bouton par défaut
    nextButton.classList.add("disabled-step-1"); // Ajouter la classe pour le Step 1

    nextButton.removeEventListener("click", submitForm); // Évite les doublons
    nextButton.addEventListener("click", submitForm);
  }
}

// Gestion des boutons navigation modale
document.querySelector(".next-button").addEventListener("click", () => {
  if (currentStep < 1) {
    currentStep++;
    updateModalContent(currentStep);
  }
});

document.querySelector(".prev-button").addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    updateModalContent(currentStep);
  }
});

//  Récupération des travaux depuis l'API
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

//  Injection des images dans la galerie
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

// Suppression d'un projet (clic sur le bouton ou l'image)
async function deleteProject(event) {
  const button = event.target.closest(".delete-project"); // Récupérer le bouton peu importe où l'on clique (image ou bouton)
  if (!button) return;

  const projectId = button.dataset.id; // Récupération de l'ID du projet

  if (!projectId) return;

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

    // Supprime l'élément du DOM (l'image et le bouton sont dans figure)
    const figureToRemove = document.querySelector(
      `figure[data-id='${projectId}']`
    );
    if (figureToRemove) {
      figureToRemove.remove();
    }
  } catch (error) {
    console.error("Impossible de supprimer le projet :", error);
  }
}

// Ajouter l'événement de suppression sur l'image et le bouton
document
  .querySelectorAll(".delete-project, .delete-project img")
  .forEach((btn) => {
    btn.addEventListener("click", deleteProject);
  });

//  Injection des catégories dans la modale step 2
function injectCategoryModal(works) {
  const selector = document.querySelector("#category");
  if (!selector) return;

  selector.innerHTML = `<option value="" selected></option>`;

  const categories = new Map();

  works.forEach((work) => {
    if (work.category && work.category.id && work.category.name) {
      categories.set(work.category.id, work.category.name);
    }
  });

  categories.forEach((categoryName, categoryId) => {
    const option = document.createElement("option");
    option.value = categoryId;
    option.textContent = categoryName;
    selector.appendChild(option);
  });
}

// Gérer l'activation/désactivation du bouton et la validation des champs en temps réel
function setupFormValidation() {
  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  const submitButton = document.querySelector(".next-button");
  const errorMessage = document.querySelector(".error-message");

  if (
    !fileInput ||
    !titleInput ||
    !categoryInput ||
    !submitButton ||
    !errorMessage
  ) {
    console.error(
      " Erreur : Un ou plusieurs éléments du formulaire sont introuvables !"
    );
    return;
  }

  function checkFormValidity() {
    const isFileSelected = fileInput.files.length > 0;
    const isTitleFilled = titleInput.value.trim() !== "";
    const isCategorySelected = categoryInput.value !== "";

    if (isFileSelected && isTitleFilled && isCategorySelected) {
      submitButton.disabled = false; // Activer le bouton
      submitButton.classList.remove("disabled-step-1");
      errorMessage.style.display = "none"; // Cacher le message d'erreur si tout est bon
    } else {
      submitButton.disabled = true; // Désactiver le bouton
      submitButton.classList.add("disabled-step-1");
      errorMessage.style.display = "block";
      errorMessage.textContent = "Tous les champs sont requis !";
    }
  }

  // Ajout des écouteurs d'événements pour surveiller les modifications en direct
  fileInput.addEventListener("change", checkFormValidity);
  titleInput.addEventListener("input", checkFormValidity);
  categoryInput.addEventListener("change", checkFormValidity);

  // Vérification initiale au chargement
  checkFormValidity();
}

// Gestion de l'upload de fichiers
function setupFileUpload() {
  const fileInput = document.getElementById("file");
  const uploadTrigger = document.getElementById("upload-trigger");

  if (!fileInput || !uploadTrigger) {
    console.error("❌ Élément `file` ou `upload-trigger` introuvable !");
    return;
  }

  uploadTrigger.removeEventListener("click", handleUploadClick);
  uploadTrigger.addEventListener("click", handleUploadClick);

  //  Gérer la prévisualisation de l'image
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadTrigger.innerHTML = `
            <img src="${e.target.result}" alt="Aperçu de l'image" 
                 id="preview-image">
          `;
      };
      reader.readAsDataURL(file);
    } else {
      console.error("Le fichier sélectionné n'est pas une image.");
    }
  });
}

// Fonction pour gérer le clic sur l'upload-trigger
function handleUploadClick(event) {
  event.preventDefault(); // Empêche un double déclenchement accidentel
  const fileInput = document.getElementById("file");
  if (fileInput) {
    fileInput.click();
  }
}

// Initialisation de la modale
document.querySelectorAll(".js-modal").forEach((btn) => {
  btn.addEventListener("click", openModal);
});

// Gestion de la soumission du formulaire
async function submitForm(event) {
  event.preventDefault();

  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  const errorMessage = document.querySelector(".error-message");
  const token = localStorage.getItem("token");

  if (!fileInput || !titleInput || !categoryInput || !errorMessage) {
    console.error(
      "Erreur : Un ou plusieurs champs du formulaire sont introuvables."
    );
    return;
  }

  if (!token) {
    showError(errorMessage, "Vous devez être connecté pour ajouter un projet.");
    console.error("Erreur : Aucun token trouvé.");
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);
  formData.append("title", titleInput.value.trim());
  formData.append("category", parseInt(categoryInput.value, 10));

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de l'ajout du projet: ${response.statusText}`
      );
    }

    console.log("Projet ajouté avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'envoi du formulaire :", error);
    showError(errorMessage, "Une erreur est survenue lors de l'envoi.");
  }
}

// Fonction pour afficher les erreurs
function showError(element, message) {
  element.style.display = "block";
  element.textContent = message;
}
