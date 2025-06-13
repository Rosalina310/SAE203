/**
 * JavaScript pour l'interface administrateur - Médiathèque Livresse
 */

// =============================================
// VARIABLES GLOBALES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// GESTION DE LA NAVIGATION
// =============================================
function initializeEventListeners() {
    // Menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fermeture des modales au clic sur overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            fermerModal(e.target.id);
        }
    });
    
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            fermerModal(currentModal);
        }
    });
    
    // Fermeture automatique des alertes
    initializeAlerts();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

function initializeResponsive() {
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.remove('active');
            mainContent.classList.remove('expanded');
        }
    });
}

// =============================================
// GESTION DES MODALES
// =============================================
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier champ du formulaire
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        currentModal = null;
        document.body.style.overflow = '';
        
        // Reset du formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
        }
    }
}

// Fonctions spécifiques pour chaque modal
function ouvrirModalNouvelEmprunt() {
    ouvrirModal('modalNouvelEmprunt');
}

function ouvrirModalNouveauMedia() {
    ouvrirModal('modalNouveauMedia');
}

function ouvrirModalNouvelAdherent() {
    ouvrirModal('modalNouvelAdherent');
}

// =============================================
// GESTION DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Validation required
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    }
    
    // Validation email
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        }
    }
    
    // Validation numérique
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseInt(value) < parseInt(min)) {
            isValid = false;
            errorMessage = `Valeur minimum : ${min}`;
        }
        
        if (max && parseInt(value) > parseInt(max)) {
            isValid = false;
            errorMessage = `Valeur maximum : ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// =============================================
// HANDLERS DES FORMULAIRES
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            updateEmpruntsRecents();
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    if (!confirm('Confirmer la prolongation de cet emprunt ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt prolongé avec succès !', 'success');
            updateEmpruntsRecents();
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function relancerAdherent(empruntId) {
    try {
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// =============================================
// MISE À JOUR DYNAMIQUE
// =============================================
async function updateStatistics() {
    try {
        const response = await fetch('ajax/get_statistiques.php');
        const stats = await response.json();
        
        if (stats.success) {
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.total_objets);
            
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_cours);
            
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_retard);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques:', error);
    }
}

async function updateEmpruntsRecents() {
    try {
        const response = await fetch('ajax/get_emprunts_recents.php');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('.recent-loans-section tbody');
            if (tbody) {
                tbody.innerHTML = result.html;
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour emprunts récents:', error);
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
        <button type="button" class="alert-close">&times;</button>
        ${message}
    `;
    
    const container = document.querySelector('.flash-messages') || 
                     createNotificationContainer();
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.alert-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '3000';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert-dismissible');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(alert);
            });
        }
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                removeNotification(alert);
            }
        }, 5000);
    });
}

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// GESTION DES ERREURS GLOBALES
// =============================================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejetée:', e.reason);
    showNotification('Erreur de connexion au serveur', 'error');
});

/**
 * JavaScript pour l'interface administrateur - Médiathèque Livresse
 */

// =============================================
// VARIABLES GLOBALES
// =============================================
let currentEmpruntId = null; // Pour les actions sur les emprunts

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE EMPRUNTS
// =============================================
function initializeEmpruntsPage() {
    // Calcul automatique de la date de retour
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (dureeInput && dateRetourInput) {
        dureeInput.addEventListener('input', calculateReturnDate);
        calculateReturnDate(); // Calcul initial
    }
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function calculateReturnDate() {
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (!dureeInput || !dateRetourInput) return;
    
    const duree = parseInt(dureeInput.value) || 21;
    const today = new Date();
    const returnDate = new Date(today.getTime() + (duree * 24 * 60 * 60 * 1000));
    
    dateRetourInput.value = returnDate.toLocaleDateString('fr-FR');
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N : Nouvel emprunt
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelEmprunt();
    }
    
    // Échap : Fermer modal
    if (e.key === 'Escape' && currentModal) {
        fermerModal(currentModal);
    }
    
    // F3 : Focus sur la recherche
    if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
}

// =============================================
// GESTION DES FILTRES
// =============================================
function submitFilters() {
    const form = document.getElementById('filtersForm');
    if (form) {
        form.submit();
    }
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function marquerRendu(empruntId) {
    currentEmpruntId = empruntId;
    
    // Récupérer les détails de l'emprunt
    try {
        const response = await fetch(`ajax/get_emprunt_details.php?id=${empruntId}`);
        const result = await response.json();
        
        if (result.success) {
            // Remplir les détails dans la modal
            const detailsContainer = document.getElementById('detailsRetour');
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Média :</span>
                    <span class="detail-value">${result.data.titre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emprunteur :</span>
                    <span class="detail-value">${result.data.emprunteur}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date d'emprunt :</span>
                    <span class="detail-value">${result.data.date_emprunt}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date de retour prévue :</span>
                    <span class="detail-value">${result.data.date_retour_prevue}</span>
                </div>
            `;
            
            ouvrirModal('modalConfirmationRetour');
        } else {
            showNotification('Impossible de récupérer les détails de l\'emprunt', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        // Fallback : confirmation simple
        if (confirm('Confirmer le retour de cet emprunt ?')) {
            effectuerRetour(empruntId);
        }
    }
}

async function effectuerRetour(empruntId) {
    const btnConfirmer = document.getElementById('btnConfirmerRetour');
    
    try {
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
            btnConfirmer.textContent = 'Traitement...';
        }
        
        const response = await fetch('ajax/retourner_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt marqué comme rendu !', 'success');
            fermerModal('modalConfirmationRetour');
            
            // Rafraîchir la ligne dans le tableau
            updateEmpruntRow(empruntId, 'rendu');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors du retour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.textContent = 'Confirmer le retour';
        }
    }
}

function updateEmpruntRow(empruntId, newStatus) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge status-${newStatus}`;
        statusBadge.textContent = newStatus === 'rendu' ? 'Rendu' : newStatus;
    }
    
    // Remplacer les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell && newStatus === 'rendu') {
        actionsCell.innerHTML = '<span class="text-muted">-</span>';
    }
    
    // Supprimer la classe overdue si applicable
    row.classList.remove('overdue');
    
    // Animation de mise à jour
    row.classList.add('success-highlight');
    setTimeout(() => {
        row.classList.remove('success-highlight');
    }, 2000);
}

// =============================================
// HANDLERS DES FORMULAIRES SPÉCIALISÉS
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enregistrer l\'emprunt';
    }
}

// =============================================
// GESTION AMÉLIORÉE DES MODALES
// =============================================

// =============================================
// GESTION DE LA NAVIGATION
// =============================================
function initializeEventListeners() {
    // Menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fermeture des modales au clic sur overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            fermerModal(e.target.id);
        }
    });
    
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            fermerModal(currentModal);
        }
    });
    
    // Fermeture automatique des alertes
    initializeAlerts();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

function initializeResponsive() {
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.remove('active');
            mainContent.classList.remove('expanded');
        }
    });
}

// =============================================
// GESTION AMÉLIORÉE DES MODALES
// =============================================
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier champ du formulaire
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Gestion spéciale pour la modal de confirmation
        if (modalId === 'modalConfirmationRetour') {
            const btnConfirmer = document.getElementById('btnConfirmerRetour');
            if (btnConfirmer) {
                btnConfirmer.onclick = () => effectuerRetour(currentEmpruntId);
            }
        }
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        currentModal = null;
        currentEmpruntId = null;
        document.body.style.overflow = '';
        
        // Reset du formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
            
            // Recalculer la date de retour après reset
            if (modalId === 'modalNouvelEmprunt') {
                setTimeout(calculateReturnDate, 100);
            }
        }
    }
}

// =============================================
// VALIDATION AMÉLIORÉE DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validations spécifiques pour les emprunts
    if (form.id === 'formNouvelEmprunt') {
        const mediaId = form.querySelector('#media_id').value;
        const adherentId = form.querySelector('#adherent_id').value;
        
        if (!mediaId) {
            showFieldError(form.querySelector('#media_id'), 'Veuillez sélectionner un média');
            isValid = false;
        }
        
        if (!adherentId) {
            showFieldError(form.querySelector('#adherent_id'), 'Veuillez sélectionner un emprunteur');
            isValid = false;
        }
    }
    
    return isValid;
}

// =============================================
// ACTIONS ÉTENDUES SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    // Demander la durée de prolongation
    const jours = prompt('Nombre de jours de prolongation (1-30) :', '14');
    
    if (jours === null) return; // Annulé
    
    const joursNum = parseInt(jours);
    if (isNaN(joursNum) || joursNum < 1 || joursNum > 30) {
        showNotification('Durée invalide (1-30 jours)', 'error');
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                jours: joursNum,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Emprunt prolongé de ${joursNum} jours !`, 'success');
            
            // Mettre à jour la ligne
            updateEmpruntDateRetour(empruntId, result.data.nouvelle_date_retour);
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateEmpruntDateRetour(empruntId, nouvelleDateRetour) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    const returnDateCell = row.querySelector('.return-date');
    if (returnDateCell) {
        // Supprimer l'info de retard s'il y en avait
        const retardInfo = returnDateCell.querySelector('.retard-info');
        if (retardInfo) {
            retardInfo.remove();
        }
        
        // Mettre à jour la date
        returnDateCell.firstChild.textContent = nouvelleDateRetour;
        
        // Supprimer la classe overdue
        row.classList.remove('overdue');
        
        // Animation de mise à jour
        returnDateCell.classList.add('success-highlight');
        setTimeout(() => {
            returnDateCell.classList.remove('success-highlight');
        }, 2000);
    }
}

async function relancerAdherent(empruntId) {
    const btnRelancer = document.querySelector(`[onclick="relancerAdherent(${empruntId})"]`);
    
    try {
        if (btnRelancer) {
            btnRelancer.classList.add('loading');
            btnRelancer.disabled = true;
        }
        
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
            
            // Marquer visuellement que la relance a été envoyée
            if (btnRelancer) {
                btnRelancer.textContent = 'Relancé';
                btnRelancer.style.opacity = '0.6';
                
                // Réactiver après 5 secondes
                setTimeout(() => {
                    btnRelancer.textContent = 'Relancer';
                    btnRelancer.style.opacity = '1';
                    btnRelancer.disabled = false;
                }, 5000);
            }
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnRelancer) {
            btnRelancer.classList.remove('loading');
            btnRelancer.disabled = false;
        }
    }
}

// =============================================
// UTILITAIRES SUPPLÉMENTAIRES
// =============================================
function highlightOverdueLoans() {
    const rows = document.querySelectorAll('.emprunt-row');
    rows.forEach(row => {
        const retardInfo = row.querySelector('.retard-info');
        if (retardInfo) {
            row.classList.add('highlight-overdue');
        }
    });
}

function exportEmprunts() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `emprunts.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// Initialiser les highlights au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(highlightOverdueLoans, 500);
});

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================

// Fonctions spécifiques pour chaque modal
function ouvrirModalNouvelEmprunt() {
    ouvrirModal('modalNouvelEmprunt');
}

function ouvrirModalNouveauMedia() {
    ouvrirModal('modalNouveauMedia');
}

function ouvrirModalNouvelAdherent() {
    ouvrirModal('modalNouvelAdherent');
}

// =============================================
// GESTION DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Validation required
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    }
    
    // Validation email
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        }
    }
    
    // Validation numérique
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseInt(value) < parseInt(min)) {
            isValid = false;
            errorMessage = `Valeur minimum : ${min}`;
        }
        
        if (max && parseInt(value) > parseInt(max)) {
            isValid = false;
            errorMessage = `Valeur maximum : ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// =============================================
// HANDLERS DES FORMULAIRES
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            updateEmpruntsRecents();
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    if (!confirm('Confirmer la prolongation de cet emprunt ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt prolongé avec succès !', 'success');
            updateEmpruntsRecents();
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function relancerAdherent(empruntId) {
    try {
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// =============================================
// MISE À JOUR DYNAMIQUE
// =============================================
async function updateStatistics() {
    try {
        const response = await fetch('ajax/get_statistiques.php');
        const stats = await response.json();
        
        if (stats.success) {
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.total_objets);
            
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_cours);
            
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_retard);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques:', error);
    }
}

async function updateEmpruntsRecents() {
    try {
        const response = await fetch('ajax/get_emprunts_recents.php');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('.recent-loans-section tbody');
            if (tbody) {
                tbody.innerHTML = result.html;
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour emprunts récents:', error);
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
        <button type="button" class="alert-close">&times;</button>
        ${message}
    `;
    
    const container = document.querySelector('.flash-messages') || 
                     createNotificationContainer();
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.alert-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '3000';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert-dismissible');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(alert);
            });
        }
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                removeNotification(alert);
            }
        }, 5000);
    });
}

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// GESTION DES ERREURS GLOBALES
// =============================================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejetée:', e.reason);
    showNotification('Erreur de connexion au serveur', 'error');
});

/**
 * JavaScript pour l'interface administrateur - Médiathèque Livresse
 */

