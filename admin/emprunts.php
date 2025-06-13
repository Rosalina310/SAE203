<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Mise à jour automatique des statuts d'emprunts
mettreAJourStatutsEmprunts();

// Gestion des filtres
$statutFiltre = $_GET['statut'] ?? '';
$rechercheFiltre = cleanInput($_GET['recherche'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$itemsParPage = 20;
$offset = ($page - 1) * $itemsParPage;

// Récupération des emprunts avec filtres
$emprunts = getEmprunts($statutFiltre, $rechercheFiltre, $itemsParPage, $offset);

// Comptage total pour la pagination
$sqlCount = "SELECT COUNT(*) as total FROM emprunt e
             JOIN media m ON e.media_id = m.id
             JOIN adherent a ON e.adherent_id = a.id
             WHERE 1=1";

$params = [];
if ($statutFiltre) {
    $sqlCount .= " AND e.Statut_Emprunt = :statut";
    $params['statut'] = $statutFiltre;
}
if ($rechercheFiltre) {
    $sqlCount .= " AND (m.Titre LIKE :recherche OR a.Nom LIKE :recherche OR a.Prenom LIKE :recherche)";
    $params['recherche'] = "%$rechercheFiltre%";
}

$stmtCount = $connexion->prepare($sqlCount);
foreach ($params as $key => $value) {
    $stmtCount->bindValue(":$key", $value);
}
$stmtCount->execute();
$totalEmprunts = $stmtCount->fetch()['total'];
$totalPages = ceil($totalEmprunts / $itemsParPage);

// Données pour les sélecteurs
$mediasDisponibles = getMediasDisponibles();
$adherentsActifs = getAdherentsActifs();

$pageTitle = "Gestion des emprunts";
$currentPage = "emprunts";
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
                <a href="emprunts.php" class="nav-link active">
                    <span class="nav-text">Gestion des emprunts</span>
                </a>
                <a href="stock.php" class="nav-link">
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

            <!-- Contenu Emprunts -->
            <div class="page-content">
                <!-- Barre d'actions -->
                <section class="actions-bar">
                    <div class="filters-container">
                        <form method="GET" class="filters-form" id="filtersForm">
                            <div class="filter-group">
                                <select name="statut" class="filter-select" onchange="submitFilters()">
                                    <option value="">Tous les emprunts</option>
                                    <option value="emprunté" <?php echo $statutFiltre === 'emprunté' ? 'selected' : ''; ?>>
                                        Emprunts en cours
                                    </option>
                                    <option value="en retard" <?php echo $statutFiltre === 'en retard' ? 'selected' : ''; ?>>
                                        Emprunts en retard
                                    </option>
                                    <option value="rendu" <?php echo $statutFiltre === 'rendu' ? 'selected' : ''; ?>>
                                        Emprunts rendus
                                    </option>
                                </select>
                            </div>

                            <div class="search-group">
                                <input type="text" 
                                       name="recherche" 
                                       class="search-input" 
                                       placeholder="Rechercher un emprunt..." 
                                       value="<?php echo htmlspecialchars($rechercheFiltre); ?>">
                                <button type="submit" class="search-btn">
                                    <span class="search-icon">🔍</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div class="actions-right">
                        <button class="btn btn-primary" onclick="ouvrirModal('ouvrirModal')">
                            <span class="btn-icon">+</span>
                            Nouveau Prêt
                        </button>
                    </div>
                </section>

                

                <!-- Résultats et statistiques -->
                <section class="results-summary">
                    <div class="summary-stats">
                        <span class="result-count">
                            <?php echo number_format($totalEmprunts); ?> emprunt(s) trouvé(s)
                        </span>
                        <?php if ($rechercheFiltre || $statutFiltre): ?>
                            <a href="emprunts.php" class="clear-filters">
                                Effacer les filtres
                            </a>
                        <?php endif; ?>
                    </div>
                </section>

                <!-- Tableau des emprunts -->
                <section class="emprunts-table-section">
                    <div class="table-container">
                        <table class="data-table emprunts-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>MÉDIA</th>
                                    <th>EMPRUNTEUR</th>
                                    <th>DATE D'EMPRUNT</th>
                                    <th>DATE RETOUR</th>
                                    <th>STATUT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($emprunts)): ?>
                                    <tr>
                                        <td colspan="7" class="empty-state">
                                            <?php if ($rechercheFiltre || $statutFiltre): ?>
                                                Aucun emprunt trouvé avec ces critères
                                            <?php else: ?>
                                                Aucun emprunt enregistré
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($emprunts as $emprunt): ?>
                                        <tr class="emprunt-row <?php echo $emprunt['Statut_Emprunt'] === 'en retard' ? 'overdue' : ''; ?>" 
                                            data-emprunt-id="<?php echo $emprunt['ID_Emprunt']; ?>">
                                            <td class="emprunt-id">
                                                <?php echo str_pad($emprunt['ID_Emprunt'], 3, '0', STR_PAD_LEFT); ?>
                                            </td>
                                            <td class="media-info">
                                                <div class="media-title"><?php echo htmlspecialchars($emprunt['Titre']); ?></div>
                                                <div class="media-author"><?php echo htmlspecialchars($emprunt['Auteur']); ?></div>
                                                <div class="media-exemplaire">Ex. #<?php echo $emprunt['numero_exemplaire']; ?></div>
                                            </td>
                                            <td class="borrower-info">
                                                <div class="borrower-name"><?php echo htmlspecialchars($emprunt['emprunteur_nom']); ?></div>
                                                <div class="borrower-email"><?php echo htmlspecialchars($emprunt['emprunteur_email']); ?></div>
                                            </td>
                                            <td class="loan-date">
                                                <?php echo format_date_fr($emprunt['Date_Emprunt']); ?>
                                            </td>
                                            <td class="return-date">
                                                <?php echo format_date_fr($emprunt['Date_Retour_Prévue']); ?>
                                                <?php if ($emprunt['jours_retard'] > 0): ?>
                                                    <div class="retard-info">
                                                        +<?php echo $emprunt['jours_retard']; ?> jour(s)
                                                    </div>
                                                <?php endif; ?>
                                            </td>
                                            <td class="status-cell">
                                                <span class="status-badge status-<?php echo str_replace(' ', '-', $emprunt['Statut_Emprunt']); ?>">
                                                    <?php 
                                                    switch($emprunt['Statut_Emprunt']) {
                                                        case 'emprunté': echo 'En cours'; break;
                                                        case 'en retard': echo 'En retard'; break;
                                                        case 'rendu': echo 'Rendu'; break;
                                                        default: echo ucfirst($emprunt['Statut_Emprunt']);
                                                    }
                                                    ?>
                                                </span>
                                            </td>
                                            <td class="actions-cell">
                                                <?php if ($emprunt['Statut_Emprunt'] !== 'rendu'): ?>
                                                    <div class="action-buttons">
                                                        <button class="btn-action btn-extend" 
                                                                onclick="prolongerEmprunt(<?php echo $emprunt['ID_Emprunt']; ?>)"
                                                                title="Prolonger l'emprunt">
                                                            Prolonger
                                                        </button>
                                                        
                                                        <button class="btn-action btn-return" 
                                                                onclick="marquerRendu(<?php echo $emprunt['ID_Emprunt']; ?>)"
                                                                title="Marquer comme rendu">
                                                            Rendre
                                                        </button>
                                                        
                                                        <?php if ($emprunt['Statut_Emprunt'] === 'en retard' || $emprunt['jours_retard'] >= -2): ?>
                                                            <button class="btn-action btn-remind" 
                                                                    onclick="relancerAdherent(<?php echo $emprunt['ID_Emprunt']; ?>)"
                                                                    title="Envoyer une relance">
                                                                Relancer
                                                            </button>
                                                        <?php endif; ?>
                                                    </div>
                                                <?php else: ?>
                                                    <span class="text-muted">-</span>
                                                <?php endif; ?>
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
                                    <a href="?page=<?php echo $page-1; ?>&statut=<?php echo urlencode($statutFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link">« Précédent</a>
                                <?php endif; ?>

                                <?php for ($i = max(1, $page-2); $i <= min($totalPages, $page+2); $i++): ?>
                                    <a href="?page=<?php echo $i; ?>&statut=<?php echo urlencode($statutFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link <?php echo $i === $page ? 'active' : ''; ?>">
                                        <?php echo $i; ?>
                                    </a>
                                <?php endfor; ?>

                                <?php if ($page < $totalPages): ?>
                                    <a href="?page=<?php echo $page+1; ?>&statut=<?php echo urlencode($statutFiltre); ?>&recherche=<?php echo urlencode($rechercheFiltre); ?>" 
                                       class="pagination-link">Suivant »</a>
                                <?php endif; ?>
                            </nav>
                        </div>
                    <?php endif; ?>
                </section>
            </div>
        </main>
    </div>

    <!-- Modal Nouvel Emprunt -->
    <div class="modal-overlay" id="modalNouvelEmprunt">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Nouveau Prêt</h3>
                <button class="modal-close" onclick="fermerModal('modalNouvelEmprunt')">&times;</button>
            </div>
            <div class="modal-body">
                <form class="form-container" id="formNouvelEmprunt">
                    <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                    
                    <div class="form-group">
                        <label for="media_id" class="form-label">Média *</label>
                        <select name="media_id" id="media_id" class="form-select" required>
                            <option value="">Sélectionnez un média</option>
                            <?php foreach ($mediasDisponibles as $media): ?>
                                <option value="<?php echo $media['id']; ?>">
                                    <?php echo htmlspecialchars($media['Titre'] . ' - ' . $media['Auteur'] . ' (' . $media['type_nom'] . ')'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="adherent_id" class="form-label">Emprunteur *</label>
                        <select name="adherent_id" id="adherent_id" class="form-select" required>
                            <option value="">Sélectionnez un adhérent</option>
                            <?php foreach ($adherentsActifs as $adherent): ?>
                                <option value="<?php echo $adherent['id']; ?>" data-email="<?php echo htmlspecialchars($adherent['Email']); ?>">
                                    <?php echo htmlspecialchars($adherent['nom_complet']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="duree_jours" class="form-label">Durée (jours)</label>
                            <input type="number" name="duree_jours" id="duree_jours" 
                                   class="form-input" value="21" min="1" max="90">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date de retour prévue</label>
                            <input type="text" id="date_retour_prevue" class="form-input" readonly>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="commentaire" class="form-label">Commentaire (optionnel)</label>
                        <textarea name="commentaire" id="commentaire" class="form-textarea" rows="3" 
                                  placeholder="Remarques particulières..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouvelEmprunt')">
                    Annuler
                </button>
                <button type="submit" form="formNouvelEmprunt" class="btn btn-primary">
                    Enregistrer l'emprunt
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Confirmation Retour -->
    <div class="modal-overlay" id="modalConfirmationRetour">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3 class="modal-title">Confirmer le retour</h3>
                <button class="modal-close" onclick="fermerModal('modalConfirmationRetour')">&times;</button>
            </div>
            <div class="modal-body">
                <p>Êtes-vous sûr de vouloir marquer cet emprunt comme rendu ?</p>
                <div class="emprunt-details" id="detailsRetour">
                    <!-- Détails de l'emprunt à remplir dynamiquement -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="fermerModal('modalConfirmationRetour')">
                    Annuler
                </button>
                <button type="button" class="btn btn-primary" id="btnConfirmerRetour">
                    Confirmer le retour
                </button>
            </div>
        </div>
    </div>

    <script src="../assets/js/admin.js"></script>
</body>
</html>