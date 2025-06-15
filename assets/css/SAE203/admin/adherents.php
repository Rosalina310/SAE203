<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Gestion des filtres
$statutFiltre = $_GET['statut'] ?? '';
$rechercheFiltre = cleanInput($_GET['recherche'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$itemsParPage = 20;
$offset = ($page - 1) * $itemsParPage;

// Récupération des adhérents avec filtres
$adherents = getAdherents($statutFiltre, $rechercheFiltre, $itemsParPage, $offset);

// Comptage total pour la pagination
$sqlCount = "SELECT COUNT(*) as total FROM adherent WHERE 1=1";
$params = [];

if ($statutFiltre) {
    $sqlCount .= " AND Statut = :statut";
    $params['statut'] = $statutFiltre;
}
if ($rechercheFiltre) {
    $sqlCount .= " AND (Nom LIKE :recherche OR Prenom LIKE :recherche OR Email LIKE :recherche)";
    $params['recherche'] = "%$rechercheFiltre%";
}

$stmtCount = $connexion->prepare($sqlCount);
foreach ($params as $key => $value) {
    $stmtCount->bindValue(":$key", $value);
}
$stmtCount->execute();
$totalAdherents = $stmtCount->fetch()['total'];
$totalPages = ceil($totalAdherents / $itemsParPage);

// Statistiques rapides
$stmt = $connexion->query("SELECT COUNT(*) as total FROM adherent WHERE Statut = 'actif'");
$adherentsActifs = $stmt->fetch()['total'];

$stmt = $connexion->query("SELECT COUNT(*) as total FROM adherent WHERE Statut = 'inactif'");
$adherentsInactifs = $stmt->fetch()['total'];

$stmt = $connexion->query("
    SELECT COUNT(DISTINCT adherent_id) as total 
    FROM emprunt 
    WHERE Statut_Emprunt IN ('emprunté', 'en retard')
");
$adherentsAvecEmprunts = $stmt->fetch()['total'];

$pageTitle = "Gestion des adhérents";
$currentPage = "adherents";
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
                <a href="stock.php" class="nav-link">
                    <span class="nav-text">Gestion du stock</span>
                </a>
                <a href="statistiques.php" class="nav-link">
                    <span class="nav-text">Statistiques</span>
                </a>
                <a href="adherents.php" class="nav-link active">
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

            <!-- Contenu Adhérents -->
            <div class="page-content">
                <!-- Statistiques rapides adhérents -->
                <section class="members-stats">
                    <div class="stat-cards-grid">
                        <div class="member-stat-card">
                            <div class="stat-icon active-members-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($adherentsActifs); ?></div>
                                <div class="stat-label">Membres actifs</div>
                            </div>
                        </div>
                        
                        <div class="member-stat-card">
                            <div class="stat-icon borrowing-members-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($adherentsAvecEmprunts); ?></div>
                                <div class="stat-label">Avec emprunts</div>
                            </div>
                        </div>
                        
                        <div class="member-stat-card">
                            <div class="stat-icon inactive-members-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($adherentsInactifs); ?></div>
                                <div class="stat-label">Inactifs</div>
                            </div>
                        </div>
                        
                        <div class="member-stat-card">
                            <div class="stat-icon total-members-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number"><?php echo number_format($totalAdherents); ?></div>
                                <div class="stat-label">Total membres</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Barre d'actions -->
                <section class="actions-bar">
                    <div class="filters-container">
                        <form method="GET" class="filters-form" id="filtersForm">
                            <div class="filter-group">
                                <select name="statut" class="filter-select" onchange="submitFilters()">
                                    <option value="">Tous les statuts</option>
                                    <option value="actif" <?php echo $statutFiltre === 'actif' ? 'selected' : ''; ?>>
                                        Membres actifs
                                    </option>
                                    <option value="inactif" <?php echo $statutFiltre === 'inactif' ? 'selected' : ''; ?>>
                                        Membres inactifs
                                    </option>
                                </select>
                            </div>

                            <div class="search-group">
                                <input type="text" 
                                       name="recherche" 
                                       class="search-input" 
                                       placeholder="Rechercher un adhérent..." 
                                       value="<?php echo htmlspecialchars($rechercheFiltre); ?>">
                                <button type="submit" class="search-btn">
                                    <span class="search-icon">🔍</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div class="actions-right">
                      
                        <button class="btn btn-primary" onclick="ouvrirModal('modalNouvelAdherent')">
    <span class="btn-icon">+</span>
    Ajouter un adhérent
</button>
                    </div>
                </section>

                <!-- Résultats -->
                <section class="results-summary">
                    <div class="summary-stats">
                        <span class="result-count">
                            <?php echo number_format($totalAdherents); ?> adhérent(s) trouvé(s)
                        </span>
                        <?php if ($rechercheFiltre || $statutFiltre): ?>
                            <a href="adherents.php" class="clear-filters">
                                Effacer les filtres
                            </a>
                        <?php endif; ?>
                    </div>
                </section>

                <!-- Tableau des adhérents -->
                <section class="adherents-table-section">
                    <div class="table-container">
                        <table class="data-table adherents-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NOM</th>
                                    <th>PRÉNOM</th>
                                    <th>EMAIL</th>
                                    <th>STATUT</th>
                                    <th>EMPRUNTS ACTIFS</th>
                                    <th>DERNIÈRE ACTIVITÉ</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($adherents)): ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <?php if ($rechercheFiltre || $statutFiltre): ?>
                                                Aucun adhérent trouvé avec ces critères
                                            <?php else: ?>
                                                Aucun adhérent enregistré
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($adherents as $adherent): ?>
                                        <?php
                                        // Récupérer la dernière activité
                                        $stmt = $connexion->prepare("
                                            SELECT MAX(Date_Emprunt) as derniere_activite
                                            FROM emprunt 
                                            WHERE adherent_id = :adherent_id
                                        ");
                                        $stmt->bindParam(':adherent_id', $adherent['id'], PDO::PARAM_INT);
                                        $stmt->execute();
                                        $derniereActivite = $stmt->fetch()['derniere_activite'];
                                        ?>
                                        <tr class="adherent-row <?php echo $adherent['Statut'] === 'inactif' ? 'inactive' : ''; ?>" 
                                            data-adherent-id="<?php echo $adherent['id']; ?>">
                                            <td class="adherent-id">
                                                <?php echo str_pad($adherent['id'], 3, '0', STR_PAD_LEFT); ?>
                                            </td>
                                            <td class="adherent-nom">
                                                <div class="nom-principal"><?php echo htmlspecialchars($adherent['Nom']); ?></div>
                                            </td>
                                            <td class="adherent-prenom">
                                                <div class="prenom-principal"><?php echo htmlspecialchars($adherent['Prenom']); ?></div>
                                            </td>
                                            <td class="adherent-email">
                                                <?php if ($adherent['Email']): ?>
                                                    <a href="mailto:<?php echo htmlspecialchars($adherent['Email']); ?>" 
                                                       class="email-link">
                                                        <?php echo htmlspecialchars($adherent['Email']); ?>
                                                    </a>
                                                <?php else: ?>
                                                    <span class="no-email">Non renseigné</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="statut-cell">
                                                <span class="member-status-badge status-<?php echo $adherent['Statut']; ?>">
                                                    <?php echo ucfirst($adherent['Statut']); ?>
                                                </span>
                                            </td>
                                            <td class="emprunts-actifs-cell">
                                                <div class="emprunts-info">
                                                    <span class="emprunts-count"><?php echo $adherent['nb_emprunts_actifs']; ?></span>
                                                    <?php if ($adherent['nb_emprunts_actifs'] > 0): ?>
                                                        <button class="btn-mini-view" 
                                                                onclick="voirEmpruntsAdherent(<?php echo $adherent['id']; ?>)"
                                                                title="Voir les emprunts">
                                                            👁️
                                                        </button>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                            <td class="derniere-activite">
                                                <?php if ($derniereActivite): ?>
                                                    <span class="date-activite"><?php echo format_date_fr($derniereActivite); ?></span>
                                                    <?php 
                                                    $joursDepuis = (time() - strtotime($derniereActivite)) / (60 * 60 * 24);
                                                    if ($joursDepuis > 365): ?>
                                                        <span class="inactif-badge">Longue inactivité</span>
                                                    <?php elseif ($joursDepuis > 90): ?>
                                                        <span class="peu-actif-badge">Peu actif</span>
                                                    <?php endif; ?>
                                                <?php else: ?>
                                                    <span class="jamais-emprunte">Jamais d'emprunt</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="actions-cell">
                                                <div class="action-buttons">
                                                
                                                    <button class="btn-action btn-edit" 
                                                            onclick="modifierAdherent(<?php echo $adherent['id']; ?>)"
                                                            title="Modifier l'adhérent">
                                                        Modifier
                                                    </button>
                                                    
                                                    <?php if ($adherent['Statut'] === 'actif'): ?>
                                                    
                                                    <?php else: ?>
                                                      
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($adherent['nb_emprunts_actifs'] == 0): ?>
                                                        <button class="btn-action btn-delete" 
                                                                onclick="supprimerAdherent(<?php echo $adherent['id']; ?>)"
                                                                title="Supprimer l'adhérent">
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

   <div class="modal-overlay" id="modalNouvelAdherent">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Ajouter un nouvel adhérent</h3>
            <button class="modal-close" onclick="fermerModal('modalNouvelAdherent')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="formNouvelAdherent" method="POST" action="traitement_nouvel_adherent.php">
                <div class="form-group">
                    <label for="nouveauNom">Nom *</label>
                    <input type="text" id="nouveauNom" name="nom" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="nouveauPrenom">Prénom *</label>
                    <input type="text" id="nouveauPrenom" name="prenom" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="nouveauEmail">Email *</label>
                    <input type="email" id="nouveauEmail" name="email" class="form-control" required>
                </div>
              
                <input type="hidden" name="statut" value="actif">
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="fermerModal('modalNouvelAdherent')">
                Annuler
            </button>
            <button type="submit" form="formNouvelAdherent" class="btn btn-primary">
                Enregistrer l'adhérent
            </button>
        </div>
    </div>
</div>

    <script src="../assets/js/admin.js"></script>
</body>
</html>