// =============================================
// VARIABLES GLOBALES
// =============================================
currentModal = null;
isMobile = window.innerWidth <= 768;
currentEmpruntId = null; // Pour les actions sur les emprunts

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE EMPRUNTS
// =============================================
function initializeEmpruntsPage() {
    // Calcul automatique de la date de retour
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (dureeInput && dateRetourInput) {
        dureeInput.addEventListener('input', calculateReturnDate);
        calculateReturnDate(); // Calcul initial
    }
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function calculateReturnDate() {
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (!dureeInput || !dateRetourInput) return;
    
    const duree = parseInt(dureeInput.value) || 21;
    const today = new Date();
    const returnDate = new Date(today.getTime() + (duree * 24 * 60 * 60 * 1000));
    
    dateRetourInput.value = returnDate.toLocaleDateString('fr-FR');
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N : Nouvel emprunt
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelEmprunt();
    }
    
    // Échap : Fermer modal
    if (e.key === 'Escape' && currentModal) {
        fermerModal(currentModal);
    }
    
    // F3 : Focus sur la recherche
    if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
}

// =============================================
// GESTION DES FILTRES
// =============================================
function submitFilters() {
    const form = document.getElementById('filtersForm');
    if (form) {
        form.submit();
    }
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function marquerRendu(empruntId) {
    currentEmpruntId = empruntId;
    
    // Récupérer les détails de l'emprunt
    try {
        const response = await fetch(`ajax/get_emprunt_details.php?id=${empruntId}`);
        const result = await response.json();
        
        if (result.success) {
            // Remplir les détails dans la modal
            const detailsContainer = document.getElementById('detailsRetour');
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Média :</span>
                    <span class="detail-value">${result.data.titre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emprunteur :</span>
                    <span class="detail-value">${result.data.emprunteur}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date d'emprunt :</span>
                    <span class="detail-value">${result.data.date_emprunt}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date de retour prévue :</span>
                    <span class="detail-value">${result.data.date_retour_prevue}</span>
                </div>
            `;
            
            ouvrirModal('modalConfirmationRetour');
        } else {
            showNotification('Impossible de récupérer les détails de l\'emprunt', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        // Fallback : confirmation simple
        if (confirm('Confirmer le retour de cet emprunt ?')) {
            effectuerRetour(empruntId);
        }
    }
}

async function effectuerRetour(empruntId) {
    const btnConfirmer = document.getElementById('btnConfirmerRetour');
    
    try {
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
            btnConfirmer.textContent = 'Traitement...';
        }
        
        const response = await fetch('ajax/retourner_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt marqué comme rendu !', 'success');
            fermerModal('modalConfirmationRetour');
            
            // Rafraîchir la ligne dans le tableau
            updateEmpruntRow(empruntId, 'rendu');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors du retour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.textContent = 'Confirmer le retour';
        }
    }
}

function updateEmpruntRow(empruntId, newStatus) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge status-${newStatus}`;
        statusBadge.textContent = newStatus === 'rendu' ? 'Rendu' : newStatus;
    }
    
    // Remplacer les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell && newStatus === 'rendu') {
        actionsCell.innerHTML = '<span class="text-muted">-</span>';
    }
    
    // Supprimer la classe overdue si applicable
    row.classList.remove('overdue');
    
    // Animation de mise à jour
    row.classList.add('success-highlight');
    setTimeout(() => {
        row.classList.remove('success-highlight');
    }, 2000);
}

// =============================================
// HANDLERS DES FORMULAIRES SPÉCIALISÉS
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enregistrer l\'emprunt';
    }
}

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// =============================================
currentMediaId = null; // Pour les actions sur les médias

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE STOCK
// =============================================
function initializeStockPage() {
    // Vérifier si on est sur la page stock
    if (!document.querySelector('.stock-table')) return;
    
    // Auto-soumission des filtres avec délai pour le stock
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Initialiser les indicateurs de stock
    highlightLowStock();
    
    // Gestion des raccourcis clavier spécifiques au stock
    document.addEventListener('keydown', handleStockKeyboardShortcuts);
}

function highlightLowStock() {
    const rows = document.querySelectorAll('.media-row');
    rows.forEach(row => {
        const availabilityInfo = row.querySelector('.availability-info');
        if (availabilityInfo) {
            const availableCount = parseInt(availabilityInfo.querySelector('.count-number').textContent);
            const totalCount = parseInt(availabilityInfo.querySelector('.total-number').textContent);
            
            // Marquer les stocks faibles (moins de 20% disponible)
            if (totalCount > 0 && (availableCount / totalCount) < 0.2 && availableCount > 0) {
                row.classList.add('low-stock');
            }
            
            // Marquer les ruptures de stock
            if (availableCount === 0) {
                row.classList.add('out-of-stock');
            }
        }
    });
}

function handleStockKeyboardShortcuts(e) {
    // Ctrl/Cmd + M : Nouveau média
    if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouveauMedia();
    }
    
    // Ctrl/Cmd + E : Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !currentModal) {
        e.preventDefault();
        exportStock();
    }
}

// =============================================
// ACTIONS SUR LES MÉDIAS
// =============================================
async function voirDetailsMedia(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_media_details.php?id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre de la modal
            document.getElementById('detailsMediaTitle').textContent = `Détails - ${data.titre}`;
            
            // Construire le contenu
            const content = `
                <div class="details-grid">
                    <div class="detail-section">
                        <h4>Informations générales</h4>
                        <div class="detail-item">
                            <span class="detail-label">ID</span>
                            <span class="detail-value">#${String(data.id).padStart(3, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Titre</span>
                            <span class="detail-value">${data.titre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Auteur/Artiste</span>
                            <span class="detail-value">${data.auteur}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${data.type_nom}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Genre</span>
                            <span class="detail-value">${data.genre || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Éditeur</span>
                            <span class="detail-value">${data.editeur || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Année</span>
                            <span class="detail-value">${data.date_parution || 'Non spécifiée'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">État général</span>
                            <span class="detail-value">${data.etat_conservation}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Disponibilité</h4>
                        <div class="detail-item">
                            <span class="detail-label">Exemplaires total</span>
                            <span class="detail-value">${data.total_exemplaires}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Disponibles</span>
                            <span class="detail-value" style="color: #28a745; font-weight: 600;">${data.exemplaires_disponibles}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Empruntés</span>
                            <span class="detail-value" style="color: #dc3545; font-weight: 600;">${data.exemplaires_empruntes}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Taux d'emprunt</span>
                            <span class="detail-value">${Math.round((data.exemplaires_empruntes / data.total_exemplaires) * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Liste des exemplaires</h4>
                    <div class="exemplaires-list">
                        ${data.exemplaires.map(ex => `
                            <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                                <div class="exemplaire-info">
                                    <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                    <span class="exemplaire-etat">${ex.etat}</span>
                                </div>
                                <div class="exemplaire-status">
                                    <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                        ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                    </span>
                                    ${ex.emprunteur ? `<span style="font-size: 0.7rem; color: #666; margin-left: 0.5rem;">par ${ex.emprunteur}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('detailsMediaContent').innerHTML = content;
            
            // Configurer le bouton modifier
            document.getElementById('btnModifierDepuisDetails').onclick = () => {
                fermerModal('modalDetailsMedia');
                modifierMedia(mediaId);
            };
            
            ouvrirModal('modalDetailsMedia');
        } else {
            showNotification('Impossible de récupérer les détails du média', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function modifierMedia(mediaId) {
    // Pour l'instant, on affiche une notification
    // Tu peux implémenter une vraie modal de modification plus tard
    showNotification('Fonctionnalité de modification en cours de développement', 'info');
}

async function gererExemplaires(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_exemplaires.php?media_id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('exemplairesMediaTitle').textContent = 
                `Exemplaires - ${data.media_titre}`;
            
            // Construire la liste des exemplaires
            const content = `
                <div class="exemplaires-summary">
                    <p><strong>Total :</strong> ${data.exemplaires.length} exemplaire(s)</p>
                    <p><strong>Disponibles :</strong> ${data.exemplaires.filter(ex => ex.disponible).length}</p>
                    <p><strong>Empruntés :</strong> ${data.exemplaires.filter(ex => !ex.disponible).length}</p>
                </div>
                
                <div class="exemplaires-list">
                    ${data.exemplaires.map(ex => `
                        <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                            <div class="exemplaire-info">
                                <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                <span class="exemplaire-etat">${ex.etat}</span>
                                ${ex.date_acquisition ? `<span class="exemplaire-date">Ajouté le ${ex.date_acquisition}</span>` : ''}
                            </div>
                            <div class="exemplaire-actions">
                                <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                    ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                </span>
                                ${ex.disponible ? `
                                    <button class="btn-mini btn-mini-edit" onclick="modifierExemplaire(${ex.id})">Modifier</button>
                                    <button class="btn-mini btn-mini-delete" onclick="supprimerExemplaire(${ex.id})">Supprimer</button>
                                ` : `
                                    <span style="font-size: 0.7rem; color: #666;">par ${ex.emprunteur || 'N/A'}</span>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('exemplairesContent').innerHTML = content;
            ouvrirModal('modalGestionExemplaires');
        } else {
            showNotification('Impossible de récupérer les exemplaires', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function ajouterExemplaire() {
    if (!currentMediaId) return;
    
    try {
        const response = await fetch('ajax/ajouter_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: currentMediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire ajouté avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerExemplaire(exemplaireId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exemplaire ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exemplaire_id: exemplaireId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire supprimé avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerMedia(mediaId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce média et tous ses exemplaires ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_media.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: mediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média supprimé avec succès !', 'success');
            // Supprimer la ligne du tableau
            const row = document.querySelector(`[data-media-id="${mediaId}"]`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.remove();
                    updateStatistics();
                }, 500);
            }
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateMediaRow(mediaId) {
    // Recharger les données de la ligne après une modification
    fetch(`ajax/get_media_row.php?id=${mediaId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const row = document.querySelector(`[data-media-id="${mediaId}"]`);
                if (row) {
                    // Mise à jour simplifiée - en production, tu peux faire plus détaillé
                    row.classList.add('stock-updated');
                    setTimeout(() => {
                        row.classList.remove('stock-updated');
                    }, 1500);
                }
            }
        })
        .catch(error => console.error('Erreur mise à jour ligne:', error));
}

// =============================================
// EXPORT DU STOCK
// =============================================
function exportStock() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `stock.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// HANDLERS FORMULAIRES STOCK
// =============================================
async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Ajout en cours...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Ajouter au stock';
    }
}

// =============================================
// UTILITAIRES STOCK
// =============================================
function searchMedia(query) {
    const rows = document.querySelectorAll('.media-row');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const title = row.querySelector('.media-title').textContent.toLowerCase();
        const author = row.querySelector('.media-author').textContent.toLowerCase();
        
        if (title.includes(normalizedQuery) || author.includes(normalizedQuery)) {
            row.style.display = '';
            row.classList.add('highlight-match');
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight-match');
        }
    });
    
    // Supprimer les highlights après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.highlight-match').forEach(row => {
            row.classList.remove('highlight-match');
        });
    }, 2000);
}

// Fonction pour calculer les statistiques en temps réel
function calculateStockStats() {
    const rows = document.querySelectorAll('.media-row');
    let totalDisponibles = 0;
    let totalEmpruntes = 0;
    
    rows.forEach(row => {
        const available = parseInt(row.querySelector('.count-number').textContent);
        const total = parseInt(row.querySelector('.total-number').textContent);
        
        totalDisponibles += available;
        totalEmpruntes += (total - available);
    });
    
    return {
        disponibles: totalDisponibles,
        empruntes: totalEmpruntes,
        total: totalDisponibles + totalEmpruntes
    };
}

// =============================================
// GESTION DES MODALES AMÉLIORÉE
// =============================================

// =============================================
// GESTION DE LA NAVIGATION
// =============================================
function initializeEventListeners() {
    // Menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fermeture des modales au clic sur overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            fermerModal(e.target.id);
        }
    });
    
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            fermerModal(currentModal);
        }
    });
    
    // Fermeture automatique des alertes
    initializeAlerts();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

function initializeResponsive() {
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.remove('active');
            mainContent.classList.remove('expanded');
        }
    });
}

// =============================================
// GESTION AMÉLIORÉE DES MODALES
// =============================================
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier champ du formulaire
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Gestion spéciale pour la modal de confirmation
        if (modalId === 'modalConfirmationRetour') {
            const btnConfirmer = document.getElementById('btnConfirmerRetour');
            if (btnConfirmer) {
                btnConfirmer.onclick = () => effectuerRetour(currentEmpruntId);
            }
        }
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        currentModal = null;
        currentEmpruntId = null;
        document.body.style.overflow = '';
        
        // Reset du formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
            
            // Recalculer la date de retour après reset
            if (modalId === 'modalNouvelEmprunt') {
                setTimeout(calculateReturnDate, 100);
            }
        }
    }
}

// =============================================
// VALIDATION AMÉLIORÉE DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validations spécifiques pour les emprunts
    if (form.id === 'formNouvelEmprunt') {
        const mediaId = form.querySelector('#media_id').value;
        const adherentId = form.querySelector('#adherent_id').value;
        
        if (!mediaId) {
            showFieldError(form.querySelector('#media_id'), 'Veuillez sélectionner un média');
            isValid = false;
        }
        
        if (!adherentId) {
            showFieldError(form.querySelector('#adherent_id'), 'Veuillez sélectionner un emprunteur');
            isValid = false;
        }
    }
    
    return isValid;
}

