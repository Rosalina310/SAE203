// Dans votre fichier admin.js
// Tout en haut de admin.js
console.log("admin.js chargé !");

function ouvrirModal(modalId) {
    // ... (ton code pour ouvrir la modale)
}
// ... le reste de ton JS
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active'); // Ou 'visible', ou changer 'display' en 'block'
        document.body.classList.add('modal-open'); // Pour empêcher le défilement du corps
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active'); // Ou 'visible', ou changer 'display' en 'none'
        document.body.classList.remove('modal-open');
    }
}

// admin.js

// Variable to store the ID of the media to be deleted
let mediaToDeleteId = null;

// Function to handle media deletion
function supprimerMedia(mediaId) {
    mediaToDeleteId = mediaId;
    // Check if Bootstrap Modal is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const confirmDeleteModalElement = document.getElementById('confirmDeleteModal');
        if (confirmDeleteModalElement) {
            const confirmDeleteModal = new bootstrap.Modal(confirmDeleteModalElement);
            confirmDeleteModal.show();
        } else {
            console.error("Modal element 'confirmDeleteModal' not found.");
            // Fallback to alert if modal is not found
            if (confirm('Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.')) {
                executeDelete(mediaId);
            }
        }
    } else {
        console.warn("Bootstrap Modal not loaded. Falling back to alert confirmation.");
        if (confirm('Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.')) {
            executeDelete(mediaId);
        }
    }
}

// Function to handle media modification
function modifierMedia(mediaId) {
    console.log("Modifier le média avec l'ID : " + mediaId);
    // Redirect to an edit page or open a modal with an edit form
    // Replace 'edit_media.php' with the actual path to your media editing page
    window.location.href = 'edit_media.php?id=' + mediaId;
}

// Function to close any Bootstrap modal by its ID
function fermerModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        // Check if Bootstrap Modal is available
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            } else {
                // If instance not found, create one and hide (might be already hidden)
                const newModal = new bootstrap.Modal(modalElement);
                newModal.hide();
            }
        } else {
            console.warn("Bootstrap Modal not loaded. Cannot close modal via JavaScript.");
            // As a fallback, you might manually hide it if it's a simple modal
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }
}

// Logic for the delete confirmation button within the modal
document.addEventListener('DOMContentLoaded', function() {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (mediaToDeleteId) {
                executeDelete(mediaToDeleteId);
                // Hide the modal after initiating deletion
                const confirmDeleteModalElement = document.getElementById('confirmDeleteModal');
                if (confirmDeleteModalElement) {
                    const confirmDeleteModal = bootstrap.Modal.getInstance(confirmDeleteModalElement);
                    if (confirmDeleteModal) {
                        confirmDeleteModal.hide();
                    }
                }
                mediaToDeleteId = null; // Reset the stored ID
            }
        });
    } else {
        console.warn("Button 'confirmDeleteBtn' not found. Delete confirmation will not work via modal.");
    }
});

// Helper function to execute the delete AJAX request
function executeDelete(id) {
    console.log("Exécution de la suppression du média avec l'ID : " + id);

    fetch('delete_media.php', { // Make sure 'delete_media.php' is the correct path to your deletion script
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'id=' + id
    })
    .then(response => {
        // Check if response is JSON, otherwise parse as text
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Erreur de parsing JSON, réponse : ', text);
                    throw new Error('La réponse du serveur n\'est pas au format JSON attendu.');
                }
            });
        }
    })
    .then(data => {
        if (data.success) {
            alert('Média supprimé avec succès!');
            // Reload the page to reflect changes
            window.location.reload();
        } else {
            alert('Erreur lors de la suppression du média: ' + (data.message || 'Erreur inconnue.'));
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la suppression. Veuillez vérifier la console pour plus de détails.');
    });
}
