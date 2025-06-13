<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Gestion des filtres
$typeFiltre = $_GET['type'] ?? '';
$disponibiliteFiltre = $_GET['disponibilite'] ?? '';
$rechercheFiltre = cleanInput($_GET['recherche'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$itemsParPage = 25;
$offset = ($page - 1) * $itemsParPage;

// Récupération des médias avec filtres
$medias = getMediasAvecDisponibilite($typeFiltre, $rechercheFiltre, $disponibiliteFiltre, $itemsParPage, $offset);

// Comptage total pour la pagination
$sqlCount = "SELECT COUNT(DISTINCT m.id) as total FROM media m
             LEFT JOIN type t ON m.type_id = t.id
             LEFT JOIN exemplaire ex ON m.id = ex.media_id
             WHERE 1=1";

$params = [];
if ($typeFiltre) {
    $sqlCount .= " AND m.type_id = :type";
    $params['type'] = $typeFiltre;
}
if ($rechercheFiltre) {
    $sqlCount .= " AND (m.Titre LIKE :recherche OR m.Auteur LIKE :recherche)";
    $params['recherche'] = "%$rechercheFiltre%";
}

// Ajout de la condition de disponibilité après le GROUP BY
$sqlCount .= " GROUP BY m.id";
if ($disponibiliteFiltre === 'disponible') {
    $sqlCount = "SELECT COUNT(*) as total FROM ($sqlCount HAVING SUM(CASE WHEN ex.disponible = 1 THEN 1 ELSE 0 END) > 0) as filtered";
} elseif ($disponibiliteFiltre === 'indisponible') {
    $sqlCount = "SELECT COUNT(*) as total FROM ($sqlCount HAVING SUM(CASE WHEN ex.disponible = 1 THEN 1 ELSE 0 END) = 0) as filtered";
} else {
    $sqlCount = "SELECT COUNT(*) as total FROM ($sqlCount) as filtered";
}

$stmtCount = $connexion->prepare($sqlCount);
foreach ($params as $key => $value) {
    $stmtCount->bindValue(":$key", $value);
}
$stmtCount->execute();
$totalMedias = $stmtCount->fetch()['total'];
$totalPages = ceil($totalMedias / $itemsParPage);

// Données pour les sélecteurs
$typesMedia = getTypesMedia();

$pageTitle = "Gestion du stock";
$currentPage = "stock";
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2 class="logo">LIVRESSE ADMINISTRATEUR</h2>
            </div>
            
            <nav class="nav-menu">
                <a href="index.php" class="nav-link">
                    <span class="nav-text">Tableau de bord</span>
                </a>
                <a href="emprunts.php" class="nav-link">
                    <span class="nav-text">Gestion des emprunts</span>
                </a>
                <a href="stock.php" class="nav-link active">
                    <span class="nav-text">Gestion du stock</span>
                </a>
                <a href="statistiques.php" class="nav-link">
                    <span class="nav-text">Statistiques</span>
                </a>
                <a href="adherents.php" class="nav-link">
                    <span class="nav-text">Adhérents</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="content-header">
                <div class="header-left">
                    <button class="menu-toggle" id="menuToggle">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                    <h1 class="page-title"><?php echo $pageTitle; ?></h1>
                </div>
                <div class="header-right">
                    <button class="btn-logout" onclick="window.location.href='../index.php'">
                        Déconnexion
                    </button>
                </div>
            </header>

            <!-- Flash Messages -->
            <div class="flash-messages">
                <?php display_flash_messages(); ?>
            </div>

            <!-- Contenu Stock -->
            <div class="page-content">
                <!-- Barre d'actions -->
                <section class="actions-bar">
                    <div class="filters-container">
                        <form method="GET" class="filters-form" id="filtersForm">
                            <div class="filter-group">
                                <select name="type" class="filter-select" onchange="submitFilters()">
                                    <option value="">Tous les types</option>
                                    <?php foreach ($typesMedia as $type): ?>
                                        <option value="<?php echo $type['id']; ?>" 
                                                <?php echo $typeFiltre == $type['id'] ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($type['Nom']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="filter-group">
                                <select name="disponibilite" class="filter-select" onchange="submitFilters()">
                                    <option value="">Toutes disponibilités</option>
                                    <option value="disponible" <?php echo $disponibiliteFiltre === 'disponible' ? 'selected' : ''; ?>>
                                        Disponible
                                    </option>
                                    <option value="indisponible" <?php echo $disponibiliteFiltre === 'indisponible' ? 'selected' : ''; ?>>
                                        Indisponible
                                    </option>
                                </select>
                            </div>

                            <div class="search-group">
                                <input type="text" 
                                       name="recherche" 
                                       class="search-input" 
                                       placeholder="Rechercher un média..." 
                                       value="<?php echo htmlspecialchars($rechercheFiltre); ?>">
                                <button type="submit" class="search-btn">
                                    <span class="search-icon">🔍</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div class="actions-right">
                        
                     <button class="btn btn-primary" onclick="ouvrirModal('modalNouveauMedia')">
    <span class="btn-icon">+</span>
    Ajouter un média
</button>
                    </div>
                </section>

                <!-- Statistiques rapides -->
                <section class="quick-stats">
                    <div class="stat-cards-grid">
                        <div class="quick-stat-card">
                            <div class="stat-icon media-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($totalMedias); ?></div>
                                <div class="stat-label">Médias</div>
                            </div>
                        </div>
                        
                        <?php
                        // Calcul statistiques rapides
                        $stmt = $connexion->query("SELECT COUNT(*) as total_exemplaires FROM exemplaire");
                        $totalExemplaires = $stmt->fetch()['total_exemplaires'];
                        
                        $stmt = $connexion->query("SELECT COUNT(*) as disponibles FROM exemplaire WHERE disponible = 1");
                        $exemplairesDisponibles = $stmt->fetch()['disponibles'];
                        
                        $stmt = $connexion->query("SELECT COUNT(*) as empruntes FROM exemplaire WHERE disponible = 0");
                        $exemplairesEmpruntes = $stmt->fetch()['empruntes'];
                        ?>
                        
                        <div class="quick-stat-card">
                            <div class="stat-icon available-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($exemplairesDisponibles); ?></div>
                                <div class="stat-label">Disponibles</div>
                            </div>
                        </div>
                        
                        <div class="quick-stat-card">
                            <div class="stat-icon borrowed-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($exemplairesEmpruntes); ?></div>
                                <div class="stat-label">Empruntés</div>
                            </div>
                        </div>
                        
                        <div class="quick-stat-card">
                            <div class="stat-icon total-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($totalExemplaires); ?></div>
                                <div class="stat-label">Total exemplaires</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Résultats et tri -->
                <section class="results-summary">
                    <div class="summary-stats">
                        <span class="result-count">
                            <?php echo number_format($totalMedias); ?> média(s) trouvé(s)
                        </span>
                        <?php if ($rechercheFiltre || $typeFiltre || $disponibiliteFiltre): ?>
                            <a href="stock.php" class="clear-filters">
                                Effacer les filtres
                            </a>
                        <?php endif; ?>
                    </div>
                </section>

                <!-- Tableau du stock -->
                <section class="stock-table-section">
                    <div class="table-container">
                        <table class="data-table stock-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>TITRE</th>
                                    <th>AUTEUR/ARTISTE</th>
                                    <th>TYPE</th>
                                    <th>GENRE</th>
                                    <th>ÉTAT</th>
                                    <th>EXEMPLAIRES</th>
                                    <th>DISPONIBILITÉ</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($medias)): ?>
                                    <tr>
                                        <td colspan="9" class="empty-state">
                                            <?php if ($rechercheFiltre || $typeFiltre || $disponibiliteFiltre): ?>
                                                Aucun média trouvé avec ces critères
                                            <?php else: ?>
                                                Aucun média dans le stock
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($medias as $media): ?>
                                        <tr class="media-row <?php echo $media['exemplaires_disponibles'] == 0 ? 'unavailable' : ''; ?>" 
                                            data-media-id="<?php echo $media['id']; ?>">
                                            <td class="media-id">
                                                <?php echo str_pad($media['id'], 3, '0', STR_PAD_LEFT); ?>
                                            </td>
                                            <td class="media-title-cell">
                                                <div class="media-title"><?php echo htmlspecialchars($media['Titre']); ?></div>
                                                <?php if ($media['Date_Parution']): ?>
                                                    <div class="media-year"><?php echo htmlspecialchars($media['Date_Parution']); ?></div>
                                                <?php endif; ?>
                                            </td>
                                            <td class="media-author">
                                                <?php echo htmlspecialchars($media['Auteur']); ?>
                                                <?php if ($media['Editeur']): ?>
                                                    <div class="media-editor"><?php echo htmlspecialchars($media['Editeur']); ?></div>
                                                <?php endif; ?>
                                            </td>
                                            <td class="media-type">
                                                <span class="type-badge type-<?php echo strtolower(str_replace(' ', '-', $media['type_nom'])); ?>">
                                                    <?php echo htmlspecialchars($media['type_nom']); ?>
                                                </span>
                                            </td>
                                            <td class="media-genre">
                                                <?php echo htmlspecialchars($media['Genre'] ?: '-'); ?>
                                            </td>
                                            <td class="media-condition">
                                                <span class="condition-badge condition-<?php echo str_replace(' ', '-', $media['etat_Conservation']); ?>">
                                                    <?php echo ucfirst($media['etat_Conservation']); ?>
                                                </span>
                                            </td>
                                            <td class="exemplaires-info">
                                                <div class="exemplaires-count">
                                                    <span class="total-count"><?php echo $media['total_exemplaires']; ?></span>
                                                    <span class="count-label">total</span>
                                                </div>
                                            </td>
                                            <td class="availability-cell">
                                                <div class="availability-info">
                                                    <div class="available-count">
                                                        <span class="count-number"><?php echo $media['exemplaires_disponibles']; ?></span>
                                                        <span class="count-separator">/</span>
                                                        <span class="total-number"><?php echo $media['total_exemplaires']; ?></span>
                                                    </div>
                                                    <div class="availability-bar">
                                                        <?php 
                                                        $pourcentage = $media['total_exemplaires'] > 0 
                                                            ? ($media['exemplaires_disponibles'] / $media['total_exemplaires']) * 100 
                                                            : 0;
                                                        ?>
                                                        <div class="availability-fill" style="width: <?php echo $pourcentage; ?>%"></div>
                                                    </div>
                                                    <div class="availability-status">
                                                        <?php if ($media['exemplaires_disponibles'] > 0): ?>
                                                            <span class="status-available">Disponible</span>
                                                        <?php else: ?>
                                                            <span class="status-unavailable">Indisponible</span>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="actions-cell">
                                                <div class="action-buttons">

                                                    <button class="btn-action btn-edit" 
                                                            onclick="modifierMedia(<?php echo $media['id']; ?>)"
                                                            title="Modifier le média">
                                                        Modifier
                                                    </button>
                                                    <?php if ($media['exemplaires_disponibles'] == $media['total_exemplaires']): ?>
                                                        <button class="btn-action btn-delete" 
                                                                onclick="supprimerMedia(<?php echo $media['id']; ?>)"
                                                                title="Supprimer le média">
                                                            Supprimer
                                                        </button>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <?php if ($totalPages > 1): ?>
                        <div class="pagination-container">
                            <nav class="pagination">
                                <?php if ($page > 1): ?>
                                    <a href="?page=<?php echo $page-1; ?>&type=<?php echo urlencode($typeFiltre); ?>&disponibilite=<?php echo urlencode($disponibiliteFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link">« Précédent</a>
                                <?php endif; ?>

                                <?php for ($i = max(1, $page-2); $i <= min($totalPages, $page+2); $i++): ?>
                                    <a href="?page=<?php echo $i; ?>&type=<?php echo urlencode($typeFiltre); ?>&disponibilite=<?php echo urlencode($disponibiliteFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link <?php echo $i === $page ? 'active' : ''; ?>">
                                        <?php echo $i; ?>
                                    </a>
                                <?php endfor; ?>

                                <?php if ($page < $totalPages): ?>
                                    <a href="?page=<?php echo $page+1; ?>&type=<?php echo urlencode($typeFiltre); ?>&disponibilite=<?php echo urlencode($disponibiliteFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link">Suivant »</a>
                                <?php endif; ?>
                            </nav>
                        </div>
                    <?php endif; ?>
                </section>
            </div>
        </main>
    </div>

    <!-- Modal Nouveau Média -->
    <div class="modal-overlay" id="modalNouveauMedia">
        <div class="modal modal-large">
            <div class="modal-header">
                <h3 class="modal-title">Ajouter un nouveau média</h3>
                <button class="modal-close" onclick="fermerModal('modalNouveauMedia')">&times;</button>
            </div>
            <div class="modal-body">
                <form class="form-container" id="formNouveauMedia">
                    <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="titre" class="form-label">Titre *</label>
                            <input type="text" name="titre" id="titre" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="auteur" class="form-label">Auteur/Artiste *</label>
                            <input type="text" name="auteur" id="auteur" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="type_id" class="form-label">Type *</label>
                            <select name="type_id" id="type_id" class="form-select" required>
                                <option value="">Sélectionnez un type</option>
                                <?php foreach ($typesMedia as $type): ?>
                                    <option value="<?php echo $type['id']; ?>">
                                        <?php echo htmlspecialchars($type['Nom']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="etat_conservation" class="form-label">État de conservation</label>
                            <select name="etat_conservation" id="etat_conservation" class="form-select">
                                <option value="neuf">Neuf</option>
                                <option value="bon etat" selected>Bon état</option>
                                <option value="mauvais etat">Mauvais état</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="editeur" class="form-label">Éditeur/Label</label>
                        <input type="text" name="editeur" id="editeur" class="form-input">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="date_parution" class="form-label">Année de parution</label>
                            <input type="text" name="date_parution" id="date_parution" 
                                   class="form-input" placeholder="YYYY" maxlength="4">
                        </div>
                        <div class="form-group">
                            <label for="nb_exemplaires" class="form-label">Nombre d'exemplaires</label>
                            <input type="number" name="nb_exemplaires" id="nb_exemplaires" 
                                   class="form-input" value="1" min="1" max="20">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="genre" class="form-label">Genre</label>
                        <input type="text" name="genre" id="genre" class="form-input" 
                               placeholder="Roman, Rock, Action, etc.">
                    </div>

                    <div class="form-group">
                        <label for="description" class="form-label">Description (optionnelle)</label>
                        <textarea name="description" id="description" class="form-textarea" rows="3" 
                                  placeholder="Résumé, caractéristiques particulières..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouveauMedia')">
                    Annuler
                </button>
                <button type="submit" form="formNouveauMedia" class="btn btn-primary">
                    Ajouter au stock
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Détails Média -->
    <div class="modal-overlay" id="modalDetailsMedia">
        <div class="modal modal-large">
            <div class="modal-header">
                <h3 class="modal-title" id="detailsMediaTitle">Détails du média</h3>
                <button class="modal-close" onclick="fermerModal('modalDetailsMedia')">&times;</button>
            </div>
            <div class="modal-body">
                <div id="detailsMediaContent">
                    <!-- Contenu dynamique -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalDetailsMedia')">
                    Fermer
                </button>
                <button type="button" class="btn btn-primary" id="btnModifierDepuisDetails">
                    Modifier
                </button>
            </div>
        </div>
    </div>

<div class="modal-overlay" id="modalNouveauMedia">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Ajouter un nouveau média</h3>
            <button class="modal-close" onclick="fermerModal('modalNouveauMedia')">&times;</button>
        <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="confirmDeleteModalLabel">Confirmer la suppression</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Supprimer</button>
            </div>
        </div>
    </div>
</div>

<script src="../assets/js/admin.js"></script>
<script>
    // Variable pour stocker l'ID du média à supprimer
    let mediaToDeleteId = null;

    function supprimerMedia(mediaId) {
        mediaToDeleteId = mediaId;
        const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        confirmDeleteModal.show();
    }

    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (mediaToDeleteId) {
            // Ici, vous feriez typiquement une requête AJAX vers un script PHP
            // pour gérer la suppression réelle de la base de données.
            // Pour la démonstration, nous allons juste le logger et masquer la modale.
            console.log("Suppression du média avec l'ID : " + mediaToDeleteId);

            // Exemple d'une requête fetch (vous devrez créer 'delete_media.php')
            fetch('delete_media.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'id=' + mediaToDeleteId
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Média supprimé avec succès!');
                    // Optionnellement, retirer la ligne du tableau ou rafraîchir la page
                    window.location.reload(); // Rechargement simple pour l'instant
                } else {
                    alert('Erreur lors de la suppression du média: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Une erreur est survenue lors de la suppression.');
            });

            // Masquer la modale après avoir initié la suppression
            const confirmDeleteModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
            if (confirmDeleteModal) {
                confirmDeleteModal.hide();
            }
        }
    });

    function modifierMedia(mediaId) {
        // Implémentez ici la logique pour la modification des médias.
        // Cela impliquera probablement :
        // 1. Récupérer les données du média actuel en utilisant mediaId (AJAX vers un script PHP).
        // 2. Remplir un formulaire avec les données récupérées.
        // 3. Afficher une modale avec le formulaire rempli.
        // 4. Gérer la soumission du formulaire (AJAX vers un script PHP pour mettre à jour la base de données).
        console.log("Modifier le média avec l'ID : " + mediaId);
        // Exemple : Redirection vers une page d'édition ou ouverture d'une modale avec un formulaire d'édition
        window.location.href = 'edit_media.php?id=' + mediaId; // Ou ouvrir une modale
    }

    // Fonction pour fermer n'importe quelle modale par son ID
    function fermerModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }

</script>
</body>
</html>