// =============================================
// ACTIONS ÉTENDUES SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    // Demander la durée de prolongation
    const jours = prompt('Nombre de jours de prolongation (1-30) :', '14');
    
    if (jours === null) return; // Annulé
    
    const joursNum = parseInt(jours);
    if (isNaN(joursNum) || joursNum < 1 || joursNum > 30) {
        showNotification('Durée invalide (1-30 jours)', 'error');
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                jours: joursNum,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Emprunt prolongé de ${joursNum} jours !`, 'success');
            
            // Mettre à jour la ligne
            updateEmpruntDateRetour(empruntId, result.data.nouvelle_date_retour);
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateEmpruntDateRetour(empruntId, nouvelleDateRetour) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    const returnDateCell = row.querySelector('.return-date');
    if (returnDateCell) {
        // Supprimer l'info de retard s'il y en avait
        const retardInfo = returnDateCell.querySelector('.retard-info');
        if (retardInfo) {
            retardInfo.remove();
        }
        
        // Mettre à jour la date
        returnDateCell.firstChild.textContent = nouvelleDateRetour;
        
        // Supprimer la classe overdue
        row.classList.remove('overdue');
        
        // Animation de mise à jour
        returnDateCell.classList.add('success-highlight');
        setTimeout(() => {
            returnDateCell.classList.remove('success-highlight');
        }, 2000);
    }
}

async function relancerAdherent(empruntId) {
    const btnRelancer = document.querySelector(`[onclick="relancerAdherent(${empruntId})"]`);
    
    try {
        if (btnRelancer) {
            btnRelancer.classList.add('loading');
            btnRelancer.disabled = true;
        }
        
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
            
            // Marquer visuellement que la relance a été envoyée
            if (btnRelancer) {
                btnRelancer.textContent = 'Relancé';
                btnRelancer.style.opacity = '0.6';
                
                // Réactiver après 5 secondes
                setTimeout(() => {
                    btnRelancer.textContent = 'Relancer';
                    btnRelancer.style.opacity = '1';
                    btnRelancer.disabled = false;
                }, 5000);
            }
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnRelancer) {
            btnRelancer.classList.remove('loading');
            btnRelancer.disabled = false;
        }
    }
}

// =============================================
// UTILITAIRES SUPPLÉMENTAIRES
// =============================================
function highlightOverdueLoans() {
    const rows = document.querySelectorAll('.emprunt-row');
    rows.forEach(row => {
        const retardInfo = row.querySelector('.retard-info');
        if (retardInfo) {
            row.classList.add('highlight-overdue');
        }
    });
}

function exportEmprunts() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `emprunts.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// Initialiser les highlights au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(highlightOverdueLoans, 500);
});

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================

// Fonctions spécifiques pour chaque modal
function ouvrirModalNouvelEmprunt() {
    ouvrirModal('modalNouvelEmprunt');
}

function ouvrirModalNouveauMedia() {
    ouvrirModal('modalNouveauMedia');
}

function ouvrirModalNouvelAdherent() {
    ouvrirModal('modalNouvelAdherent');
}

// =============================================
// GESTION DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Validation required
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    }
    
    // Validation email
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        }
    }
    
    // Validation numérique
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseInt(value) < parseInt(min)) {
            isValid = false;
            errorMessage = `Valeur minimum : ${min}`;
        }
        
        if (max && parseInt(value) > parseInt(max)) {
            isValid = false;
            errorMessage = `Valeur maximum : ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// =============================================
// HANDLERS DES FORMULAIRES
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            updateEmpruntsRecents();
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    if (!confirm('Confirmer la prolongation de cet emprunt ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt prolongé avec succès !', 'success');
            updateEmpruntsRecents();
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function relancerAdherent(empruntId) {
    try {
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// =============================================
// MISE À JOUR DYNAMIQUE
// =============================================
async function updateStatistics() {
    try {
        const response = await fetch('ajax/get_statistiques.php');
        const stats = await response.json();
        
        if (stats.success) {
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.total_objets);
            
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_cours);
            
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_retard);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques:', error);
    }
}

async function updateEmpruntsRecents() {
    try {
        const response = await fetch('ajax/get_emprunts_recents.php');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('.recent-loans-section tbody');
            if (tbody) {
                tbody.innerHTML = result.html;
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour emprunts récents:', error);
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
        <button type="button" class="alert-close">&times;</button>
        ${message}
    `;
    
    const container = document.querySelector('.flash-messages') || 
                     createNotificationContainer();
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.alert-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '3000';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert-dismissible');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(alert);
            });
        }
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                removeNotification(alert);
            }
        }, 5000);
    });
}

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// GESTION DES ERREURS GLOBALES
// =============================================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejetée:', e.reason);
    showNotification('Erreur de connexion au serveur', 'error');
});

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null;
let currentMediaId = null;
let currentAdherentId = null; // Pour les actions sur les adhérents

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    initializeAdherentsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE ADHÉRENTS
// =============================================
function initializeAdherentsPage() {
    // Vérifier si on est sur la page adhérents
    if (!document.querySelector('.adherents-table')) return;
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Raccourcis clavier spécifiques aux adhérents
    document.addEventListener('keydown', handleAdherentsKeyboardShortcuts);
    
    // Marquer les nouveaux membres (inscrits dans les 30 derniers jours)
    markNewMembers();
}

function handleAdherentsKeyboardShortcuts(e) {
    // Ctrl/Cmd + A : Nouvel adhérent
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelAdherent();
    }
    
    // Ctrl/Cmd + E : Export adhérents
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !currentModal) {
        e.preventDefault();
        exportAdherents();
    }
}

function markNewMembers() {
    // Cette fonction pourrait marquer visuellement les nouveaux membres
    // Pour l'instant, on simule avec un placeholder
    console.log('Marking new members...');
}

// =============================================
// ACTIONS SUR LES ADHÉRENTS
// =============================================
async function voirProfilAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_adherent_profil.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Ajouter l\'adhérent';
    }
}

async function handleModifierAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Modification...';
        
        const response = await fetch('ajax/modifier_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent modifié avec succès !', 'success');
            fermerModal('modalModifierAdherent');
            
            // Mettre à jour la ligne dans le tableau
            const adherentId = formData.get('adherent_id');
            updateAdherentRowFromData(adherentId, result.data);
        } else {
            showNotification(result.message || 'Erreur lors de la modification', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sauvegarder';
    }
}

function updateAdherentRowFromData(adherentId, data) {
    const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
    if (!row) return;
    
    // Mettre à jour les données dans la ligne
    const nomCell = row.querySelector('.adherent-nom .nom-principal');
    if (nomCell) nomCell.textContent = data.nom;
    
    const prenomCell = row.querySelector('.adherent-prenom .prenom-principal');
    if (prenomCell) prenomCell.textContent = data.prenom;
    
    const emailCell = row.querySelector('.adherent-email .email-link');
    if (emailCell) {
        emailCell.textContent = data.email;
        emailCell.href = `mailto:${data.email}`;
    }
    
    // Mettre à jour le statut
    updateAdherentRow(adherentId, data.statut);
}

// =============================================
// GESTION DES MODALES ÉTENDUE POUR ADHÉRENTS
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Formulaire modifier adhérent
    const formModifierAdherent = document.getElementById('formModifierAdherent');
    if (formModifierAdherent) {
        formModifierAdherent.addEventListener('submit', handleModifierAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

// =============================================
// UTILITAIRES ADHÉRENTS
// =============================================
function searchAdherents(query) {
    const rows = document.querySelectorAll('.adherent-row');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const nom = row.querySelector('.adherent-nom').textContent.toLowerCase();
        const prenom = row.querySelector('.adherent-prenom').textContent.toLowerCase();
        const email = row.querySelector('.adherent-email').textContent.toLowerCase();
        
        if (nom.includes(normalizedQuery) || prenom.includes(normalizedQuery) || email.includes(normalizedQuery)) {
            row.style.display = '';
            row.classList.add('highlight-match');
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight-match');
        }
    });
    
    // Supprimer les highlights après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.highlight-match').forEach(row => {
            row.classList.remove('highlight-match');
        });
    }, 2000);
}

function calculateAdherentStats() {
    const rows = document.querySelectorAll('.adherent-row');
    let actifs = 0;
    let inactifs = 0;
    let avecEmprunts = 0;
    
    rows.forEach(row => {
        const statut = row.querySelector('.member-status-badge').textContent.toLowerCase();
        const emprunts = parseInt(row.querySelector('.emprunts-count').textContent);
        
        if (statut === 'actif') {
            actifs++;
        } else {
            inactifs++;
        }
        
        if (emprunts > 0) {
            avecEmprunts++;
        }
    });
    
    return {
        actifs: actifs,
        inactifs: inactifs,
        avecEmprunts: avecEmprunts,
        total: actifs + inactifs
    };
}

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('profilAdherentTitle').textContent = 
                `Profil de ${data.prenom} ${data.nom}`;
            
            // Construire le contenu du profil
            const content = `
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${data.prenom.charAt(0)}${data.nom.charAt(0)}
                    </div>
                    <div class="profile-info">
                        <h3>${data.prenom} ${data.nom}</h3>
                        <div class="profile-meta">
                            <span class="profile-status status-${data.statut}">${data.statut.toUpperCase()}</span>
                            <span class="profile-id">ID: #${String(data.id).padStart(3, '0')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-details-grid">
                    <div class="detail-group">
                        <h4>Informations personnelles</h4>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Email</span>
                            <span class="profile-detail-value">${data.email || 'Non renseigné'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Téléphone</span>
                            <span class="profile-detail-value">${data.telephone || 'Non renseigné'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Adresse</span>
                            <span class="profile-detail-value">${data.adresse || 'Non renseignée'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Date d'inscription</span>
                            <span class="profile-detail-value">${data.date_inscription || 'Inconnue'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Activité</h4>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Emprunts en cours</span>
                            <span class="profile-detail-value">${data.emprunts_actifs}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Total emprunts</span>
                            <span class="profile-detail-value">${data.total_emprunts}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Dernière activité</span>
                            <span class="profile-detail-value">${data.derniere_activite || 'Jamais'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Retards</span>
                            <span class="profile-detail-value">${data.nb_retards} retard(s)</span>
                        </div>
                    </div>
                </div>
                
                <div class="emprunts-history">
                    <h4>Historique des emprunts</h4>
                    <div class="emprunts-summary">
                        <div class="summary-card">
                            <span class="summary-number">${data.emprunts_actifs}</span>
                            <span class="summary-label">En cours</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-number">${data.emprunts_retard}</span>
                            <span class="summary-label">En retard</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-number">${data.total_emprunts}</span>
                            <span class="summary-label">Total</span>
                        </div>
                    </div>
                    
                    <div class="emprunts-list">
                        ${data.emprunts_recents.map(emprunt => `
                            <div class="emprunt-item ${emprunt.statut.replace(' ', '-')}">
                                <div class="emprunt-media">
                                    <div class="emprunt-titre">${emprunt.titre}</div>
                                    <div class="emprunt-auteur">${emprunt.auteur}</div>
                                </div>
                                <div class="emprunt-dates">
                                    <div>Emprunté: ${emprunt.date_emprunt}</div>
                                    <div>Retour: ${emprunt.date_retour}</div>
                                    <span class="emprunt-status status-${emprunt.statut.replace(' ', '-')}">${emprunt.statut}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('profilAdherentContent').innerHTML = content;
            
            // Configurer le bouton modifier
            document.getElementById('btnModifierDepuisProfil').onclick = () => {
                fermerModal('modalProfilAdherent');
                modifierAdherent(adherentId);
            };
            
            ouvrirModal('modalProfilAdherent');
        } else {
            showNotification('Impossible de récupérer le profil de l\'adhérent', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
};

async function voirEmpruntsAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_emprunts_adherent.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('empruntsAdherentTitle').textContent = 
                `Emprunts de ${data.adherent_nom}`;
            
            // Construire la liste des emprunts
            const content = `
                <div class="emprunts-summary">
                    <div class="summary-card">
                        <span class="summary-number">${data.emprunts_actifs}</span>
                        <span class="summary-label">En cours</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-number">${data.emprunts_retard}</span>
                        <span class="summary-label">En retard</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-number">${data.total_emprunts}</span>
                        <span class="summary-label">Total</span>
                    </div>
                </div>
                
                <div class="emprunts-list">
                    ${data.emprunts.map(emprunt => `
                        <div class="emprunt-item ${emprunt.statut.replace(' ', '-')}">
                            <div class="emprunt-media">
                                <div class="emprunt-titre">${emprunt.titre}</div>
                                <div class="emprunt-auteur">${emprunt.auteur}</div>
                                <div class="emprunt-exemplaire">Exemplaire #${emprunt.numero_exemplaire}</div>
                            </div>
                            <div class="emprunt-dates">
                                <div>Emprunté: ${emprunt.date_emprunt}</div>
                                <div>Retour prévu: ${emprunt.date_retour_prevue}</div>
                                ${emprunt.jours_retard > 0 ? `<div style="color: #dc3545;">Retard: ${emprunt.jours_retard} jour(s)</div>` : ''}
                                <span class="emprunt-status status-${emprunt.statut.replace(' ', '-')}">${emprunt.statut}</span>
                            </div>
                            ${emprunt.statut !== 'rendu' ? `
                                <div class="emprunt-actions">
                                    <button class="btn-mini btn-mini-edit" onclick="prolongerEmprunt(${emprunt.id})">Prolonger</button>
                                    <button class="btn-mini btn-mini-delete" onclick="marquerRendu(${emprunt.id})">Rendre</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('empruntsAdherentContent').innerHTML = content;
            ouvrirModal('modalEmpruntsAdherent');
        } else {
            showNotification('Impossible de récupérer les emprunts', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function modifierAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_adherent_details.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Remplir le formulaire de modification
            document.getElementById('modifier_adherent_id').value = data.id;
            document.getElementById('modifier_nom').value = data.nom;
            document.getElementById('modifier_prenom').value = data.prenom;
            document.getElementById('modifier_email').value = data.email;
            document.getElementById('modifier_statut').value = data.statut;
            
            ouvrirModal('modalModifierAdherent');
        } else {
            showNotification('Impossible de récupérer les données de l\'adhérent', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function changerStatutAdherent(adherentId, nouveauStatut) {
    const action = nouveauStatut === 'actif' ? 'réactiver' : 'désactiver';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet adhérent ?`)) {
        return;
    }
    
    try {
        const response = await fetch('ajax/changer_statut_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adherent_id: adherentId,
                nouveau_statut: nouveauStatut,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Adhérent ${action === 'réactiver' ? 'réactivé' : 'désactivé'} avec succès !`, 'success');
            updateAdherentRow(adherentId, nouveauStatut);
        } else {
            showNotification(result.message || `Erreur lors du changement de statut`, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerAdherent(adherentId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet adhérent ?\n\nCette action est irréversible.')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adherent_id: adherentId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent supprimé avec succès !', 'success');
            // Supprimer la ligne du tableau
            const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.remove();
                    updateStatistics();
                }, 500);
            }
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateAdherentRow(adherentId, nouveauStatut) {
    const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.member-status-badge');
    if (statusBadge) {
        statusBadge.className = `member-status-badge status-${nouveauStatut}`;
        statusBadge.textContent = nouveauStatut.charAt(0).toUpperCase() + nouveauStatut.slice(1);
    }
    
    // Mettre à jour la classe de la ligne
    if (nouveauStatut === 'inactif') {
        row.classList.add('inactive');
    } else {
        row.classList.remove('inactive');
    }
    
    // Mettre à jour les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell) {
        const actionButtons = actionsCell.querySelector('.action-buttons');
        const currentButtons = actionButtons.innerHTML;
        
        if (nouveauStatut === 'actif') {
            actionButtons.innerHTML = currentButtons.replace(
                /btn-activate[^>]*>Activer/g,
                `btn-deactivate" onclick="changerStatutAdherent(${adherentId}, 'inactif')" title="Désactiver l'adhérent">Désactiver`
            );
        } else {
            actionButtons.innerHTML = currentButtons.replace(
                /btn-deactivate[^>]*>Désactiver/g,
                `btn-activate" onclick="changerStatutAdherent(${adherentId}, 'actif')" title="Réactiver l'adhérent">Activer`
            );
        }
    }
    
    // Animation de mise à jour
    row.classList.add('member-updated');
    setTimeout(() => {
        row.classList.remove('member-updated');
    }, 1500);
}

