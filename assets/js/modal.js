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
  modal.removeAttribute("inert");
  modal.setAttribute("aria-modal", "true");

  // Met le focus sur le premier élément focusable
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusableElements.length) {
    focusableElements[0].focus();
  }

  // Ajout des événements
  document.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", closeOnEscape, { once: true });

  modal.addEventListener("click", closeModal);
  modal.querySelector(".close-modal").addEventListener("click", closeModal);

  currentStep = 0;
  updateModalContent(currentStep);
};

// Fonction pour fermer la modale
const closeModal = function (e) {
  if (!modal) return;

  if (e.type === "keydown" && e.key !== "Escape" && e.key !== "Esc") {
    return; // Ne ferme que si la touche "Échap" est pressée
  }

  if (
    e.type === "keydown" ||
    e.target === modal ||
    e.target.classList.contains("close-modal")
  ) {
    modal.style.display = "none";
    modal.setAttribute("inert", "");
    modal.removeAttribute("aria-modal");

    modal.removeEventListener("click", closeModal);
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

// Fonction pour gérer la navigation avec la tabulation
const trapFocus = (event) => {
  if (!modal) return;

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey) {
      // Si Shift + Tab est pressé sur le premier élément, on revient au dernier
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Si Tab est pressé sur le dernier élément, on revient au premier
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

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

    // Nettoyer le contenu
    modalBody.innerHTML = "";

    // Ajouter dynamiquement la galerie
    const galleryDiv = document.createElement("div");
    galleryDiv.classList.add("modal-gallery");
    modalBody.appendChild(galleryDiv);

    fetchWork().then(injectGalleryModal);

    nextButton.value = "Ajouter une photo";
    nextButton.disabled = false;
    nextButton.classList.remove("disabled-step-1");
    nextButton.classList.add("activate-button");
    prevButton.style.display = "none";
  } else {
    prevButton.style.display = "inline-block";
  }

  if (step === 1) {
    titleModal.textContent = "Ajout photo";

    // Nettoyer le contenu
    modalBody.innerHTML = "";

    // Création du formulaire dynamiquement
    const form = document.createElement("form");
    form.classList.add("add-photo-form");

    // Bloc d'upload de fichier
    const fileUploadDiv = document.createElement("div");
    fileUploadDiv.classList.add("file-upload");

    const label = document.createElement("label");
    label.htmlFor = "file";
    label.id = "upload-trigger";
    label.classList.add("upload-container");

    const img = document.createElement("img");
    img.id = "preview-icon";
    img.src = "/FrontEnd/assets/icons/upload-icon.svg";
    img.alt = "icone d'upload";

    const p1 = document.createElement("p");
    p1.id = "upload-text";
    p1.textContent = "+ Ajouter une photo";

    const p2 = document.createElement("p");
    p2.classList.add("upload-info");
    p2.textContent = "jpg, png : 4mo max";

    label.append(img, p1, p2);
    fileUploadDiv.appendChild(label);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileUploadDiv.appendChild(fileInput);

    // Bloc d'input pour titre et catégorie
    const inputDiv = document.createElement("div");
    inputDiv.classList.add("input-upload");

    const titleLabel = document.createElement("label");
    titleLabel.htmlFor = "title";
    titleLabel.textContent = "Titre";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.id = "title";
    titleInput.required = true;
    titleInput.autocomplete = "off";

    const categoryLabel = document.createElement("label");
    categoryLabel.htmlFor = "category";
    categoryLabel.textContent = "Catégories";

    const selectWrapper = document.createElement("div");
    selectWrapper.classList.add("select-wrapper");

    const select = document.createElement("select");
    select.id = "category";
    select.required = true;
    select.autocomplete = "off";

    const chevronImg = document.createElement("img");
    chevronImg.src = "/FrontEnd/assets/icons/chevron-categories.svg";
    chevronImg.alt = "chevron";
    chevronImg.classList.add("chevron-icon");

    selectWrapper.append(select, chevronImg);
    inputDiv.append(titleLabel, titleInput, categoryLabel, selectWrapper);

    // Message d'erreur
    const errorMsg = document.createElement("p");
    errorMsg.classList.add("error-message");
    errorMsg.style.color = "red";
    errorMsg.style.display = "none";

    // Ajout des éléments au formulaire
    form.append(fileUploadDiv, inputDiv);
    modalBody.append(form, errorMsg);

    // Initialisation des événements et données
    fetchCategory().then(injectCategoryModal);
    setupFileUpload();
    setupFormValidation();

    nextButton.value = "Valider";
    nextButton.disabled = true;
    nextButton.classList.add("disabled-step-1");
    nextButton.classList.remove("activate-button");

    nextButton.removeEventListener("click", submitForm);
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
  const button = event.target.closest(".delete-project");
  if (!button) return;

  const projectId = parseInt(button.dataset.id, 10);
  if (!projectId) return;

  try {
    // 1 Envoyer la requête API AVANT de modifier le DOM
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

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression");
    }

    // 2 Mettre à jour le cache (supprimer du tableau `cachedWorks`)
    cachedWorks = cachedWorks.filter((work) => work.id !== projectId);

    // 3 Supprimer l’élément du DOM après la confirmation de l’API
    const modalGalleryFigure = document.querySelector(
      `.modal-gallery figure[data-id='${projectId}']`
    );
    if (modalGalleryFigure) {
      modalGalleryFigure.remove();
    }

    const mainGalleryFigure = document.querySelector(
      `.gallery figure[data-id='${projectId}']`
    );
    if (mainGalleryFigure) {
      mainGalleryFigure.remove();
    }

    // 4 Mise à jour unique de la galerie principale
    displayWorks(cachedWorks);
  } catch (error) {
    console.error("❌ Impossible de supprimer le projet :", error);
  }
}

// Ajouter l'événement de suppression sur l'image et le bouton
document
  .querySelectorAll(".delete-project, .delete-project img")
  .forEach((btn) => {
    btn.addEventListener("click", deleteProject);
  });

//  Récupération des catégories depuis l'API
async function fetchCategory() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    if (!response.ok) throw new Error(`Erreur : ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des categories :", error);
    return [];
  }
}
//  Injection des catégories dans la modale step 1
function injectCategoryModal(cat) {
  const selector = document.querySelector("#category");
  if (!selector) return;

  selector.innerHTML = `<option value="" selected></option>`;

  const categories = new Map();

  cat.forEach((work) => {
    if (work.id && work.name) {
      categories.set(work.id, work.name);
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
      "❌ Erreur : Un ou plusieurs éléments du formulaire sont introuvables !"
    );
    return;
  }

  function checkFormValidity() {
    const isFileSelected = fileInput.files.length > 0;
    const isTitleFilled = titleInput.value.trim() !== "";
    const isCategorySelected = categoryInput.value !== "";

    if (!isFileSelected) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Veuillez ajouter une image valide.";
      submitButton.disabled = true;
      submitButton.classList.add("disabled-step-1"); // Ajout d'une classe de désactivation
      submitButton.classList.remove("activate-button");

      return;
    }

    if (!isTitleFilled || !isCategorySelected) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Tous les champs sont requis !";
      submitButton.disabled = true;
      submitButton.classList.add("disabled-step-1");
      submitButton.classList.remove("activate-button");

      return;
    }

    // Tout est valide, suppression des erreurs et activation du bouton
    errorMessage.style.display = "none";
    submitButton.disabled = false;
    submitButton.classList.remove("disabled-step-1"); // Suppression de la classe de désactivation
    submitButton.classList.add("activate-button");
  }

  // Écoute des changements sur les champs
  fileInput.addEventListener("change", checkFormValidity);
  titleInput.addEventListener("input", checkFormValidity);
  categoryInput.addEventListener("change", checkFormValidity);

  // Vérification initiale au chargement
  checkFormValidity();
}

// Gestion de l'upload de fichiers avec validation et feedback utilisateur
function setupFileUpload() {
  const fileInput = document.getElementById("file");
  const uploadTrigger = document.getElementById("upload-trigger");
  const errorMessage = document.querySelector(".error-message");
  const submitButton = document.querySelector(".next-button");

  if (!fileInput || !uploadTrigger || !errorMessage || !submitButton) {
    console.error("❌ Élément manquant dans le formulaire !");
    return;
  }

  uploadTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    fileInput.click();
  });

  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const validFormats = ["image/jpeg", "image/png"];
    if (!validFormats.includes(file.type)) {
      errorMessage.style.display = "block";
      errorMessage.textContent =
        "Format non supporté. Veuillez choisir un fichier JPG ou PNG.";
      fileInput.value = "";
      submitButton.disabled = true;
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Fichier trop volumineux (max 4 Mo).";
      fileInput.value = "";
      submitButton.disabled = true;
      return;
    }

    // Si tout est bon, afficher l'aperçu de l'image
    errorMessage.style.display = "none";
    submitButton.disabled = false;

    const reader = new FileReader();
    reader.onload = function (e) {
      uploadTrigger.innerHTML = `
          <img src="${e.target.result}" alt="Aperçu de l'image" id="preview-image">
        `;
    };
    reader.readAsDataURL(file);
  });
}

// Fonction d'affichage des erreurs
function showError(element, message) {
  element.style.display = "block";
  element.textContent = message;
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

// Fonction d'envoi des données à l'API avec mise à jour immédiate
async function submitForm(event) {
  event.preventDefault();

  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  const errorMessage = document.querySelector(".error-message");
  const successMessage = document.createElement("p");
  successMessage.style.color = "green";
  successMessage.style.display = "none";

  const token = localStorage.getItem("token");

  if (!fileInput.files[0] || !titleInput.value.trim() || !categoryInput.value) {
    showError(errorMessage, "Tous les champs sont requis !");
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);
  formData.append("title", titleInput.value.trim());
  formData.append("category", parseInt(categoryInput.value, 10));

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de l'ajout du projet: ${response.statusText}`
      );
    }

    const newProject = await response.json();

    if (!newProject.id) {
      throw new Error("L'API n'a pas retourné d'ID valide.");
    }

    // Ajouter le projet UNIQUEMENT s'il n'est pas déjà dans cachedWorks
    if (!cachedWorks.some((work) => work.id === newProject.id)) {
      cachedWorks.push(newProject);
    }

    // Mise à jour immédiate de la galerie
    displayWorks(cachedWorks);

    // Affichage du message de succès
    successMessage.textContent = "Projet ajouté avec succès !";
    successMessage.style.display = "block";
    errorMessage.style.display = "none";

    // Réinitialisation du formulaire après ajout
    resetForm();
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du formulaire :", error);
    showError(
      errorMessage,
      "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
    );
  }
}

// Fonction pour réinitialiser le formulaire après un ajout réussi
function resetForm() {
  document.getElementById("file").value = "";
  document.getElementById("title").value = "";
  document.getElementById("category").value = "";
  document.querySelector(".next-button").disabled = true;
  document.querySelector(".next-button").classList.remove("activate-button");
  document.querySelector(".next-button").classList.add("disabled-step-1");

  // Réinitialisation de l'aperçu de l'image
  const uploadTrigger = document.getElementById("upload-trigger");
  if (uploadTrigger) {
    uploadTrigger.innerHTML = `
        <img id="preview-icon" src="/FrontEnd/assets/icons/upload-icon.svg" alt="icone d'upload">
        <p id="upload-text">+ Ajouter une photo</p>
        <p class="upload-info">jpg, png : 4mo max</p>
      `;
  }
}

// Fonction pour afficher les erreurs
function showError(element, message) {
  element.style.display = "block";
  element.textContent = message;
}