function creerNouvelEmpruntPour() {
    // Fermer la modal actuelle et ouvrir celle de nouvel emprunt
    fermerModal('modalEmpruntsAdherent');
    
    // Si on a l'ID de l'adhérent, on peut pré-sélectionner dans le formulaire
    ouvrirModalNouvelEmprunt();
    
    // Pré-sélectionner l'adhérent si possible
    if (currentAdherentId) {
        setTimeout(() => {
            const adherentSelect = document.getElementById('adherent_id');
            if (adherentSelect) {
                adherentSelect.value = currentAdherentId;
            }
        }, 100);
    }
}

// =============================================
// EXPORT ADHÉRENTS
// =============================================
function exportAdherents() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `adherents.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// HANDLERS FORMULAIRES ADHÉRENTS
// =============================================
async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Ajout en cours...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success/**
 * JavaScript pour l'interface administrateur - Médiathèque Livresse
 */

// =============================================
// VARIABLES GLOBALES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null; // Pour les actions sur les emprunts

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE EMPRUNTS
// =============================================
function initializeEmpruntsPage() {
    // Calcul automatique de la date de retour
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (dureeInput && dateRetourInput) {
        dureeInput.addEventListener('input', calculateReturnDate);
        calculateReturnDate(); // Calcul initial
    }
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function calculateReturnDate() {
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (!dureeInput || !dateRetourInput) return;
    
    const duree = parseInt(dureeInput.value) || 21;
    const today = new Date();
    const returnDate = new Date(today.getTime() + (duree * 24 * 60 * 60 * 1000));
    
    dateRetourInput.value = returnDate.toLocaleDateString('fr-FR');
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N : Nouvel emprunt
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelEmprunt();
    }
    
    // Échap : Fermer modal
    if (e.key === 'Escape' && currentModal) {
        fermerModal(currentModal);
    }
    
    // F3 : Focus sur la recherche
    if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
}

// =============================================
// GESTION DES FILTRES
// =============================================
function submitFilters() {
    const form = document.getElementById('filtersForm');
    if (form) {
        form.submit();
    }
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function marquerRendu(empruntId) {
    currentEmpruntId = empruntId;
    
    // Récupérer les détails de l'emprunt
    try {
        const response = await fetch(`ajax/get_emprunt_details.php?id=${empruntId}`);
        const result = await response.json();
        
        if (result.success) {
            // Remplir les détails dans la modal
            const detailsContainer = document.getElementById('detailsRetour');
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Média :</span>
                    <span class="detail-value">${result.data.titre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emprunteur :</span>
                    <span class="detail-value">${result.data.emprunteur}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date d'emprunt :</span>
                    <span class="detail-value">${result.data.date_emprunt}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date de retour prévue :</span>
                    <span class="detail-value">${result.data.date_retour_prevue}</span>
                </div>
            `;
            
            ouvrirModal('modalConfirmationRetour');
        } else {
            showNotification('Impossible de récupérer les détails de l\'emprunt', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        // Fallback : confirmation simple
        if (confirm('Confirmer le retour de cet emprunt ?')) {
            effectuerRetour(empruntId);
        }
    }
}

async function effectuerRetour(empruntId) {
    const btnConfirmer = document.getElementById('btnConfirmerRetour');
    
    try {
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
            btnConfirmer.textContent = 'Traitement...';
        }
        
        const response = await fetch('ajax/retourner_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt marqué comme rendu !', 'success');
            fermerModal('modalConfirmationRetour');
            
            // Rafraîchir la ligne dans le tableau
            updateEmpruntRow(empruntId, 'rendu');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors du retour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.textContent = 'Confirmer le retour';
        }
    }
}

function updateEmpruntRow(empruntId, newStatus) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge status-${newStatus}`;
        statusBadge.textContent = newStatus === 'rendu' ? 'Rendu' : newStatus;
    }
    
    // Remplacer les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell && newStatus === 'rendu') {
        actionsCell.innerHTML = '<span class="text-muted">-</span>';
    }
    
    // Supprimer la classe overdue si applicable
    row.classList.remove('overdue');
    
    // Animation de mise à jour
    row.classList.add('success-highlight');
    setTimeout(() => {
        row.classList.remove('success-highlight');
    }, 2000);
}

// =============================================
// HANDLERS DES FORMULAIRES SPÉCIALISÉS
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enregistrer l\'emprunt';
    }
}

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null;
let currentMediaId = null; // Pour les actions sur les médias

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE STOCK
// =============================================
function initializeStockPage() {
    // Vérifier si on est sur la page stock
    if (!document.querySelector('.stock-table')) return;
    
    // Auto-soumission des filtres avec délai pour le stock
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Initialiser les indicateurs de stock
    highlightLowStock();
    
    // Gestion des raccourcis clavier spécifiques au stock
    document.addEventListener('keydown', handleStockKeyboardShortcuts);
}

function highlightLowStock() {
    const rows = document.querySelectorAll('.media-row');
    rows.forEach(row => {
        const availabilityInfo = row.querySelector('.availability-info');
        if (availabilityInfo) {
            const availableCount = parseInt(availabilityInfo.querySelector('.count-number').textContent);
            const totalCount = parseInt(availabilityInfo.querySelector('.total-number').textContent);
            
            // Marquer les stocks faibles (moins de 20% disponible)
            if (totalCount > 0 && (availableCount / totalCount) < 0.2 && availableCount > 0) {
                row.classList.add('low-stock');
            }
            
            // Marquer les ruptures de stock
            if (availableCount === 0) {
                row.classList.add('out-of-stock');
            }
        }
    });
}

function handleStockKeyboardShortcuts(e) {
    // Ctrl/Cmd + M : Nouveau média
    if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouveauMedia();
    }
    
    // Ctrl/Cmd + E : Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !currentModal) {
        e.preventDefault();
        exportStock();
    }
}

// =============================================
// ACTIONS SUR LES MÉDIAS
// =============================================
async function voirDetailsMedia(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_media_details.php?id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre de la modal
            document.getElementById('detailsMediaTitle').textContent = `Détails - ${data.titre}`;
            
            // Construire le contenu
            const content = `
                <div class="details-grid">
                    <div class="detail-section">
                        <h4>Informations générales</h4>
                        <div class="detail-item">
                            <span class="detail-label">ID</span>
                            <span class="detail-value">#${String(data.id).padStart(3, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Titre</span>
                            <span class="detail-value">${data.titre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Auteur/Artiste</span>
                            <span class="detail-value">${data.auteur}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${data.type_nom}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Genre</span>
                            <span class="detail-value">${data.genre || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Éditeur</span>
                            <span class="detail-value">${data.editeur || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Année</span>
                            <span class="detail-value">${data.date_parution || 'Non spécifiée'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">État général</span>
                            <span class="detail-value">${data.etat_conservation}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Disponibilité</h4>
                        <div class="detail-item">
                            <span class="detail-label">Exemplaires total</span>
                            <span class="detail-value">${data.total_exemplaires}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Disponibles</span>
                            <span class="detail-value" style="color: #28a745; font-weight: 600;">${data.exemplaires_disponibles}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Empruntés</span>
                            <span class="detail-value" style="color: #dc3545; font-weight: 600;">${data.exemplaires_empruntes}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Taux d'emprunt</span>
                            <span class="detail-value">${Math.round((data.exemplaires_empruntes / data.total_exemplaires) * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Liste des exemplaires</h4>
                    <div class="exemplaires-list">
                        ${data.exemplaires.map(ex => `
                            <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                                <div class="exemplaire-info">
                                    <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                    <span class="exemplaire-etat">${ex.etat}</span>
                                </div>
                                <div class="exemplaire-status">
                                    <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                        ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                    </span>
                                    ${ex.emprunteur ? `<span style="font-size: 0.7rem; color: #666; margin-left: 0.5rem;">par ${ex.emprunteur}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('detailsMediaContent').innerHTML = content;
            
            // Configurer le bouton modifier
            document.getElementById('btnModifierDepuisDetails').onclick = () => {
                fermerModal('modalDetailsMedia');
                modifierMedia(mediaId);
            };
            
            ouvrirModal('modalDetailsMedia');
        } else {
            showNotification('Impossible de récupérer les détails du média', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function modifierMedia(mediaId) {
    // Pour l'instant, on affiche une notification
    // Tu peux implémenter une vraie modal de modification plus tard
    showNotification('Fonctionnalité de modification en cours de développement', 'info');
}

async function gererExemplaires(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_exemplaires.php?media_id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('exemplairesMediaTitle').textContent = 
                `Exemplaires - ${data.media_titre}`;
            
            // Construire la liste des exemplaires
            const content = `
                <div class="exemplaires-summary">
                    <p><strong>Total :</strong> ${data.exemplaires.length} exemplaire(s)</p>
                    <p><strong>Disponibles :</strong> ${data.exemplaires.filter(ex => ex.disponible).length}</p>
                    <p><strong>Empruntés :</strong> ${data.exemplaires.filter(ex => !ex.disponible).length}</p>
                </div>
                
                <div class="exemplaires-list">
                    ${data.exemplaires.map(ex => `
                        <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                            <div class="exemplaire-info">
                                <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                <span class="exemplaire-etat">${ex.etat}</span>
                                ${ex.date_acquisition ? `<span class="exemplaire-date">Ajouté le ${ex.date_acquisition}</span>` : ''}
                            </div>
                            <div class="exemplaire-actions">
                                <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                    ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                </span>
                                ${ex.disponible ? `
                                    <button class="btn-mini btn-mini-edit" onclick="modifierExemplaire(${ex.id})">Modifier</button>
                                    <button class="btn-mini btn-mini-delete" onclick="supprimerExemplaire(${ex.id})">Supprimer</button>
                                ` : `
                                    <span style="font-size: 0.7rem; color: #666;">par ${ex.emprunteur || 'N/A'}</span>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('exemplairesContent').innerHTML = content;
            ouvrirModal('modalGestionExemplaires');
        } else {
            showNotification('Impossible de récupérer les exemplaires', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function ajouterExemplaire() {
    if (!currentMediaId) return;
    
    try {
        const response = await fetch('ajax/ajouter_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: currentMediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire ajouté avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerExemplaire(exemplaireId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exemplaire ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exemplaire_id: exemplaireId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire supprimé avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerMedia(mediaId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce média et tous ses exemplaires ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_media.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: mediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média supprimé avec succès !', 'success');
            // Supprimer la ligne du tableau
            const row = document.querySelector(`[data-media-id="${mediaId}"]`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.remove();
                    updateStatistics();
                }, 500);
            }
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateMediaRow(mediaId) {
    // Recharger les données de la ligne après une modification
    fetch(`ajax/get_media_row.php?id=${mediaId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const row = document.querySelector(`[data-media-id="${mediaId}"]`);
                if (row) {
                    // Mise à jour simplifiée - en production, tu peux faire plus détaillé
                    row.classList.add('stock-updated');
                    setTimeout(() => {
                        row.classList.remove('stock-updated');
                    }, 1500);
                }
            }
        })
        .catch(error => console.error('Erreur mise à jour ligne:', error));
}

// =============================================
// EXPORT DU STOCK
// =============================================
function exportStock() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `stock.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// HANDLERS FORMULAIRES STOCK
// =============================================
async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Ajout en cours...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Ajouter au stock';
    }
}

// =============================================
// UTILITAIRES STOCK
// =============================================
function searchMedia(query) {
    const rows = document.querySelectorAll('.media-row');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const title = row.querySelector('.media-title').textContent.toLowerCase();
        const author = row.querySelector('.media-author').textContent.toLowerCase();
        
        if (title.includes(normalizedQuery) || author.includes(normalizedQuery)) {
            row.style.display = '';
            row.classList.add('highlight-match');
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight-match');
        }
    });
    
    // Supprimer les highlights après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.highlight-match').forEach(row => {
            row.classList.remove('highlight-match');
        });
    }, 2000);
}

// Fonction pour calculer les statistiques en temps réel
function calculateStockStats() {
    const rows = document.querySelectorAll('.media-row');
    let totalDisponibles = 0;
    let totalEmpruntes = 0;
    
    rows.forEach(row => {
        const available = parseInt(row.querySelector('.count-number').textContent);
        const total = parseInt(row.querySelector('.total-number').textContent);
        
        totalDisponibles += available;
        totalEmpruntes += (total - available);
    });
    
    return {
        disponibles: totalDisponibles,
        empruntes: totalEmpruntes,
        total: totalDisponibles + totalEmpruntes
    };
}

// =============================================
// GESTION DES MODALES AMÉLIORÉE
// =============================================

// =============================================
// GESTION DE LA NAVIGATION
// =============================================
function initializeEventListeners() {
    // Menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fermeture des modales au clic sur overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            fermerModal(e.target.id);
        }
    });
    
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            fermerModal(currentModal);
        }
    });
    
    // Fermeture automatique des alertes
    initializeAlerts();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

function initializeResponsive() {
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.remove('active');
            mainContent.classList.remove('expanded');
        }
    });
}

// =============================================
// GESTION AMÉLIORÉE DES MODALES
// =============================================
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier champ du formulaire
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Gestion spéciale pour la modal de confirmation
        if (modalId === 'modalConfirmationRetour') {
            const btnConfirmer = document.getElementById('btnConfirmerRetour');
            if (btnConfirmer) {
                btnConfirmer.onclick = () => effectuerRetour(currentEmpruntId);
            }
        }
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        currentModal = null;
        currentEmpruntId = null;
        document.body.style.overflow = '';
        
        // Reset du formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
            
            // Recalculer la date de retour après reset
            if (modalId === 'modalNouvelEmprunt') {
                setTimeout(calculateReturnDate, 100);
            }
        }
    }
}

// =============================================
// VALIDATION AMÉLIORÉE DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validations spécifiques pour les emprunts
    if (form.id === 'formNouvelEmprunt') {
        const mediaId = form.querySelector('#media_id').value;
        const adherentId = form.querySelector('#adherent_id').value;
        
        if (!mediaId) {
            showFieldError(form.querySelector('#media_id'), 'Veuillez sélectionner un média');
            isValid = false;
        }
        
        if (!adherentId) {
            showFieldError(form.querySelector('#adherent_id'), 'Veuillez sélectionner un emprunteur');
            isValid = false;
        }
    }
    
    return isValid;
}

// =============================================
// ACTIONS ÉTENDUES SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    // Demander la durée de prolongation
    const jours = prompt('Nombre de jours de prolongation (1-30) :', '14');
    
    if (jours === null) return; // Annulé
    
    const joursNum = parseInt(jours);
    if (isNaN(joursNum) || joursNum < 1 || joursNum > 30) {
        showNotification('Durée invalide (1-30 jours)', 'error');
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                jours: joursNum,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Emprunt prolongé de ${joursNum} jours !`, 'success');
            
            // Mettre à jour la ligne
            updateEmpruntDateRetour(empruntId, result.data.nouvelle_date_retour);
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateEmpruntDateRetour(empruntId, nouvelleDateRetour) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    const returnDateCell = row.querySelector('.return-date');
    if (returnDateCell) {
        // Supprimer l'info de retard s'il y en avait
        const retardInfo = returnDateCell.querySelector('.retard-info');
        if (retardInfo) {
            retardInfo.remove();
        }
        
        // Mettre à jour la date
        returnDateCell.firstChild.textContent = nouvelleDateRetour;
        
        // Supprimer la classe overdue
        row.classList.remove('overdue');
        
        // Animation de mise à jour
        returnDateCell.classList.add('success-highlight');
        setTimeout(() => {
            returnDateCell.classList.remove('success-highlight');
        }, 2000);
    }
}

async function relancerAdherent(empruntId) {
    const btnRelancer = document.querySelector(`[onclick="relancerAdherent(${empruntId})"]`);
    
    try {
        if (btnRelancer) {
            btnRelancer.classList.add('loading');
            btnRelancer.disabled = true;
        }
        
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
            
            // Marquer visuellement que la relance a été envoyée
            if (btnRelancer) {
                btnRelancer.textContent = 'Relancé';
                btnRelancer.style.opacity = '0.6';
                
                // Réactiver après 5 secondes
                setTimeout(() => {
                    btnRelancer.textContent = 'Relancer';
                    btnRelancer.style.opacity = '1';
                    btnRelancer.disabled = false;
                }, 5000);
            }
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnRelancer) {
            btnRelancer.classList.remove('loading');
            btnRelancer.disabled = false;
        }
    }
}

// =============================================
// UTILITAIRES SUPPLÉMENTAIRES
// =============================================
function highlightOverdueLoans() {
    const rows = document.querySelectorAll('.emprunt-row');
    rows.forEach(row => {
        const retardInfo = row.querySelector('.retard-info');
        if (retardInfo) {
            row.classList.add('highlight-overdue');
        }
    });
}

function exportEmprunts() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `emprunts.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// Initialiser les highlights au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(highlightOverdueLoans, 500);
});

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================

// Fonctions spécifiques pour chaque modal
function ouvrirModalNouvelEmprunt() {
    ouvrirModal('modalNouvelEmprunt');
}

function ouvrirModalNouveauMedia() {
    ouvrirModal('modalNouveauMedia');
}

function ouvrirModalNouvelAdherent() {
    ouvrirModal('modalNouvelAdherent');
}

// =============================================
// GESTION DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Validation required
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    }
    
    // Validation email
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        }
    }
    
    // Validation numérique
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseInt(value) < parseInt(min)) {
            isValid = false;
            errorMessage = `Valeur minimum : ${min}`;
        }
        
        if (max && parseInt(value) > parseInt(max)) {
            isValid = false;
            errorMessage = `Valeur maximum : ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// =============================================
// HANDLERS DES FORMULAIRES
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            updateEmpruntsRecents();
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    if (!confirm('Confirmer la prolongation de cet emprunt ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt prolongé avec succès !', 'success');
            updateEmpruntsRecents();
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function relancerAdherent(empruntId) {
    try {
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// =============================================
// MISE À JOUR DYNAMIQUE
// =============================================
async function updateStatistics() {
    try {
        const response = await fetch('ajax/get_statistiques.php');
        const stats = await response.json();
        
        if (stats.success) {
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.total_objets);
            
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_cours);
            
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_retard);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques:', error);
    }
}

async function updateEmpruntsRecents() {
    try {
        const response = await fetch('ajax/get_emprunts_recents.php');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('.recent-loans-section tbody');
            if (tbody) {
                tbody.innerHTML = result.html;
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour emprunts récents:', error);
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
        <button type="button" class="alert-close">&times;</button>
        ${message}
    `;
    
    const container = document.querySelector('.flash-messages') || 
                     createNotificationContainer();
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.alert-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '3000';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert-dismissible');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(alert);
            });
        }
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                removeNotification(alert);
            }
        }, 5000);
    });
}

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// GESTION DES ERREURS GLOBALES
// =============================================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejetée:', e.reason);
    showNotification('Erreur de connexion au serveur', 'error');
});

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null;
let currentMediaId = null;
let currentAdherentId = null; // Pour les actions sur les adhérents

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    initializeAdherentsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE ADHÉRENTS
// =============================================
function initializeAdherentsPage() {
    // Vérifier si on est sur la page adhérents
    if (!document.querySelector('.adherents-table')) return;
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Raccourcis clavier spécifiques aux adhérents
    document.addEventListener('keydown', handleAdherentsKeyboardShortcuts);
    
    // Marquer les nouveaux membres (inscrits dans les 30 derniers jours)
    markNewMembers();
}

function handleAdherentsKeyboardShortcuts(e) {
    // Ctrl/Cmd + A : Nouvel adhérent
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelAdherent();
    }
    
    // Ctrl/Cmd + E : Export adhérents
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !currentModal) {
        e.preventDefault();
        exportAdherents();
    }
}

function markNewMembers() {
    // Cette fonction pourrait marquer visuellement les nouveaux membres
    // Pour l'instant, on simule avec un placeholder
    console.log('Marking new members...');
}

// =============================================
// ACTIONS SUR LES ADHÉRENTS
// =============================================
async function voirProfilAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_adherent_profil.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Ajouter l\'adhérent';
    }
}

async function handleModifierAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Modification...';
        
        const response = await fetch('ajax/modifier_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent modifié avec succès !', 'success');
            fermerModal('modalModifierAdherent');
            
            // Mettre à jour la ligne dans le tableau
            const adherentId = formData.get('adherent_id');
            updateAdherentRowFromData(adherentId, result.data);
        } else {
            showNotification(result.message || 'Erreur lors de la modification', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sauvegarder';
    }
}

function updateAdherentRowFromData(adherentId, data) {
    const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
    if (!row) return;
    
    // Mettre à jour les données dans la ligne
    const nomCell = row.querySelector('.adherent-nom .nom-principal');
    if (nomCell) nomCell.textContent = data.nom;
    
    const prenomCell = row.querySelector('.adherent-prenom .prenom-principal');
    if (prenomCell) prenomCell.textContent = data.prenom;
    
    const emailCell = row.querySelector('.adherent-email .email-link');
    if (emailCell) {
        emailCell.textContent = data.email;
        emailCell.href = `mailto:${data.email}`;
    }
    
    // Mettre à jour le statut
    updateAdherentRow(adherentId, data.statut);
}

// =============================================
// GESTION DES MODALES ÉTENDUE POUR ADHÉRENTS
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Formulaire modifier adhérent
    const formModifierAdherent = document.getElementById('formModifierAdherent');
    if (formModifierAdherent) {
        formModifierAdherent.addEventListener('submit', handleModifierAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

// =============================================
// UTILITAIRES ADHÉRENTS
// =============================================
function searchAdherents(query) {
    const rows = document.querySelectorAll('.adherent-row');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const nom = row.querySelector('.adherent-nom').textContent.toLowerCase();
        const prenom = row.querySelector('.adherent-prenom').textContent.toLowerCase();
        const email = row.querySelector('.adherent-email').textContent.toLowerCase();
        
        if (nom.includes(normalizedQuery) || prenom.includes(normalizedQuery) || email.includes(normalizedQuery)) {
            row.style.display = '';
            row.classList.add('highlight-match');
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight-match');
        }
    });
    
    // Supprimer les highlights après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.highlight-match').forEach(row => {
            row.classList.remove('highlight-match');
        });
    }, 2000);
}

function calculateAdherentStats() {
    const rows = document.querySelectorAll('.adherent-row');
    let actifs = 0;
    let inactifs = 0;
    let avecEmprunts = 0;
    
    rows.forEach(row => {
        const statut = row.querySelector('.member-status-badge').textContent.toLowerCase();
        const emprunts = parseInt(row.querySelector('.emprunts-count').textContent);
        
        if (statut === 'actif') {
            actifs++;
        } else {
            inactifs++;
        }
        
        if (emprunts > 0) {
            avecEmprunts++;
        }
    });
    
    return {
        actifs: actifs,
        inactifs: inactifs,
        avecEmprunts: avecEmprunts,
        total: actifs + inactifs
    };
}

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// ============================================= 
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null;
let currentMediaId = null;
let currentAdherentId = null;
let charts = {}; // Pour stocker les instances de graphiques

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    initializeAdherentsPage();
    initializeStatistiquesPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE STATISTIQUES
// =============================================
function initializeStatistiquesPage() {
    // Vérifier si on est sur la page statistiques
    if (!document.querySelector('.main-metrics')) return;
    
    // Initialiser les graphiques
    initializeCharts();
    
    // Animer les compteurs
    animateCounters();
    
    // Animer les barres de progression
    animateProgressBars();
}

function initializeCharts() {
    // Graphique des emprunts par mois
    const empruntsCtx = document.getElementById('empruntsChart');
    if (empruntsCtx && typeof empruntsData !== 'undefined') {
        createEmpruntsChart(empruntsCtx, empruntsData);
    }
    
    // Graphique de répartition par types
    const typesCtx = document.getElementById('typesChart');
    if (typesCtx && typeof typesData !== 'undefined') {
        createTypesChart(typesCtx, typesData);
    }
}

function createEmpruntsChart(ctx, data) {
    const labels = data.map(item => {
        const [year, month] = item.mois.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    });
    
    const values = data.map(item => item.nb_emprunts);
    
    charts.emprunts = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre d\'emprunts',
                data: values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#667eea'
                }
            }
        }
    });
}

function createTypesChart(ctx, data) {
    const labels = data.map(item => item.type_nom);
    const values = data.map(item => item.total_exemplaires);
    
    const colors = [
        '#667eea', '#f093fb', '#4facfe', '#43e97b', 
        '#ffeaa7', '#ff7675', '#74b9ff', '#a29bfe'
    ];
    
    charts.types = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.metric-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // Formater le nombre avec des espaces pour les milliers
            const formatted = Math.floor(current).toLocaleString('fr-FR');
            counter.textContent = formatted + (counter.textContent.includes('%') ? '%' : '');
        }, 16);
    });
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.occupation-fill');
    
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });
}

// =============================================
// GESTION DES FILTRES DE PÉRIODE
// =============================================
function changerPeriode() {
    const periode = document.getElementById('periodFilter').value;
    const url = new URL(window.location);
    url.searchParams.set('periode', periode);
    window.location.href = url.toString();
}

// =============================================
// MISE À JOUR DYNAMIQUE DES STATISTIQUES
// =============================================
async function updateStatistiquesDetaillees() {
    try {
        const response = await fetch('ajax/get_statistiques_detaillees.php');
        const result = await response.json();
        
        if (result.success) {
            updateMetricCards(result.data);
            updateCharts(result.data);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques détaillées:', error);
    }
}

function updateMetricCards(data) {
    // Mettre à jour les cartes de métriques
    const metrics = document.querySelectorAll('.metric-number');
    
    if (metrics[0] && data.total_emprunts !== undefined) {
        animateNumberUpdate(metrics[0], data.total_emprunts);
    }
    
    if (metrics[1] && data.medias_disponibles !== undefined) {
        animateNumberUpdate(metrics[1], data.medias_disponibles);
    }
    
    if (metrics[2] && data.emprunts_retard !== undefined) {
        animateNumberUpdate(metrics[2], data.emprunts_retard);
    }
    
    if (metrics[3] && data.taux_occupation !== undefined) {
        animateNumberUpdate(metrics[3], data.taux_occupation, '%');
    }
}

function animateNumberUpdate(element, newValue, suffix = '') {
    const currentValue = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 1000;
    const increment = (newValue - currentValue) / (duration / 16);
    let current = currentValue;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= newValue) || (increment < 0 && current <= newValue)) {
            current = newValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(current).toLocaleString('fr-FR') + suffix;
    }, 16);
}

function updateCharts(data) {
    // Mettre à jour les graphiques si de nouvelles données sont disponibles
    if (charts.emprunts && data.emprunts_par_mois) {
        charts.emprunts.data.datasets[0].data = data.emprunts_par_mois.map(item => item.nb_emprunts);
        charts.emprunts.update('active');
    }
    
    if (charts.types && data.repartition_types) {
        charts.types.data.datasets[0].data = data.repartition_types.map(item => item.total_exemplaires);
        charts.types.update('active');
    }
}

// =============================================
// EXPORT DES STATISTIQUES
// =============================================
function exporterStatistiques(format = 'pdf') {
    const params = new URLSearchParams(window.location.search);
    params.set('export', format);
    
    const exportUrl = `statistiques.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// ANALYSES PRÉDICTIVES
// =============================================
function calculerTendances() {
    // Analyse des tendances basée sur les données actuelles
    const empruntsData = charts.emprunts?.data?.datasets[0]?.data || [];
    
    if (empruntsData.length >= 3) {
        const derniersMois = empruntsData.slice(-3);
        const moyenne = derniersMois.reduce((a, b) => a + b, 0) / derniersMois.length;
        const tendance = derniersMois[2] - derniersMois[0];
        
        return {
            moyenne: Math.round(moyenne),
            tendance: tendance > 0 ? 'hausse' : tendance < 0 ? 'baisse' : 'stable',
            pourcentage: Math.abs(Math.round((tendance / derniersMois[0]) * 100))
        };
    }
    
    return null;
}

function afficherAlertesGestion() {
    const alerts = [];
    
    // Vérifier les métriques critiques
    const retards = parseInt(document.querySelector('.metric-card.warning .metric-number')?.textContent?.replace(/[^\d]/g, '') || '0');
    const tauxOccupation = parseFloat(document.querySelector('.metric-card.info .metric-number')?.textContent?.replace(/[^\d.]/g, '') || '0');
    
    if (retards > 10) {
        alerts.push({
            type: 'warning',
            message: `${retards} emprunts en retard nécessitent une attention immédiate`
        });
    }
    
    if (tauxOccupation > 80) {
        alerts.push({
            type: 'info',
            message: `Taux d'occupation élevé (${tauxOccupation}%) - Envisager l'acquisition de nouveaux exemplaires`
        });
    }
    
    if (tauxOccupation < 20) {
        alerts.push({
            type: 'info',
            message: `Taux d'occupation faible (${tauxOccupation}%) - Opportunité de promotion`
        });
    }
    
    // Afficher les alertes
    alerts.forEach(alert => {
        showNotification(alert.message, alert.type);
    });
}

// =============================================
// UTILITAIRES STATISTIQUES
// =============================================
function rafraichirDonnees() {
    // Relancer le chargement de la page avec un indicateur de refresh
    const url = new URL(window.location);
    url.searchParams.set('refresh', Date.now());
    window.location.href = url.toString();
}

function toggleFullscreen(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            element.requestFullscreen();
        }
    }
}

// Fonction pour imprimer les statistiques
function imprimerStatistiques() {
    window.print();
}

// Fonction pour partager les statistiques
function partagerStatistiques() {
    if (navigator.share) {
        navigator.share({
            title: 'Statistiques Médiathèque Livresse',
            text: 'Consultez les dernières statistiques de la médiathèque',
            url: window.location.href
        });
    } else {
        // Fallback : copier l'URL dans le presse-papier
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Lien copié dans le presse-papier', 'success');
        });
    }
}

// =============================================
// NETTOYAGE DES RESSOURCES
// =============================================
window.addEventListener('beforeunload', function() {
    // Nettoyer les instances de graphiques
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
});

// =============================================
// GESTION DES ERREURS SPÉCIFIQUES AUX GRAPHIQUES
// =============================================
Chart.defaults.plugins.legend.onError = function(error) {
    console.error('Erreur dans le graphique:', error);
    showNotification('Erreur lors du chargement des graphiques', 'warning');
};

// =============================================
// RESPONSIVE POUR LES GRAPHIQUES
// =============================================
window.addEventListener('resize', debounce(function() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
}, 250));

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('profilAdherentTitle').textContent = 
                `Profil de ${data.prenom} ${data.nom}`;
            
            // Construire le contenu du profil
            const content = `
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${data.prenom.charAt(0)}${data.nom.charAt(0)}
                    </div>
                    <div class="profile-info">
                        <h3>${data.prenom} ${data.nom}</h3>
                        <div class="profile-meta">
                            <span class="profile-status status-${data.statut}">${data.statut.toUpperCase()}</span>
                            <span class="profile-id">ID: #${String(data.id).padStart(3, '0')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-details-grid">
                    <div class="detail-group">
                        <h4>Informations personnelles</h4>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Email</span>
                            <span class="profile-detail-value">${data.email || 'Non renseigné'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Téléphone</span>
                            <span class="profile-detail-value">${data.telephone || 'Non renseigné'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Adresse</span>
                            <span class="profile-detail-value">${data.adresse || 'Non renseignée'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Date d'inscription</span>
                            <span class="profile-detail-value">${data.date_inscription || 'Inconnue'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Activité</h4>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Emprunts en cours</span>
                            <span class="profile-detail-value">${data.emprunts_actifs}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Total emprunts</span>
                            <span class="profile-detail-value">${data.total_emprunts}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Dernière activité</span>
                            <span class="profile-detail-value">${data.derniere_activite || 'Jamais'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="profile-detail-label">Retards</span>
                            <span class="profile-detail-value">${data.nb_retards} retard(s)</span>
                        </div>
                    </div>
                </div>
                
                <div class="emprunts-history">
                    <h4>Historique des emprunts</h4>
                    <div class="emprunts-summary">
                        <div class="summary-card">
                            <span class="summary-number">${data.emprunts_actifs}</span>
                            <span class="summary-label">En cours</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-number">${data.emprunts_retard}</span>
                            <span class="summary-label">En retard</span>
                        </div>
                        <div class="summary-card">
                            <span class="summary-number">${data.total_emprunts}</span>
                            <span class="summary-label">Total</span>
                        </div>
                    </div>
                    
                    <div class="emprunts-list">
                        ${data.emprunts_recents.map(emprunt => `
                            <div class="emprunt-item ${emprunt.statut.replace(' ', '-')}">
                                <div class="emprunt-media">
                                    <div class="emprunt-titre">${emprunt.titre}</div>
                                    <div class="emprunt-auteur">${emprunt.auteur}</div>
                                </div>
                                <div class="emprunt-dates">
                                    <div>Emprunté: ${emprunt.date_emprunt}</div>
                                    <div>Retour: ${emprunt.date_retour}</div>
                                    <span class="emprunt-status status-${emprunt.statut.replace(' ', '-')}">${emprunt.statut}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('profilAdherentContent').innerHTML = content;
            
            // Configurer le bouton modifier
            document.getElementById('btnModifierDepuisProfil').onclick = () => {
                fermerModal('modalProfilAdherent');
                modifierAdherent(adherentId);
            };
            
            ouvrirModal('modalProfilAdherent');
        } else {
            showNotification('Impossible de récupérer le profil de l\'adhérent', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function voirEmpruntsAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_emprunts_adherent.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('empruntsAdherentTitle').textContent = 
                `Emprunts de ${data.adherent_nom}`;
            
            // Construire la liste des emprunts
            const content = `
                <div class="emprunts-summary">
                    <div class="summary-card">
                        <span class="summary-number">${data.emprunts_actifs}</span>
                        <span class="summary-label">En cours</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-number">${data.emprunts_retard}</span>
                        <span class="summary-label">En retard</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-number">${data.total_emprunts}</span>
                        <span class="summary-label">Total</span>
                    </div>
                </div>
                
                <div class="emprunts-list">
                    ${data.emprunts.map(emprunt => `
                        <div class="emprunt-item ${emprunt.statut.replace(' ', '-')}">
                            <div class="emprunt-media">
                                <div class="emprunt-titre">${emprunt.titre}</div>
                                <div class="emprunt-auteur">${emprunt.auteur}</div>
                                <div class="emprunt-exemplaire">Exemplaire #${emprunt.numero_exemplaire}</div>
                            </div>
                            <div class="emprunt-dates">
                                <div>Emprunté: ${emprunt.date_emprunt}</div>
                                <div>Retour prévu: ${emprunt.date_retour_prevue}</div>
                                ${emprunt.jours_retard > 0 ? `<div style="color: #dc3545;">Retard: ${emprunt.jours_retard} jour(s)</div>` : ''}
                                <span class="emprunt-status status-${emprunt.statut.replace(' ', '-')}">${emprunt.statut}</span>
                            </div>
                            ${emprunt.statut !== 'rendu' ? `
                                <div class="emprunt-actions">
                                    <button class="btn-mini btn-mini-edit" onclick="prolongerEmprunt(${emprunt.id})">Prolonger</button>
                                    <button class="btn-mini btn-mini-delete" onclick="marquerRendu(${emprunt.id})">Rendre</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('empruntsAdherentContent').innerHTML = content;
            ouvrirModal('modalEmpruntsAdherent');
        } else {
            showNotification('Impossible de récupérer les emprunts', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function modifierAdherent(adherentId) {
    currentAdherentId = adherentId;
    
    try {
        const response = await fetch(`ajax/get_adherent_details.php?id=${adherentId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Remplir le formulaire de modification
            document.getElementById('modifier_adherent_id').value = data.id;
            document.getElementById('modifier_nom').value = data.nom;
            document.getElementById('modifier_prenom').value = data.prenom;
            document.getElementById('modifier_email').value = data.email;
            document.getElementById('modifier_statut').value = data.statut;
            
            ouvrirModal('modalModifierAdherent');
        } else {
            showNotification('Impossible de récupérer les données de l\'adhérent', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function changerStatutAdherent(adherentId, nouveauStatut) {
    const action = nouveauStatut === 'actif' ? 'réactiver' : 'désactiver';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet adhérent ?`)) {
        return;
    }
    
    try {
        const response = await fetch('ajax/changer_statut_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adherent_id: adherentId,
                nouveau_statut: nouveauStatut,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Adhérent ${action === 'réactiver' ? 'réactivé' : 'désactivé'} avec succès !`, 'success');
            updateAdherentRow(adherentId, nouveauStatut);
        } else {
            showNotification(result.message || `Erreur lors du changement de statut`, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerAdherent(adherentId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet adhérent ?\n\nCette action est irréversible.')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adherent_id: adherentId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent supprimé avec succès !', 'success');
            // Supprimer la ligne du tableau
            const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.remove();
                    updateStatistics();
                }, 500);
            }
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateAdherentRow(adherentId, nouveauStatut) {
    const row = document.querySelector(`[data-adherent-id="${adherentId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.member-status-badge');
    if (statusBadge) {
        statusBadge.className = `member-status-badge status-${nouveauStatut}`;
        statusBadge.textContent = nouveauStatut.charAt(0).toUpperCase() + nouveauStatut.slice(1);
    }
    
    // Mettre à jour la classe de la ligne
    if (nouveauStatut === 'inactif') {
        row.classList.add('inactive');
    } else {
        row.classList.remove('inactive');
    }
    
    // Mettre à jour les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell) {
        const actionButtons = actionsCell.querySelector('.action-buttons');
        const currentButtons = actionButtons.innerHTML;
        
        if (nouveauStatut === 'actif') {
            actionButtons.innerHTML = currentButtons.replace(
                /btn-activate[^>]*>Activer/g,
                `btn-deactivate" onclick="changerStatutAdherent(${adherentId}, 'inactif')" title="Désactiver l'adhérent">Désactiver`
            );
        } else {
            actionButtons.innerHTML = currentButtons.replace(
                /btn-deactivate[^>]*>Désactiver/g,
                `btn-activate" onclick="changerStatutAdherent(${adherentId}, 'actif')" title="Réactiver l'adhérent">Activer`
            );
        }
    }
    
    // Animation de mise à jour
    row.classList.add('member-updated');
    setTimeout(() => {
        row.classList.remove('member-updated');
    }, 1500);
}

function creerNouvelEmpruntPour() {
    // Fermer la modal actuelle et ouvrir celle de nouvel emprunt
    fermerModal('modalEmpruntsAdherent');
    
    // Si on a l'ID de l'adhérent, on peut pré-sélectionner dans le formulaire
    ouvrirModalNouvelEmprunt();
    
    // Pré-sélectionner l'adhérent si possible
    if (currentAdherentId) {
        setTimeout(() => {
            const adherentSelect = document.getElementById('adherent_id');
            if (adherentSelect) {
                adherentSelect.value = currentAdherentId;
            }
        }, 100);
    }
}

// =============================================
// EXPORT ADHÉRENTS
// =============================================
function exportAdherents() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `adherents.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// HANDLERS FORMULAIRES ADHÉRENTS
// =============================================
async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Ajout en cours...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success/**
 * JavaScript pour l'interface administrateur - Médiathèque Livresse
 */

// =============================================
// VARIABLES GLOBALES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null; // Pour les actions sur les emprunts

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE EMPRUNTS
// =============================================
function initializeEmpruntsPage() {
    // Calcul automatique de la date de retour
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (dureeInput && dateRetourInput) {
        dureeInput.addEventListener('input', calculateReturnDate);
        calculateReturnDate(); // Calcul initial
    }
    
    // Auto-soumission des filtres avec délai
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function calculateReturnDate() {
    const dureeInput = document.getElementById('duree_jours');
    const dateRetourInput = document.getElementById('date_retour_prevue');
    
    if (!dureeInput || !dateRetourInput) return;
    
    const duree = parseInt(dureeInput.value) || 21;
    const today = new Date();
    const returnDate = new Date(today.getTime() + (duree * 24 * 60 * 60 * 1000));
    
    dateRetourInput.value = returnDate.toLocaleDateString('fr-FR');
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N : Nouvel emprunt
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouvelEmprunt();
    }
    
    // Échap : Fermer modal
    if (e.key === 'Escape' && currentModal) {
        fermerModal(currentModal);
    }
    
    // F3 : Focus sur la recherche
    if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
}

// =============================================
// GESTION DES FILTRES
// =============================================
function submitFilters() {
    const form = document.getElementById('filtersForm');
    if (form) {
        form.submit();
    }
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function marquerRendu(empruntId) {
    currentEmpruntId = empruntId;
    
    // Récupérer les détails de l'emprunt
    try {
        const response = await fetch(`ajax/get_emprunt_details.php?id=${empruntId}`);
        const result = await response.json();
        
        if (result.success) {
            // Remplir les détails dans la modal
            const detailsContainer = document.getElementById('detailsRetour');
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Média :</span>
                    <span class="detail-value">${result.data.titre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emprunteur :</span>
                    <span class="detail-value">${result.data.emprunteur}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date d'emprunt :</span>
                    <span class="detail-value">${result.data.date_emprunt}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date de retour prévue :</span>
                    <span class="detail-value">${result.data.date_retour_prevue}</span>
                </div>
            `;
            
            ouvrirModal('modalConfirmationRetour');
        } else {
            showNotification('Impossible de récupérer les détails de l\'emprunt', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        // Fallback : confirmation simple
        if (confirm('Confirmer le retour de cet emprunt ?')) {
            effectuerRetour(empruntId);
        }
    }
}

async function effectuerRetour(empruntId) {
    const btnConfirmer = document.getElementById('btnConfirmerRetour');
    
    try {
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
            btnConfirmer.textContent = 'Traitement...';
        }
        
        const response = await fetch('ajax/retourner_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt marqué comme rendu !', 'success');
            fermerModal('modalConfirmationRetour');
            
            // Rafraîchir la ligne dans le tableau
            updateEmpruntRow(empruntId, 'rendu');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors du retour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.textContent = 'Confirmer le retour';
        }
    }
}

function updateEmpruntRow(empruntId, newStatus) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge status-${newStatus}`;
        statusBadge.textContent = newStatus === 'rendu' ? 'Rendu' : newStatus;
    }
    
    // Remplacer les boutons d'action
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell && newStatus === 'rendu') {
        actionsCell.innerHTML = '<span class="text-muted">-</span>';
    }
    
    // Supprimer la classe overdue si applicable
    row.classList.remove('overdue');
    
    // Animation de mise à jour
    row.classList.add('success-highlight');
    setTimeout(() => {
        row.classList.remove('success-highlight');
    }, 2000);
}

// =============================================
// HANDLERS DES FORMULAIRES SPÉCIALISÉS
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enregistrer l\'emprunt';
    }
}

// =============================================
// VARIABLES GLOBALES ÉTENDUES
// =============================================
let currentModal = null;
let isMobile = window.innerWidth <= 768;
let currentEmpruntId = null;
let currentMediaId = null; // Pour les actions sur les médias

// =============================================
// INITIALISATION ÉTENDUE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeResponsive();
    initializeForms();
    initializeEmpruntsPage();
    initializeStockPage();
    updateStatistics();
    
    // Mise à jour des statistiques toutes les 5 minutes
    setInterval(updateStatistics, 300000);
});

// =============================================
// INITIALISATION SPÉCIFIQUE PAGE STOCK
// =============================================
function initializeStockPage() {
    // Vérifier si on est sur la page stock
    if (!document.querySelector('.stock-table')) return;
    
    // Auto-soumission des filtres avec délai pour le stock
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            submitFilters();
        }, 500));
    }
    
    // Initialiser les indicateurs de stock
    highlightLowStock();
    
    // Gestion des raccourcis clavier spécifiques au stock
    document.addEventListener('keydown', handleStockKeyboardShortcuts);
}

function highlightLowStock() {
    const rows = document.querySelectorAll('.media-row');
    rows.forEach(row => {
        const availabilityInfo = row.querySelector('.availability-info');
        if (availabilityInfo) {
            const availableCount = parseInt(availabilityInfo.querySelector('.count-number').textContent);
            const totalCount = parseInt(availabilityInfo.querySelector('.total-number').textContent);
            
            // Marquer les stocks faibles (moins de 20% disponible)
            if (totalCount > 0 && (availableCount / totalCount) < 0.2 && availableCount > 0) {
                row.classList.add('low-stock');
            }
            
            // Marquer les ruptures de stock
            if (availableCount === 0) {
                row.classList.add('out-of-stock');
            }
        }
    });
}

function handleStockKeyboardShortcuts(e) {
    // Ctrl/Cmd + M : Nouveau média
    if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !currentModal) {
        e.preventDefault();
        ouvrirModalNouveauMedia();
    }
    
    // Ctrl/Cmd + E : Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !currentModal) {
        e.preventDefault();
        exportStock();
    }
}

// =============================================
// ACTIONS SUR LES MÉDIAS
// =============================================
async function voirDetailsMedia(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_media_details.php?id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre de la modal
            document.getElementById('detailsMediaTitle').textContent = `Détails - ${data.titre}`;
            
            // Construire le contenu
            const content = `
                <div class="details-grid">
                    <div class="detail-section">
                        <h4>Informations générales</h4>
                        <div class="detail-item">
                            <span class="detail-label">ID</span>
                            <span class="detail-value">#${String(data.id).padStart(3, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Titre</span>
                            <span class="detail-value">${data.titre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Auteur/Artiste</span>
                            <span class="detail-value">${data.auteur}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${data.type_nom}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Genre</span>
                            <span class="detail-value">${data.genre || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Éditeur</span>
                            <span class="detail-value">${data.editeur || 'Non spécifié'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Année</span>
                            <span class="detail-value">${data.date_parution || 'Non spécifiée'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">État général</span>
                            <span class="detail-value">${data.etat_conservation}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Disponibilité</h4>
                        <div class="detail-item">
                            <span class="detail-label">Exemplaires total</span>
                            <span class="detail-value">${data.total_exemplaires}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Disponibles</span>
                            <span class="detail-value" style="color: #28a745; font-weight: 600;">${data.exemplaires_disponibles}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Empruntés</span>
                            <span class="detail-value" style="color: #dc3545; font-weight: 600;">${data.exemplaires_empruntes}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Taux d'emprunt</span>
                            <span class="detail-value">${Math.round((data.exemplaires_empruntes / data.total_exemplaires) * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Liste des exemplaires</h4>
                    <div class="exemplaires-list">
                        ${data.exemplaires.map(ex => `
                            <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                                <div class="exemplaire-info">
                                    <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                    <span class="exemplaire-etat">${ex.etat}</span>
                                </div>
                                <div class="exemplaire-status">
                                    <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                        ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                    </span>
                                    ${ex.emprunteur ? `<span style="font-size: 0.7rem; color: #666; margin-left: 0.5rem;">par ${ex.emprunteur}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('detailsMediaContent').innerHTML = content;
            
            // Configurer le bouton modifier
            document.getElementById('btnModifierDepuisDetails').onclick = () => {
                fermerModal('modalDetailsMedia');
                modifierMedia(mediaId);
            };
            
            ouvrirModal('modalDetailsMedia');
        } else {
            showNotification('Impossible de récupérer les détails du média', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function modifierMedia(mediaId) {
    // Pour l'instant, on affiche une notification
    // Tu peux implémenter une vraie modal de modification plus tard
    showNotification('Fonctionnalité de modification en cours de développement', 'info');
}

async function gererExemplaires(mediaId) {
    currentMediaId = mediaId;
    
    try {
        const response = await fetch(`ajax/get_exemplaires.php?media_id=${mediaId}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Mettre à jour le titre
            document.getElementById('exemplairesMediaTitle').textContent = 
                `Exemplaires - ${data.media_titre}`;
            
            // Construire la liste des exemplaires
            const content = `
                <div class="exemplaires-summary">
                    <p><strong>Total :</strong> ${data.exemplaires.length} exemplaire(s)</p>
                    <p><strong>Disponibles :</strong> ${data.exemplaires.filter(ex => ex.disponible).length}</p>
                    <p><strong>Empruntés :</strong> ${data.exemplaires.filter(ex => !ex.disponible).length}</p>
                </div>
                
                <div class="exemplaires-list">
                    ${data.exemplaires.map(ex => `
                        <div class="exemplaire-item ${ex.disponible ? '' : 'indisponible'}">
                            <div class="exemplaire-info">
                                <span class="exemplaire-numero">Exemplaire #${ex.numero}</span>
                                <span class="exemplaire-etat">${ex.etat}</span>
                                ${ex.date_acquisition ? `<span class="exemplaire-date">Ajouté le ${ex.date_acquisition}</span>` : ''}
                            </div>
                            <div class="exemplaire-actions">
                                <span class="exemplaire-statut ${ex.disponible ? 'statut-disponible' : 'statut-emprunte'}">
                                    ${ex.disponible ? 'Disponible' : 'Emprunté'}
                                </span>
                                ${ex.disponible ? `
                                    <button class="btn-mini btn-mini-edit" onclick="modifierExemplaire(${ex.id})">Modifier</button>
                                    <button class="btn-mini btn-mini-delete" onclick="supprimerExemplaire(${ex.id})">Supprimer</button>
                                ` : `
                                    <span style="font-size: 0.7rem; color: #666;">par ${ex.emprunteur || 'N/A'}</span>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('exemplairesContent').innerHTML = content;
            ouvrirModal('modalGestionExemplaires');
        } else {
            showNotification('Impossible de récupérer les exemplaires', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function ajouterExemplaire() {
    if (!currentMediaId) return;
    
    try {
        const response = await fetch('ajax/ajouter_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: currentMediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire ajouté avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerExemplaire(exemplaireId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exemplaire ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_exemplaire.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exemplaire_id: exemplaireId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Exemplaire supprimé avec succès !', 'success');
            // Rafraîchir la modal des exemplaires
            gererExemplaires(currentMediaId);
            // Mettre à jour la ligne du tableau
            updateMediaRow(currentMediaId);
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function supprimerMedia(mediaId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce média et tous ses exemplaires ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/supprimer_media.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: mediaId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média supprimé avec succès !', 'success');
            // Supprimer la ligne du tableau
            const row = document.querySelector(`[data-media-id="${mediaId}"]`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => {
                    row.remove();
                    updateStatistics();
                }, 500);
            }
        } else {
            showNotification(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateMediaRow(mediaId) {
    // Recharger les données de la ligne après une modification
    fetch(`ajax/get_media_row.php?id=${mediaId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const row = document.querySelector(`[data-media-id="${mediaId}"]`);
                if (row) {
                    // Mise à jour simplifiée - en production, tu peux faire plus détaillé
                    row.classList.add('stock-updated');
                    setTimeout(() => {
                        row.classList.remove('stock-updated');
                    }, 1500);
                }
            }
        })
        .catch(error => console.error('Erreur mise à jour ligne:', error));
}

// =============================================
// EXPORT DU STOCK
// =============================================
function exportStock() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `stock.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// =============================================
// HANDLERS FORMULAIRES STOCK
// =============================================
async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Ajout en cours...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            
            // Rafraîchir la page ou ajouter la ligne
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Ajouter au stock';
    }
}

// =============================================
// UTILITAIRES STOCK
// =============================================
function searchMedia(query) {
    const rows = document.querySelectorAll('.media-row');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        const title = row.querySelector('.media-title').textContent.toLowerCase();
        const author = row.querySelector('.media-author').textContent.toLowerCase();
        
        if (title.includes(normalizedQuery) || author.includes(normalizedQuery)) {
            row.style.display = '';
            row.classList.add('highlight-match');
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight-match');
        }
    });
    
    // Supprimer les highlights après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.highlight-match').forEach(row => {
            row.classList.remove('highlight-match');
        });
    }, 2000);
}

// Fonction pour calculer les statistiques en temps réel
function calculateStockStats() {
    const rows = document.querySelectorAll('.media-row');
    let totalDisponibles = 0;
    let totalEmpruntes = 0;
    
    rows.forEach(row => {
        const available = parseInt(row.querySelector('.count-number').textContent);
        const total = parseInt(row.querySelector('.total-number').textContent);
        
        totalDisponibles += available;
        totalEmpruntes += (total - available);
    });
    
    return {
        disponibles: totalDisponibles,
        empruntes: totalEmpruntes,
        total: totalDisponibles + totalEmpruntes
    };
}

// =============================================
// GESTION DES MODALES AMÉLIORÉE
// =============================================

// =============================================
// GESTION DE LA NAVIGATION
// =============================================
function initializeEventListeners() {
    // Menu toggle pour mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Fermeture des modales au clic sur overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            fermerModal(e.target.id);
        }
    });
    
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentModal) {
            fermerModal(currentModal);
        }
    });
    
    // Fermeture automatique des alertes
    initializeAlerts();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('expanded');
}

function initializeResponsive() {
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.remove('active');
            mainContent.classList.remove('expanded');
        }
    });
}

// =============================================
// GESTION AMÉLIORÉE DES MODALES
// =============================================
function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentModal = modalId;
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier champ du formulaire
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Gestion spéciale pour la modal de confirmation
        if (modalId === 'modalConfirmationRetour') {
            const btnConfirmer = document.getElementById('btnConfirmerRetour');
            if (btnConfirmer) {
                btnConfirmer.onclick = () => effectuerRetour(currentEmpruntId);
            }
        }
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        currentModal = null;
        currentEmpruntId = null;
        document.body.style.overflow = '';
        
        // Reset du formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
            
            // Recalculer la date de retour après reset
            if (modalId === 'modalNouvelEmprunt') {
                setTimeout(calculateReturnDate, 100);
            }
        }
    }
}

// =============================================
// VALIDATION AMÉLIORÉE DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validations spécifiques pour les emprunts
    if (form.id === 'formNouvelEmprunt') {
        const mediaId = form.querySelector('#media_id').value;
        const adherentId = form.querySelector('#adherent_id').value;
        
        if (!mediaId) {
            showFieldError(form.querySelector('#media_id'), 'Veuillez sélectionner un média');
            isValid = false;
        }
        
        if (!adherentId) {
            showFieldError(form.querySelector('#adherent_id'), 'Veuillez sélectionner un emprunteur');
            isValid = false;
        }
    }
    
    return isValid;
}

// =============================================
// ACTIONS ÉTENDUES SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    // Demander la durée de prolongation
    const jours = prompt('Nombre de jours de prolongation (1-30) :', '14');
    
    if (jours === null) return; // Annulé
    
    const joursNum = parseInt(jours);
    if (isNaN(joursNum) || joursNum < 1 || joursNum > 30) {
        showNotification('Durée invalide (1-30 jours)', 'error');
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                jours: joursNum,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Emprunt prolongé de ${joursNum} jours !`, 'success');
            
            // Mettre à jour la ligne
            updateEmpruntDateRetour(empruntId, result.data.nouvelle_date_retour);
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

function updateEmpruntDateRetour(empruntId, nouvelleDateRetour) {
    const row = document.querySelector(`[data-emprunt-id="${empruntId}"]`);
    if (!row) return;
    
    const returnDateCell = row.querySelector('.return-date');
    if (returnDateCell) {
        // Supprimer l'info de retard s'il y en avait
        const retardInfo = returnDateCell.querySelector('.retard-info');
        if (retardInfo) {
            retardInfo.remove();
        }
        
        // Mettre à jour la date
        returnDateCell.firstChild.textContent = nouvelleDateRetour;
        
        // Supprimer la classe overdue
        row.classList.remove('overdue');
        
        // Animation de mise à jour
        returnDateCell.classList.add('success-highlight');
        setTimeout(() => {
            returnDateCell.classList.remove('success-highlight');
        }, 2000);
    }
}

async function relancerAdherent(empruntId) {
    const btnRelancer = document.querySelector(`[onclick="relancerAdherent(${empruntId})"]`);
    
    try {
        if (btnRelancer) {
            btnRelancer.classList.add('loading');
            btnRelancer.disabled = true;
        }
        
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
            
            // Marquer visuellement que la relance a été envoyée
            if (btnRelancer) {
                btnRelancer.textContent = 'Relancé';
                btnRelancer.style.opacity = '0.6';
                
                // Réactiver après 5 secondes
                setTimeout(() => {
                    btnRelancer.textContent = 'Relancer';
                    btnRelancer.style.opacity = '1';
                    btnRelancer.disabled = false;
                }, 5000);
            }
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        if (btnRelancer) {
            btnRelancer.classList.remove('loading');
            btnRelancer.disabled = false;
        }
    }
}

// =============================================
// UTILITAIRES SUPPLÉMENTAIRES
// =============================================
function highlightOverdueLoans() {
    const rows = document.querySelectorAll('.emprunt-row');
    rows.forEach(row => {
        const retardInfo = row.querySelector('.retard-info');
        if (retardInfo) {
            row.classList.add('highlight-overdue');
        }
    });
}

function exportEmprunts() {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    
    const exportUrl = `emprunts.php?${params.toString()}`;
    window.location.href = exportUrl;
}

// Initialiser les highlights au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(highlightOverdueLoans, 500);
});

// =============================================
// GESTION DES NOTIFICATIONS AMÉLIORÉE
// =============================================

// Fonctions spécifiques pour chaque modal
function ouvrirModalNouvelEmprunt() {
    ouvrirModal('modalNouvelEmprunt');
}

function ouvrirModalNouveauMedia() {
    ouvrirModal('modalNouveauMedia');
}

function ouvrirModalNouvelAdherent() {
    ouvrirModal('modalNouvelAdherent');
}

// =============================================
// GESTION DES FORMULAIRES
// =============================================
function initializeForms() {
    // Formulaire nouvel emprunt
    const formEmprunt = document.getElementById('formNouvelEmprunt');
    if (formEmprunt) {
        formEmprunt.addEventListener('submit', handleNouvelEmprunt);
    }
    
    // Formulaire nouveau média
    const formMedia = document.getElementById('formNouveauMedia');
    if (formMedia) {
        formMedia.addEventListener('submit', handleNouveauMedia);
    }
    
    // Formulaire nouvel adhérent
    const formAdherent = document.getElementById('formNouvelAdherent');
    if (formAdherent) {
        formAdherent.addEventListener('submit', handleNouvelAdherent);
    }
    
    // Validation en temps réel
    initializeFormValidation();
}

function initializeFormValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Validation required
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    }
    
    // Validation email
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        }
    }
    
    // Validation numérique
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseInt(value) < parseInt(min)) {
            isValid = false;
            errorMessage = `Valeur minimum : ${min}`;
        }
        
        if (max && parseInt(value) > parseInt(max)) {
            isValid = false;
            errorMessage = `Valeur maximum : ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function clearFormErrors(form) {
    const errors = form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// =============================================
// HANDLERS DES FORMULAIRES
// =============================================
async function handleNouvelEmprunt(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        const response = await fetch('ajax/creer_emprunt.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt créé avec succès !', 'success');
            fermerModal('modalNouvelEmprunt');
            updateEmpruntsRecents();
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouveauMedia(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_media.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Média ajouté avec succès !', 'success');
            fermerModal('modalNouveauMedia');
            updateStatistics();
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

async function handleNouvelAdherent(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
        
        const response = await fetch('ajax/ajouter_adherent.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Adhérent ajouté avec succès !', 'success');
            fermerModal('modalNouvelAdherent');
        } else {
            showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-input, .form-select');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// =============================================
// ACTIONS SUR LES EMPRUNTS
// =============================================
async function prolongerEmprunt(empruntId) {
    if (!confirm('Confirmer la prolongation de cet emprunt ?')) {
        return;
    }
    
    try {
        const response = await fetch('ajax/prolonger_emprunt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Emprunt prolongé avec succès !', 'success');
            updateEmpruntsRecents();
        } else {
            showNotification(result.message || 'Erreur lors de la prolongation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function relancerAdherent(empruntId) {
    try {
        const response = await fetch('ajax/relancer_adherent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprunt_id: empruntId,
                csrf_token: document.querySelector('input[name="csrf_token"]').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Relance envoyée !', 'success');
        } else {
            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// =============================================
// MISE À JOUR DYNAMIQUE
// =============================================
async function updateStatistics() {
    try {
        const response = await fetch('ajax/get_statistiques.php');
        const stats = await response.json();
        
        if (stats.success) {
            document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.total_objets);
            
            document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_cours);
            
            document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = 
                new Intl.NumberFormat('fr-FR').format(stats.data.emprunts_retard);
        }
    } catch (error) {
        console.error('Erreur mise à jour statistiques:', error);
    }
}

async function updateEmpruntsRecents() {
    try {
        const response = await fetch('ajax/get_emprunts_recents.php');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('.recent-loans-section tbody');
            if (tbody) {
                tbody.innerHTML = result.html;
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour emprunts récents:', error);
    }
}

// =============================================
// NOTIFICATIONS
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible`;
    notification.innerHTML = `
        <button type="button" class="alert-close">&times;</button>
        ${message}
    `;
    
    const container = document.querySelector('.flash-messages') || 
                     createNotificationContainer();
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Fermeture automatique
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.alert-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '3000';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert-dismissible');
    
    alerts.forEach(alert => {
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeNotification(alert);
            });
        }
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                removeNotification(alert);
            }
        }, 5000);
    });
}

// =============================================
// UTILITAIRES
// =============================================
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// GESTION DES ERREURS GLOBALES
// =============================================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejetée:', e.reason);
    showNotification('Erreur de connexion au serveur', 'error');
});